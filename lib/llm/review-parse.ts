// Tolerant parsing for model-produced JSON (code fences, stray prose, missing fields).
import type { AuthorReply, Review, ReviewIssue, ReviewResponse } from '@/types'

export function extractJSON(raw: string): unknown {
  const text = raw.replace(/```(?:json)?/gi, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error(`No JSON object in model output: ${raw.slice(0, 200)}`)
  return JSON.parse(text.slice(start, end + 1))
}

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function parseReview(raw: string): Review {
  const o = extractJSON(raw) as Record<string, unknown>
  const issues: ReviewIssue[] = (Array.isArray(o.issues) ? o.issues : [])
    .map((x: any, i: number) => ({
      id: str(x?.id) || `R${i + 1}`,
      severity: oneOf(x?.severity, ['high', 'medium', 'low'] as const, 'medium'),
      category: oneOf(x?.category, ['correctness', 'logic', 'risk', 'missing', 'clarity'] as const, 'logic'),
      point: str(x?.point),
      suggestion: str(x?.suggestion),
    }))
    .filter((x) => x.point)
    .slice(0, 6)
  return {
    verdict: oneOf(o.verdict, ['ship', 'revise', 'rethink'] as const, issues.length ? 'revise' : 'ship'),
    summary: str(o.summary),
    issues,
  }
}

export function parseAuthorReply(raw: string, issueIds: string[]): AuthorReply {
  const o = extractJSON(raw) as Record<string, unknown>
  const byId = new Map<string, ReviewResponse>()
  for (const x of Array.isArray(o.responses) ? o.responses : []) {
    const id = str((x as any)?.id)
    if (!issueIds.includes(id)) continue
    byId.set(id, {
      id,
      decision: oneOf((x as any)?.decision, ['accept', 'reject', 'partial'] as const, 'partial'),
      reason: str((x as any)?.reason),
    })
  }
  // An issue the author silently skipped is treated as unresolved → goes to the user.
  const responses = issueIds.map(
    (id) => byId.get(id) ?? { id, decision: 'reject' as const, reason: '(no response)' }
  )
  const revised = str(o.revised)
  return revised ? { responses, revised } : { responses }
}

/** Issues where the two models still disagree on something that matters → the user decides. */
export function disputedIssueIds(review: Review, reply: AuthorReply): string[] {
  return review.issues
    .filter((iss) => iss.severity !== 'low')
    .filter((iss) => reply.responses.find((r) => r.id === iss.id)?.decision !== 'accept')
    .map((iss) => iss.id)
}
