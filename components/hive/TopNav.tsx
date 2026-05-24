'use client'
import { UserButton } from '@clerk/nextjs'
import { useT } from '@/lib/i18n'

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

function SettingsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}


interface TopNavProps {
  workingCount: number
  current: string
  onNav: (id: string) => void
  onSetup: () => void
  hasWorkspace: boolean
}

export default function TopNav({ workingCount, current, onNav, onSetup, hasWorkspace }: TopNavProps) {
  const { t } = useT()

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'meetings',  label: t('nav.meetings') },
    { id: 'tasks',     label: t('nav.tasks') },
    { id: 'projects',  label: t('nav.projects') },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '.5px solid var(--line-soft)',
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

      {/* Center: tab nav — hidden on mobile via .topnav-center */}
      <div className="topnav-center" style={{ display: 'flex', gap: 2 }}>
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

      {/* Right: setup, theme, lang, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={onSetup}
          title="设置"
          style={{
            appearance: 'none', border: `.5px solid ${hasWorkspace ? 'var(--line)' : 'var(--amber)'}`,
            background: hasWorkspace ? 'var(--surface)' : 'var(--amber-tint)',
            color: hasWorkspace ? 'var(--text-dim)' : 'var(--amber)',
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s', position: 'relative',
          }}
        >
          <SettingsIcon size={14} />
          {!hasWorkspace && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--amber)', border: '1.5px solid var(--bg)',
            }} />
          )}
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 6px' }} />
        <UserButton />
      </div>
    </div>
  )
}
