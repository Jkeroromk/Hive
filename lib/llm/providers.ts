// Server-only: how to reach each provider. Never import this from a client component.
import type { Agent, ModelRef, ProviderId } from '@/types'
import { MODELS, PROVIDER_LABELS, parseModelRef } from '@/lib/models'

export interface ProviderConfig {
  id: ProviderId
  label: string
  /** 'anthropic' = Messages API via @anthropic-ai/sdk; 'openai' = Chat Completions over fetch. */
  format: 'anthropic' | 'openai'
  baseURL?: string
  apiKey: () => string | undefined
  /** Send stream_options.include_usage (only for endpoints known to accept it). */
  streamUsage?: boolean
  extraHeaders?: Record<string, string>
}

const env = (...names: string[]) => () => {
  for (const n of names) {
    const v = process.env[n]
    if (v) return v
  }
  return undefined
}

// To add a provider: add its id to ProviderId (types), a label in lib/models.ts, and an entry here.
// Any OpenAI-compatible endpoint (DeepSeek, Mistral, Ollama, vLLM…) only needs a baseURL + key.
export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    label: PROVIDER_LABELS.anthropic,
    format: 'anthropic',
    apiKey: env('ANTHROPIC_API_KEY'),
  },
  meta: {
    id: 'meta',
    label: PROVIDER_LABELS.meta,
    format: 'openai',
    baseURL: process.env.META_BASE_URL || 'https://api.meta.ai/v1',
    // Meta's own docs call it MODEL_API_KEY; META_API_KEY is accepted so it's obvious in .env
    apiKey: env('META_API_KEY', 'MODEL_API_KEY'),
  },
  groq: {
    id: 'groq',
    label: PROVIDER_LABELS.groq,
    format: 'openai',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: env('GROQ_API_KEY'),
    streamUsage: true,
  },
  openrouter: {
    id: 'openrouter',
    label: PROVIDER_LABELS.openrouter,
    format: 'openai',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env('OPENROUTER_API_KEY'),
    streamUsage: true,
    extraHeaders: { 'X-Title': 'Hive' },
  },
  openai: {
    id: 'openai',
    label: PROVIDER_LABELS.openai,
    format: 'openai',
    baseURL: 'https://api.openai.com/v1',
    apiKey: env('OPENAI_API_KEY'),
    streamUsage: true,
  },
}

export function isConfigured(provider: ProviderId): boolean {
  return Boolean(PROVIDERS[provider]?.apiKey())
}

/** HIVE_DEFAULT_MODEL, else Claude if its key is set, else Groq if its key is set, else Claude. */
export function defaultModel(): ModelRef {
  const fromEnv = parseModelRef(process.env.HIVE_DEFAULT_MODEL)
  if (fromEnv) return fromEnv
  if (isConfigured('anthropic')) return MODELS.claudeSonnet
  if (isConfigured('groq')) return MODELS.llama70b
  return MODELS.claudeSonnet
}

/** Env name for a per-agent override, e.g. rv-muse → HIVE_MODEL_RV_MUSE */
export function agentModelEnvName(agentId: string): string {
  return 'HIVE_MODEL_' + agentId.toUpperCase().replace(/[^A-Z0-9]/g, '_')
}

/** Per-agent env override > model pinned in lib/hive-data.ts > default. */
export function resolveAgentModel(agent: Pick<Agent, 'id' | 'model'>): ModelRef {
  return parseModelRef(process.env[agentModelEnvName(agent.id)]) ?? agent.model ?? defaultModel()
}
