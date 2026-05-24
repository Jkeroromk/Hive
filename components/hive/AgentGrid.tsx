'use client'
import { useEffect, useRef, useState } from 'react'
import { Agent } from '@/types'
import { sv, tx } from '@/lib/hive-data'
import { useT } from '@/lib/i18n'

// ─── AgentRow ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Agent['status'] }) {
  const dot  = sv(status, 'dotVar')
  const glow = sv(status, 'glowVar')
  const isAnimated = status === 'thinking'
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: dot, display: 'inline-block', flexShrink: 0,
      boxShadow: glow !== 'transparent' ? `0 0 6px ${dot}` : 'none',
      animation: isAnimated ? 'thinkpulse 1.4s ease-in-out infinite' : 'none',
    }} />
  )
}

function QuickBtn({
  label, onClick,
}: { label: string; onClick: (e: React.MouseEvent) => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        appearance: 'none', border: `.5px solid ${hover ? 'var(--amber)' : 'var(--line)'}`,
        background: hover ? 'var(--amber-tint)' : 'var(--surface-2)',
        color: hover ? 'var(--amber)' : 'var(--text-dim)',
        fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
        padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function AgentRow({
  agent, narrow, onSelect, onAssign, onInvite, onRemove,
}: {
  agent: Agent
  narrow: boolean
  onSelect: (a: Agent) => void
  onAssign: (a: Agent) => void
  onInvite: (a: Agent) => void
  onRemove: (a: Agent) => void
}) {
  const { t, lang } = useT()
  const [hover, setHover] = useState(false)

  const dot  = sv(agent.status, 'dotVar')
  const glow = sv(agent.status, 'glowVar')
  const hasGlow = glow !== 'transparent'

  const isWorking  = agent.status === 'working'
  const isThinking = agent.status === 'thinking'
  const isMeeting  = agent.status === 'in-meeting'
  const isDone     = agent.status === 'done'

  const accentBg = isWorking
    ? 'linear-gradient(90deg, var(--amber-tint) 0%, transparent 60%)'
    : isMeeting
    ? 'linear-gradient(90deg, rgba(123,91,224,.07) 0%, transparent 60%)'
    : isThinking
    ? 'linear-gradient(90deg, rgba(245,158,11,.05) 0%, transparent 60%)'
    : isDone
    ? 'linear-gradient(90deg, rgba(47,156,102,.05) 0%, transparent 60%)'
    : 'transparent'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: narrow ? 10 : 14,
        padding: narrow ? '11px 14px' : '14px 20px',
        borderRadius: 14,
        background: hover ? 'var(--surface-2)' : 'var(--surface)',
        border: `.5px solid ${hover ? 'var(--line)' : 'var(--line-soft)'}`,
        cursor: 'pointer',
        boxShadow: hasGlow && (isWorking || isThinking)
          ? `0 0 18px ${glow}`
          : hover ? '0 4px 14px rgba(0,0,0,.07)' : 'none',
        animation: isWorking ? 'breathe 3.4s ease-in-out infinite' : 'none',
        transition: 'background .15s, border-color .15s, box-shadow .2s',
      }}
      onClick={() => onSelect(agent)}
    >
      {/* accent wash */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: accentBg, borderRadius: 'inherit',
      }} />

      {/* Avatar */}
      <div style={{
        width: narrow ? 40 : 48, height: narrow ? 40 : 48,
        borderRadius: 12, flexShrink: 0,
        background: 'var(--bg)',
        border: `.5px solid ${hasGlow ? dot : 'var(--line)'}`,
        boxShadow: hasGlow ? `0 0 10px ${glow}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: narrow ? 20 : 24,
        filter: agent.status === 'idle' ? 'grayscale(.4) opacity(.75)' : 'none',
        transition: 'filter .2s',
        zIndex: 1,
      }}>
        {agent.emoji}
      </div>

      {/* Identity */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        {/* Name · Role on one line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span className="mono" style={{
            fontSize: narrow ? 12.5 : 13.5, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-.01em', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {agent.name}
          </span>
          <span style={{ width: 1, height: 12, background: 'var(--line)', flexShrink: 0 }} />
          <span style={{
            fontSize: narrow ? 10.5 : 11.5, color: 'var(--text-dim)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {t(agent.roleKey)}
          </span>
        </div>

        {/* Status dot + specialty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <StatusDot status={agent.status} />
          {!narrow && (
            <span style={{
              fontSize: 11, color: 'var(--text-mute)',
              display: '-webkit-box', WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {tx(agent.specialty, lang)}
            </span>
          )}
        </div>
      </div>

      {/* Actions — desktop: always visible; mobile: hidden */}
      {!narrow && (
        <div
          style={{
            display: 'flex', gap: 6, alignItems: 'center', zIndex: 1,
            opacity: hover ? 1 : 0.4, transition: 'opacity .15s',
          }}
          onClick={e => e.stopPropagation()}
        >
          <QuickBtn label={t('hex.task')} onClick={() => onAssign(agent)} />
          <QuickBtn label={t('hex.meet')} onClick={() => onInvite(agent)} />
          <button
            onClick={() => onRemove(agent)}
            title={t('hex.remove')}
            style={{
              appearance: 'none', border: 0, background: 'transparent',
              color: 'var(--text-mute)', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center',
              opacity: hover ? 1 : 0, transition: 'opacity .15s, color .15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--red)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-mute)')}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile tap actions */}
      {narrow && hover && (
        <div
          style={{ display: 'flex', gap: 5, zIndex: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <QuickBtn label={t('hex.task')} onClick={() => onAssign(agent)} />
          <QuickBtn label={t('hex.meet')} onClick={() => onInvite(agent)} />
        </div>
      )}
    </div>
  )
}

// ─── AgentGrid ────────────────────────────────────────────────────────────────

interface AgentGridProps {
  agents: Agent[]
  onSelectAgent: (a: Agent) => void
  onAssign: (a: Agent) => void
  onInvite: (a: Agent) => void
  onRemove: (a: Agent) => void
  glowMul?: number
}

export default function AgentGrid({
  agents, onSelectAgent, onAssign, onInvite, onRemove,
}: AgentGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(800)

  useEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      setContainerW(containerRef.current!.getBoundingClientRect().width)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Breakpoints
  const narrow = containerW < 540        // single column, compact rows
  const medium = containerW >= 540 && containerW < 960  // single column, full rows
  const cols   = containerW >= 960 ? 2 : 1              // 2-col grid on wide

  if (agents.length === 0) {
    return (
      <div ref={containerRef} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: 'var(--text-dim)', padding: '80px 24px',
      }}>
        <div style={{ fontSize: 40, opacity: .35 }}>⬡</div>
        <div className="serif" style={{ fontSize: 20, color: 'var(--text)' }}>The hive is empty</div>
        <div style={{ fontSize: 13 }}>Recruit your first agent to get started</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: narrow ? '14px 12px 24px' : '20px 28px 32px',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: narrow ? 7 : 9,
        maxWidth: 1200, margin: '0 auto',
      }}>
        {agents.map((agent, i) => (
          <div
            key={agent.id}
            style={{ animation: `flyin .4s ${i * 25}ms cubic-bezier(.2,.7,.2,1) both` }}
          >
            <AgentRow
              agent={agent}
              narrow={narrow}
              onSelect={onSelectAgent}
              onAssign={onAssign}
              onInvite={onInvite}
              onRemove={onRemove}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
