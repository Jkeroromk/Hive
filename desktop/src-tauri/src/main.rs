// Hive desktop shell: a native window around the Hive web app, plus the things
// a browser tab can't do — tray, global hotkey, close-to-tray, auto-update.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Url, WindowEvent,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_updater::UpdaterExt;

const MAIN: &str = "main";

fn toggle_shortcut() -> Shortcut {
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyH)
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn toggle_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        let visible = w.is_visible().unwrap_or(false);
        let focused = w.is_focused().unwrap_or(false);
        if visible && focused {
            let _ = w.hide();
        } else {
            show_main(app);
        }
    }
}

/// URL of a page bundled in the app (the local start page in ../shell).
fn local_url(path: &str) -> Url {
    #[cfg(windows)]
    let base = "http://tauri.localhost/";
    #[cfg(not(windows))]
    let base = "tauri://localhost/";
    Url::parse(base).and_then(|b| b.join(path)).expect("valid app url")
}

/// Send the main window back to the start page so the server address can be changed.
fn open_server_setup(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        let _ = w.navigate(local_url("index.html?setup=1"));
    }
    show_main(app);
}

/// Check GitHub Releases for a newer version. `manual` = user clicked "check for updates".
fn check_for_update(app: AppHandle, manual: bool) {
    tauri::async_runtime::spawn(async move {
        let result = async {
            let Some(update) = app.updater()?.check().await? else {
                if manual {
                    app.dialog()
                        .message("已经是最新版本。")
                        .title("Hive")
                        .kind(MessageDialogKind::Info)
                        .show(|_| {});
                }
                return Ok(());
            };

            let version = update.version.clone();
            let dialog_app = app.clone();
            let confirmed = tauri::async_runtime::spawn_blocking(move || {
                dialog_app
                    .dialog()
                    .message(format!("发现新版本 {version}，现在更新吗？更新完成后会自动重启。"))
                    .title("Hive 更新")
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        "更新并重启".into(),
                        "稍后".into(),
                    ))
                    .blocking_show()
            })
            .await
            .unwrap_or(false);

            if confirmed {
                update.download_and_install(|_, _| {}, || {}).await?;
                app.restart();
            }
            Ok::<(), tauri_plugin_updater::Error>(())
        }
        .await;

        if let Err(e) = result {
            eprintln!("update check failed: {e}");
            if manual {
                app.dialog()
                    .message(format!("检查更新失败：{e}"))
                    .title("Hive")
                    .kind(MessageDialogKind::Error)
                    .show(|_| {});
            }
        }
    });
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "显示 Hive（Ctrl+Shift+H）", true, None::<&str>)?;
    let server = MenuItem::with_id(app, "server", "更改服务器地址…", true, None::<&str>)?;
    let update = MenuItem::with_id(app, "update", "检查更新", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出 Hive", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &server, &update, &sep, &quit])?;

    let mut tray = TrayIconBuilder::with_id("hive-tray")
        .tooltip("Hive")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main(app),
            "server" => open_server_setup(app),
            "update" => check_for_update(app.clone(), true),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        // Must be first: a second launch just focuses the running window.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed && *shortcut == toggle_shortcut() {
                        toggle_main(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            let handle = app.handle().clone();
            build_tray(&handle)?;

            // Another app may already own the hotkey — that shouldn't stop Hive from starting.
            if let Err(e) = handle.global_shortcut().register(toggle_shortcut()) {
                eprintln!("could not register Ctrl+Shift+H: {e}");
            }

            #[cfg(not(debug_assertions))]
            check_for_update(handle, false);

            Ok(())
        })
        // Closing the window keeps Hive running in the tray; quit from the tray menu.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == MAIN {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Hive");
}
