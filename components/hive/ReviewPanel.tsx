'use client'
import { useState, type ReactNode } from 'react'
import type { Agent, AuthorReply, Review, ReviewIssue, ReviewResponse } from '@/types'
import { useT } from '@/lib/i18n'
import { useHiveStore } from '@/lib/hive-store'
import { SoftBtn } from './Buttons'
import ModelBadge from './ModelBadge'

type Phase = 'idle' | 'reviewing' | 'replying' | 'done' | 'error'

const SEVERITY_COLOR: Record<ReviewIssue['severity'], string> = {
  high: 'var(--red)',
  medium: 'var(--amber)',
  low: 'var(--text-mute)',
}

const DECISION_COLOR: Record<ReviewResponse['decision'], string> = {
  accept: 'var(--green)',
  partial: 'var(--amber)',
  reject: 'var(--red)',
}

/**
 * Cross-model review of one task output:
 * reviewer critiques → author responds → contested medium/high issues are flagged for the user.
 */
export default function ReviewPanel({
  author,
  reviewer,
  task,
  output,
}: {
  author: Agent
  reviewer: Agent
  task: string
  output: string
}) {
  const { t } = useT()
  const workspace = useHiveStore((s) => s.workspace)
  const addTokenUsage = useHiveStore((s) => s.addTokenUsage)
  const addTaskRecord = useHiveStore((s) => s.addTaskRecord)

  const [phase, setPhase] = useState<Phase>('idle')
  const [review, setReview] = useState<Review | null>(null)
  const [reply, setReply] = useState<AuthorReply | null>(null)
  const [disputed, setDisputed] = useState<string[]>([])
  const [error, setError] = useState('')
  const [savedRevised, setSavedRevised] = useState(false)

  const run = async () => {
    setPhase('reviewing')
    setReview(null)
    setReply(null)
    setDisputed([])
    setError('')
    setSavedRevised(false)

    try {
      const res = await fetch('/api/hive/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: author.id,
          reviewerId: reviewer.id,
          task,
          output,
          workspace: workspace ?? undefined,
        }),
      })
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let finished = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          const ev = lines.find((l) => l.startsWith('event: '))?.slice(7)
          const raw = lines.find((l) => l.startsWith('data: '))?.slice(6)
          if (!ev || !raw) continue
          let data: any
          try {
            data = JSON.parse(raw)
          } catch {
            continue
          }

          if (ev === 'usage') addTokenUsage(data.promptTokens ?? 0, data.completionTokens ?? 0)
          else if (ev === 'review-done') setReview(data.review)
          else if (ev === 'reply-start') setPhase('replying')
          else if (ev === 'reply-done') setReply(data.reply)
          else if (ev === 'done') {
            setDisputed(data.disputed ?? [])
            setPhase('done')
            finished = true
          } else if (ev === 'error') throw new Error(data.message ?? 'Review failed')
        }
      }
      if (!finished) throw new Error('Review stream ended early')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }

  const saveRevised = () => {
    if (!reply?.revised) return
    addTaskRecord({
      id: crypto.randomUUID(),
      agentId: author.id,
      agentName: author.name,
      agentEmoji: author.emoji,
      task: `${task}  ↺ ${reviewer.name}`,
      output: reply.revised,
      timestamp: Date.now(),
    })
    setSavedRevised(true)
  }

  if (phase === 'idle' || phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SoftBtn icon="sparks" onClick={run}>
          {t('review.ask').replace('%n', reviewer.name)}
        </SoftBtn>
        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    )
  }

  const busy = phase === 'reviewing' || phase === 'replying'
  const responseFor = (id: string) => reply?.responses.find((r) => r.id === id)

  return (
    <div
      style={{
        padding: '14px 14px 16px',
        background: 'var(--surface-2)',
        border: '.5px solid var(--purple)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'slideup .4s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16 }}>{reviewer.emoji}</span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
          {reviewer.name}
        </span>
        <ModelBadge agentId={reviewer.id} />
        {review && (
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--purple)' }}>
            {t('review.verdict.' + review.verdict)}
          </span>
        )}
      </div>

      {busy && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {phase === 'reviewing'
            ? t('review.reviewing').replace('%n', reviewer.name)
            : t('review.replying').replace('%n', author.name)}
        </div>
      )}

      {review?.summary && (
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)' }}>{review.summary}</div>
      )}

      {review && review.issues.length === 0 && phase === 'done' && (
        <div style={{ fontSize: 12, color: 'var(--green)' }}>{t('review.noIssues')}</div>
      )}

      {phase === 'done' && disputed.length > 0 && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--amber)',
            background: 'var(--amber-tint)',
            border: '.5px solid var(--amber)',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          {t('review.disputes').replace('%n', String(disputed.length))}
        </div>
      )}

      {/* Issues + the author's response to each */}
      {review?.issues.map((iss) => {
        const r = responseFor(iss.id)
        const isDisputed = disputed.includes(iss.id)
        return (
          <div
            key={iss.id}
            style={{
              border: `.5px solid ${isDisputed ? 'var(--amber)' : 'var(--line)'}`,
              borderRadius: 10,
              padding: '10px 12px',
              background: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{iss.id}</span>
              <span
                className="mono"
                style={{ fontSize: 9.5, color: SEVERITY_COLOR[iss.severity], textTransform: 'uppercase' }}
              >
                {iss.severity}
              </span>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-mute)' }}>{iss.category}</span>
              {isDisputed && (
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--amber)' }}>
                  {t('review.needsYou')}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>{iss.point}</div>
            {iss.suggestion && (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>→ {iss.suggestion}</div>
            )}
            {r && (
              <div
                style={{
                  borderTop: '.5px solid var(--line-soft)',
                  paddingTop: 6,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'var(--text-dim)',
                }}
              >
                <span style={{ fontSize: 13, marginRight: 4 }}>{author.emoji}</span>
                <span className="mono" style={{ fontSize: 10.5, color: DECISION_COLOR[r.decision], marginRight: 6 }}>
                  {t('review.' + r.decision)}
                </span>
                {r.reason}
              </div>
            )}
          </div>
        )
      })}

      {/* Revised output, if the author changed anything */}
      {reply?.revised && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>{t('review.revised')}</div>
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.6,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              maxHeight: 280,
              overflowY: 'auto',
              background: 'var(--bg)',
              border: '.5px solid var(--line)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            {reply.revised}
          </div>
          <SoftBtn icon="check" onClick={savedRevised ? undefined : saveRevised}>
            {savedRevised ? t('review.saved') : t('review.useRevised')}
          </SoftBtn>
        </div>
      )}
    </div>
  )
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        lineHeight: 1.55,
        color: 'var(--red)',
        background: 'rgba(248,113,113,.08)',
        border: '.5px solid var(--red)',
        borderRadius: 8,
        padding: '8px 12px',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </div>
  )
}
