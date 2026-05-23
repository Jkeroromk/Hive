'use client'
import { useT } from '@/lib/i18n'
import Icon from './Icon'

function HiveLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="hive-hex-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--amber-soft)" />
          <stop offset="1" stopColor="var(--amber-deep)" />
        </linearGradient>
      </defs>
      <polygon points="11,4 17,4 20,9 17,14 11,14 8,9"   fill="url(#hive-hex-g)" opacity=".5" />
      <polygon points="22,11 28,11 31,16 28,21 22,21 19,16" fill="url(#hive-hex-g)" opacity=".75" />
      <polygon points="14,18 20,18 23,23 20,28 14,28 11,23" fill="url(#hive-hex-g)" />
    </svg>
  )
}

function ThemeToggle({ theme, onTheme }: { theme: string; onTheme: (t: string) => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => onTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      style={{
        appearance: 'none', border: '.5px solid var(--line)',
        background: 'var(--surface)', color: 'var(--text-dim)',
        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={14} />
    </button>
  )
}

function LangToggle({ lang, onLang }: { lang: string; onLang: (l: string) => void }) {
  return (
    <div style={{
      display: 'flex', padding: 2, borderRadius: 8,
      background: 'var(--surface-2)', border: '.5px solid var(--line)',
    }}>
      {['en', 'zh'].map(l => (
        <button key={l} onClick={() => onLang(l)} style={{
          appearance: 'none', border: 0, borderRadius: 6,
          background: lang === l ? 'var(--surface)' : 'transparent',
          color: lang === l ? 'var(--text)' : 'var(--text-mute)',
          fontFamily: l === 'zh' ? "'Noto Sans SC',sans-serif" : 'inherit',
          fontSize: 11, fontWeight: 600, letterSpacing: '.02em',
          padding: '3px 9px', cursor: 'pointer',
          boxShadow: lang === l ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
          transition: 'all .15s',
        }}>
          {l === 'en' ? 'EN' : '中'}
        </button>
      ))}
    </div>
  )
}

interface TopNavProps {
  workingCount: number
  current: string
  onNav: (id: string) => void
  theme: string
  onTheme: (t: string) => void
  lang: string
  onLang: (l: string) => void
}

export default function TopNav({ workingCount, current, onNav, theme, onTheme, lang, onLang }: TopNavProps) {
  const { t } = useT()

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'meetings',  label: t('nav.meetings') },
    { id: 'tasks',     label: t('nav.tasks') },
    { id: 'activity',  label: t('nav.activity') },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px', borderBottom: '.5px solid var(--line-soft)',
      background: 'var(--backdrop)', backdropFilter: 'blur(20px)',
      position: 'relative', zIndex: 10, flexShrink: 0,
    }}>
      {/* Left: logo + brand + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HiveLogo size={22} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)' }}>
            {t('app.name')}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)',
            boxShadow: '0 0 8px var(--amber)',
            animation: 'thinkpulse 2.4s ease-in-out infinite',
            display: 'inline-block',
          }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
            {t('nav.working').replace('%n', String(workingCount))}
          </span>
        </div>
      </div>

      {/* Center: tab nav */}
      <div style={{ display: 'flex', gap: 2 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            appearance: 'none', border: 0, background: 'transparent',
            color: current === item.id ? 'var(--text)' : 'var(--text-mute)',
            fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 8,
            cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
          }}>
            {item.label}
            {current === item.id && (
              <span style={{
                position: 'absolute', left: '50%', bottom: -7,
                transform: 'translateX(-50%)', width: 18, height: 1.5,
                background: 'var(--amber)', borderRadius: 1,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Right: theme, lang, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LangToggle lang={lang} onLang={onLang} />
        <ThemeToggle theme={theme} onTheme={onTheme} />
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 6px' }} />
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--amber), var(--amber-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 12, color: 'var(--bg)',
        }}>SC</div>
      </div>
    </div>
  )
}
