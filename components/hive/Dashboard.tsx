'use client'
import { Agent, Status } from '@/types'
import { STATUS_CONFIG, sv } from '@/lib/hive-data'
import { useT } from '@/lib/i18n'
import AgentGrid from './AgentGrid'

function StatusLegend({ counts }: { counts: Partial<Record<Status, number>> }) {
  const { t } = useT()
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
      {(Object.keys(STATUS_CONFIG) as Status[]).map(k => {
        const dot  = sv(k, 'dotVar')
        const txt  = sv(k, 'textVar')
        const glow = sv(k, 'glowVar')
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: dot,
              boxShadow: glow !== 'transparent' ? `0 0 6px ${dot}` : 'none',
              display: 'inline-block',
            }} />
            <span style={{ color: txt }}>{t('status.' + k)}</span>
            <span className="mono" style={{ color: 'var(--text-mute)', fontSize: 10.5 }}>{counts[k] || 0}</span>
          </div>
        )
      })}
    </div>
  )
}

interface DashboardProps {
  agents: Agent[]
  onSelectAgent: (a: Agent) => void
  onAssign: (a: Agent) => void
  onInvite: (a: Agent) => void
  onRemove: (a: Agent) => void
  glowMul?: number
}

export default function Dashboard({ agents, onSelectAgent, onAssign, onInvite, onRemove, glowMul = 1 }: DashboardProps) {
  const { t } = useT()

  const counts: Partial<Record<Status, number>> = {}
  agents.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '28px 40px 12px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-.025em', color: 'var(--text)' }}>
            {t('nav.dashboard')}
          </h1>
          <p className="serif" style={{ margin: '4px 0 0', fontSize: 18, color: 'var(--text-dim)' }}>
            {t('app.tagline')}
          </p>
        </div>
        <StatusLegend counts={counts} />
      </div>

      {/* Grid */}
      <AgentGrid
        agents={agents}
        onSelectAgent={onSelectAgent}
        onAssign={onAssign}
        onInvite={onInvite}
        onRemove={onRemove}
        glowMul={glowMul}
      />
    </div>
  )
}
