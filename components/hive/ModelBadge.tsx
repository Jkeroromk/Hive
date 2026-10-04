'use client'
import type { ProviderId } from '@/types'
import { useT } from '@/lib/i18n'
import { useAgentModels } from '@/lib/use-agent-models'

const TONE: Partial<Record<ProviderId, string>> = {
  anthropic: 'var(--amber)',
  meta: 'var(--purple)',
  groq: 'var(--green)',
}

/** Small pill showing which model an agent runs on; red if its API key is missing. */
export default function ModelBadge({ agentId, showModel = false }: { agentId: string; showModel?: boolean }) {
  const info = useAgentModels()?.agents[agentId]
  const { t } = useT()
  if (!info) return null

  const color = info.configured ? TONE[info.provider] ?? 'var(--text-dim)' : 'var(--red)'
  return (
    <span
      className="mono"
      title={info.configured ? `${info.provider}:${info.model}` : `${info.provider}:${info.model} — ${t('model.notConfigured')}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9.5,
        letterSpacing: '.04em',
        padding: '2px 7px',
        borderRadius: 99,
        border: `.5px solid ${color}`,
        color,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {info.label}
      {showModel && <span style={{ opacity: 0.7 }}>· {info.model}</span>}
      {!info.configured && <span>· {t('model.notConfigured')}</span>}
    </span>
  )
}
