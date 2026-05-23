'use client'
import { useState, CSSProperties } from 'react'
import { Agent } from '@/types'
import { sv } from '@/lib/hive-data'
import { useT } from '@/lib/i18n'

interface AgentCardProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  onClick?: () => void
  onAssign?: (a: Agent) => void
  onInvite?: (a: Agent) => void
  onRemove?: (a: Agent) => void
  showLabel?: boolean
  showActions?: boolean
  glowMul?: number
}

function QuickBtn({ label, onClick, sc }: { label: string; onClick: (e: React.MouseEvent) => void; sc: number }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 0,
      background: 'var(--amber)', color: 'var(--bg)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10 * sc, letterSpacing: '.04em',
      padding: `${4 * sc}px ${10 * sc}px`,
      borderRadius: 99, cursor: 'pointer',
      textTransform: 'uppercase', fontWeight: 600,
      boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    }}>{label}</button>
  )
}

export default function AgentCard({
  agent, size = 'md', selected = false,
  onClick, onAssign, onInvite, onRemove,
  showLabel = true, showActions = true,
  glowMul = 1,
}: AgentCardProps) {
  const { t, lang } = useT()
  const [hover, setHover] = useState(false)

  const scales: Record<string, number> = { sm: 0.5, md: 1, lg: 1.22 }
  const sc = scales[size] || 1
  const w = 168 * sc
  const h = 168 * sc

  const dot  = sv(agent.status, 'dotVar')
  const txt  = sv(agent.status, 'textVar')
  const glow = sv(agent.status, 'glowVar')
  const hasGlow = glow !== 'transparent'

  const isWorking  = agent.status === 'working'
  const isThinking = agent.status === 'thinking'
  const isMeeting  = agent.status === 'in-meeting'
  const isDone     = agent.status === 'done'
  const isActive   = isWorking || isThinking || isMeeting || isDone

  const accentBg = isWorking
    ? 'linear-gradient(165deg, var(--amber-tint), transparent 70%)'
    : isMeeting
    ? 'linear-gradient(165deg, rgba(123,91,224,.08), transparent 70%)'
    : isThinking
    ? 'linear-gradient(165deg, rgba(245,158,11,.05), transparent 70%)'
    : isDone
    ? 'linear-gradient(165deg, rgba(47,156,102,.06), transparent 70%)'
    : 'transparent'

  const cardStyle: CSSProperties = {
    position: 'relative',
    width: w, height: h,
    borderRadius: 18 * sc,
    cursor: onClick ? 'pointer' : 'default',
    background: 'var(--surface)',
    border: `.5px solid ${selected ? 'var(--amber)' : (hover && onClick ? 'var(--hex-ring-hover)' : 'var(--line)')}`,
    boxShadow: hasGlow && (isWorking || isThinking)
      ? `0 0 ${(isWorking ? 24 : 14) * glowMul}px ${glow}`
      : (hover && onClick ? '0 6px 20px rgba(0,0,0,.10)' : 'none'),
    animation: isWorking ? 'breathe 3.4s ease-in-out infinite' : 'none',
    transition: 'border-color .2s, box-shadow .25s, transform .2s',
    transform: hover && onClick ? 'translateY(-1px)' : 'none',
    overflow: 'hidden',
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={cardStyle}
    >
      {/* Accent wash */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          background: accentBg,
          pointerEvents: 'none',
        }} />
      )}

      {/* Status badge — top-left */}
      <div style={{
        position: 'absolute', top: 12 * sc, left: 12 * sc,
        display: 'flex', alignItems: 'center', gap: 5 * sc,
      }}>
        <span style={{
          width: 5.5 * sc, height: 5.5 * sc, borderRadius: '50%', background: dot,
          boxShadow: hasGlow ? `0 0 6px ${dot}` : 'none',
          animation: isThinking ? 'thinkpulse 1.4s ease-in-out infinite' : 'none',
          display: 'inline-block',
        }} />
        {showLabel && size !== 'sm' && (
          <span className="mono" style={{
            fontSize: 9 * sc, color: txt,
            letterSpacing: '.08em',
            textTransform: lang === 'zh' ? 'none' : 'uppercase',
            fontWeight: 600,
          }}>{t('status.' + agent.status)}</span>
        )}
      </div>

      {/* Avatar emoji */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6 * sc, padding: 14 * sc, pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 42 * sc, lineHeight: 1,
          filter: agent.status === 'idle' ? 'grayscale(.5) opacity(.7)' : 'none',
          marginTop: 8 * sc,
        }}>{agent.emoji}</div>
      </div>

      {/* Name + role — bottom */}
      {showLabel && (
        <div style={{
          position: 'absolute', bottom: 14 * sc, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * sc,
          padding: `0 ${10 * sc}px`, pointerEvents: 'none',
        }}>
          <div className="mono" style={{
            fontSize: 11.5 * sc, fontWeight: 600, color: 'var(--text)',
            letterSpacing: '-.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
          }}>{agent.name}</div>
          {size !== 'sm' && (
            <div style={{
              fontSize: 10 * sc, color: 'var(--text-dim)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
            }}>{t(agent.roleKey)}</div>
          )}
        </div>
      )}

      {/* Remove button — top-right on hover */}
      {hover && onRemove && size !== 'sm' && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(agent) }}
          aria-label={t('hex.remove')}
          style={{
            position: 'absolute', top: 10 * sc, right: 10 * sc,
            width: 22 * sc, height: 22 * sc,
            appearance: 'none', border: 0, borderRadius: '50%',
            background: 'var(--surface)', color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,.18), 0 0 0 .5px var(--line)',
            zIndex: 3, animation: 'fadein .15s ease-out',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)' }}
        >
          <svg width={11 * sc} height={11 * sc} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}

      {/* Quick actions — center on hover */}
      {hover && showActions && onClick && size !== 'sm' && (onAssign || onInvite) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', gap: 4 * sc,
          animation: 'fadein .15s ease-out', zIndex: 2,
        }}>
          {onAssign && <QuickBtn label={t('hex.task')} onClick={(e) => { e.stopPropagation(); onAssign(agent) }} sc={sc} />}
          {onInvite && <QuickBtn label={t('hex.meet')} onClick={(e) => { e.stopPropagation(); onInvite(agent) }} sc={sc} />}
        </div>
      )}
    </div>
  )
}
