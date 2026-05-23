'use client'
import { Agent } from '@/types'
import { tx, sv } from '@/lib/hive-data'
import { useT } from '@/lib/i18n'
import AgentCard from './AgentCard'
import { PrimaryBtn, SoftBtn, Label } from './Buttons'
import Icon from './Icon'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-mute)', letterSpacing: '.08em' }}>{label}</span>
      <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

interface ProfileModalProps {
  agent: Agent | null
  onClose: () => void
  onAssign: (a: Agent) => void
  onInvite: (a: Agent) => void
}

export default function ProfileModal({ agent, onClose, onAssign, onInvite }: ProfileModalProps) {
  const { t, lang } = useT()
  if (!agent) return null

  const dot  = sv(agent.status, 'dotVar')
  const txt  = sv(agent.status, 'textVar')
  const glow = sv(agent.status, 'glowVar')

  const lastOutputLines = lang === 'zh' ? [
    { color: 'var(--amber-soft)', text: '# /auth 审计 — 发现（草稿）' },
    { color: 'var(--text-dim)',   text: '1. /v1/login 使用 30 天 session 且无轮换 — 风险。' },
    { color: 'var(--text-dim)',   text: '2. refresh 接口对 `client_id` 没有限流。' },
    { color: 'var(--text-dim)',   text: '3. api.ts:441 仍接入旧的 `/oauth/v0` ↗' },
    { color: 'var(--green)',      text: '4. 提议：短期 JWT (15m) + 不透明 refresh…' },
  ] : [
    { color: 'var(--amber-soft)', text: '# /auth audit — findings (draft)' },
    { color: 'var(--text-dim)',   text: '1. /v1/login uses 30-day sessions w/o rotation — risk.' },
    { color: 'var(--text-dim)',   text: '2. refresh endpoint lacks rate-limit on `client_id`.' },
    { color: 'var(--text-dim)',   text: '3. legacy `/oauth/v0` still wired in api.ts:441 ↗' },
    { color: 'var(--green)',      text: '4. proposed: short-lived JWT (15m) + opaque refresh…' },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 40,
      background: 'var(--backdrop)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadein .2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, maxWidth: '90vw',
        borderRadius: 18, overflow: 'hidden',
        background: 'var(--surface)', border: '.5px solid var(--line)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'flyin .3s cubic-bezier(.2,.7,.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 22px', borderBottom: '.5px solid var(--line-soft)',
          display: 'flex', gap: 22, alignItems: 'center', position: 'relative',
        }}>
          <AgentCard agent={agent} size="md" showLabel={false} showActions={false} glowMul={1.2} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: dot,
                boxShadow: glow !== 'transparent' ? `0 0 8px ${dot}` : 'none',
                display: 'inline-block',
              }} />
              <span className="mono" style={{
                fontSize: 10, color: txt,
                textTransform: lang === 'zh' ? 'none' : 'uppercase',
                letterSpacing: '.1em', fontWeight: 600,
              }}>{t('status.' + agent.status)}</span>
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-.01em' }}>
              {agent.name}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 2 }}>{t(agent.roleKey)}</div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.55, color: 'var(--text-dim)' }}>
              {tx(agent.specialty, lang)}
            </div>
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            appearance: 'none', border: '.5px solid var(--line)',
            background: 'var(--surface)', color: 'var(--text-dim)',
            width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="close" size={13} />
          </button>
        </div>

        {/* Current task */}
        {agent.task && (
          <div style={{ padding: '18px 28px', borderBottom: '.5px solid var(--line-soft)' }}>
            <Label>{t('prof.currentTask')}</Label>
            <div style={{
              padding: '12px 14px',
              background: agent.status === 'working' ? 'var(--amber-tint)' : 'var(--surface-2)',
              border: `.5px solid ${agent.status === 'working' ? 'var(--amber)' : 'var(--line)'}`,
              borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: dot,
                boxShadow: glow !== 'transparent' ? `0 0 8px ${dot}` : 'none',
                marginTop: 6, flexShrink: 0, display: 'inline-block',
                animation: agent.status === 'thinking' ? 'thinkpulse 1.4s ease-in-out infinite' : 'none',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{tx(agent.task, lang)}</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10.5, color: 'var(--text-mute)' }}>
                  <span className="mono">{t('prof.started')}</span>
                  <span className="mono">{t('prof.eta')}</span>
                  <span className="mono">{t('prof.complete')}</span>
                </div>
                <div style={{ marginTop: 6, height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: '42%', height: '100%',
                    background: 'linear-gradient(90deg, var(--amber), var(--amber-soft))',
                    boxShadow: '0 0 10px var(--amber-glow)',
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last output */}
        <div style={{ padding: '18px 28px', borderBottom: '.5px solid var(--line-soft)' }}>
          <Label>{t('prof.lastOutput')}</Label>
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg)', border: '.5px solid var(--line)',
            fontSize: 12, lineHeight: 1.6, color: 'var(--text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            maxHeight: 120, overflow: 'hidden', position: 'relative',
          }}>
            {lastOutputLines.map((l, i) => (
              <div key={i} style={{ color: l.color }}>{l.text}</div>
            ))}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 32,
              background: 'linear-gradient(transparent, var(--bg))',
            }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{
          padding: '18px 28px', borderBottom: '.5px solid var(--line-soft)',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18,
        }}>
          <Stat label={t('prof.tasks')}   value={agent.tasks} />
          <Stat label={t('prof.avgResp')} value={`${(agent.avgMs / 1000).toFixed(2)}s`} />
          <Stat label={t('prof.joined')}  value={t('prof.daysAgo').replace('%n', String(agent.joinedDays))} />
          <Stat label={t('prof.success')} value="96%" />
        </div>

        {/* Actions */}
        <div style={{ padding: '18px 28px', display: 'flex', gap: 10 }}>
          <PrimaryBtn icon="bolt" onClick={() => onAssign(agent)} style={{ width: 'auto' }}>
            {t('prof.assignBtn')}
          </PrimaryBtn>
          <SoftBtn icon="meeting" onClick={() => onInvite(agent)}>
            {t('prof.inviteBtn')}
          </SoftBtn>
        </div>
      </div>
    </div>
  )
}
