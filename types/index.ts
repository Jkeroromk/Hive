// Hive types
export type Status = 'idle' | 'thinking' | 'working' | 'in-meeting' | 'done'

export interface I18nField {
  en: string
  zh: string
}

/** Which LLM backend an agent runs on. See lib/models.ts for the registry. */
export type ProviderId = 'anthropic' | 'meta' | 'groq' | 'openrouter' | 'openai'

export interface ModelRef {
  provider: ProviderId
  model: string
}

export interface Agent {
  id: string
  name: string
  emoji: string
  roleKey: string
  specialty: I18nField
  status: Status
  task: I18nField | null
  tasks: number
  avgMs: number
  joinedDays: number
  tilt: number
  /** Pin this agent to a specific model. Omit to use HIVE_DEFAULT_MODEL. */
  model?: ModelRef
}

// ─── Cross-model review ──────────────────────────────────────────────────────

export type ReviewSeverity = 'high' | 'medium' | 'low'
export type ReviewVerdict = 'ship' | 'revise' | 'rethink'

export interface ReviewIssue {
  id: string // R1, R2, …
  severity: ReviewSeverity
  category: 'correctness' | 'logic' | 'risk' | 'missing' | 'clarity'
  point: string
  suggestion: string
}

export interface Review {
  verdict: ReviewVerdict
  summary: string
  issues: ReviewIssue[]
}

export interface ReviewResponse {
  id: string // matches ReviewIssue.id
  decision: 'accept' | 'reject' | 'partial'
  reason: string
}

export interface AuthorReply {
  responses: ReviewResponse[]
  /** Full revised output, present only when the author accepted something material. */
  revised?: string
}
