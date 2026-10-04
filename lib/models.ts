// Client-safe model registry: labels and shorthands only, no keys or URLs.
// Server-side connection details live in lib/llm/providers.ts.
import type { ModelRef, ProviderId } from '@/types'

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic:  'Claude',
  meta:       'Muse',
  groq:       'Groq',
  openrouter: 'OpenRouter',
  openai:     'OpenAI',
}

/** Handy shorthands for pinning agents in lib/hive-data.ts. */
export const MODELS = {
  claudeSonnet: { provider: 'anthropic', model: 'claude-sonnet-5-5' },
  claudeOpus:   { provider: 'anthropic', model: 'claude-opus-5-5' },
  claudeHaiku:  { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  museSpark:    { provider: 'meta',      model: 'muse-spark-1.3' },
  llama70b:     { provider: 'groq',      model: 'llama-3.3-70b-versatile' },
} satisfies Record<string, ModelRef>

const PROVIDER_IDS = Object.keys(PROVIDER_LABELS) as ProviderId[]

/** Parse "anthropic:claude-sonnet-5-5" → ModelRef. Returns null if malformed. */
export function parseModelRef(s: string | undefined | null): ModelRef | null {
  if (!s) return null
  const i = s.indexOf(':')
  if (i <= 0) return null
  const provider = s.slice(0, i) as ProviderId
  const model = s.slice(i + 1).trim()
  if (!PROVIDER_IDS.includes(provider) || !model) return null
  return { provider, model }
}

/** What the UI shows on an agent's model badge, as returned by /api/hive/models. */
export interface AgentModelInfo {
  provider: ProviderId
  model: string
  label: string
  configured: boolean
}
