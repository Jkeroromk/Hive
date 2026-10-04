// One streaming interface over every provider. Routes call streamChat()/completeChat()
// and never touch an SDK directly.
import Anthropic from '@anthropic-ai/sdk'
import type { ModelRef } from '@/types'
import { PROVIDERS, type ProviderConfig } from './providers'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  system: string
  messages: ChatTurn[]
  maxTokens: number
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'usage'; promptTokens: number; completionTokens: number }

export class ProviderError extends Error {}

export async function* streamChat(ref: ModelRef, req: ChatRequest): AsyncGenerator<StreamChunk> {
  const cfg = PROVIDERS[ref.provider]
  if (!cfg) throw new ProviderError(`Unknown provider "${ref.provider}"`)
  const key = cfg.apiKey()
  if (!key) {
    throw new ProviderError(
      `${cfg.label} (${ref.model}) is not configured — add its API key to .env.local. See .env.example.`
    )
  }
  if (cfg.format === 'anthropic') yield* streamAnthropic(key, ref.model, req)
  else yield* streamOpenAICompatible(cfg, key, ref.model, req)
}

/** Collect a full response (used for structured JSON steps like review). */
export async function completeChat(
  ref: ModelRef,
  req: ChatRequest,
  onUsage?: (u: { promptTokens: number; completionTokens: number }) => void
): Promise<string> {
  let out = ''
  for await (const c of streamChat(ref, req)) {
    if (c.type === 'text') out += c.text
    else onUsage?.(c)
  }
  return out
}

// ─── Anthropic Messages API ──────────────────────────────────────────────────

const anthropicClients = new Map<string, Anthropic>()

async function* streamAnthropic(key: string, model: string, req: ChatRequest): AsyncGenerator<StreamChunk> {
  let client = anthropicClients.get(key)
  if (!client) {
    client = new Anthropic({ apiKey: key })
    anthropicClients.set(key, client)
  }

  const stream = await client.messages.create({
    model,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: req.messages,
    stream: true,
  })

  let promptTokens = 0
  let completionTokens = 0
  for await (const ev of stream) {
    if (ev.type === 'message_start') {
      promptTokens = ev.message.usage.input_tokens
    } else if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
      yield { type: 'text', text: ev.delta.text }
    } else if (ev.type === 'message_delta') {
      completionTokens = ev.usage.output_tokens
    }
  }
  yield { type: 'usage', promptTokens, completionTokens }
}

// ─── OpenAI-compatible Chat Completions (Meta, Groq, OpenRouter, OpenAI…) ────

async function* streamOpenAICompatible(
  cfg: ProviderConfig,
  key: string,
  model: string,
  req: ChatRequest
): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...cfg.extraHeaders,
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens,
      stream: true,
      ...(cfg.streamUsage ? { stream_options: { include_usage: true } } : {}),
      messages: [{ role: 'system', content: req.system }, ...req.messages],
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new ProviderError(`${cfg.label} ${res.status}: ${body.slice(0, 300) || res.statusText}`)
  }

  yield* parseOpenAISSE(res.body)
}

/** Exported for tests. Parses an OpenAI-style SSE byte stream into chunks. */
export async function* parseOpenAISSE(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let sawUsage = false

  const handleLine = function* (line: string): Generator<StreamChunk, boolean> {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return false
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]') return true
    let chunk: any
    try {
      chunk = JSON.parse(payload)
    } catch {
      return false
    }
    if (chunk.error) throw new ProviderError(chunk.error.message ?? JSON.stringify(chunk.error))
    const text = chunk.choices?.[0]?.delta?.content
    if (text) yield { type: 'text', text }
    const usage = chunk.usage ?? chunk.x_groq?.usage
    if (usage && !sawUsage) {
      sawUsage = true
      yield {
        type: 'usage',
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
      }
    }
    return false
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const finished = yield* handleLine(line)
      if (finished) {
        reader.cancel().catch(() => {})
        return
      }
    }
  }
  if (buf) yield* handleLine(buf)
}
