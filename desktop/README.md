# Hive Desktop

Tauri 2 桌面壳。它只是一个原生窗口，加载你部署好的 Hive 网页版；模型调用和 API Key 都留在服务器上。

窗口之外加了这些：

- 系统托盘常驻，关闭窗口只是隐藏到托盘，从托盘菜单退出
- 全局快捷键 `Ctrl+Shift+H` 呼出 / 隐藏
- 单实例：再次打开只会把已有窗口调到前面
- 首次启动填服务器地址；连不上时显示重试页；托盘菜单可以改地址
- 启动时检查 GitHub Releases，有新版本弹窗提示，确认后自动更新并重启

## 本地开发

```bash
# 终端 1：在仓库根目录跑 Hive
npm run dev

# 终端 2：跑桌面壳
cd desktop
npm install
npm run dev
```

首次打开填 `http://localhost:3000`。

## 发布前的一次性设置

1. 生成更新签名密钥（也可以直接用 KillCam 那把）：

   ```bash
   cd desktop
   npx tauri signer generate -w ~/.tauri/hive.key
   ```

2. 把输出的 **public key** 填进 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`，替换掉 `REPLACE_WITH_YOUR_TAURI_UPDATER_PUBLIC_KEY`。

3. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `TAURI_SIGNING_PRIVATE_KEY`：`~/.tauri/hive.key` 文件的内容
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：生成时设的密码（没设就留空字符串）

## 发新版本

```bash
# 改 desktop/package.json 里的 version，比如 0.2.0，提交后：
git tag desktop-v0.2.0
git push origin desktop-v0.2.0
```

GitHub Actions 会在 Windows 上打包、签名，发布 Release 和 `latest.json`。已安装的 Hive 下次启动会提示更新。

没有付费代码签名证书，第一次安装时 Windows SmartScreen 会提示"未知发布者"，点"更多信息 → 仍要运行"即可。
