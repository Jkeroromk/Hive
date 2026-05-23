'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Agent } from '@/types'
import { DECISIONS, ACTION_ITEMS, tx } from '@/lib/hive-data'
import { useHiveStore, HiveMeetingMessage } from '@/lib/hive-store'
import { useT } from '@/lib/i18n'
import AgentCard from './AgentCard'
import { Label } from './Buttons'
import Icon from './Icon'

function AgendaItem({
  children,
  done,
  active,
}: {
  children: React.ReactNode
  done?: boolean
  active?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        color: done
          ? 'var(--text-mute)'
          : active
          ? 'var(--text)'
          : 'var(--text-dim)',
        textDecoration: done ? 'line-through' : 'none',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          flexShrink: 0,
          background: done
            ? 'var(--green)'
            : active
            ? 'var(--amber-tint)'
            : 'transparent',
          border:
            '.5px solid ' +
            (done ? 'var(--green)' : active ? 'var(--amber)' : 'var(--line)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: active ? '0 0 8px var(--amber-glow)' : 'none',
        }}
      >
        {done && (
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bg)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="m4 12 5 5L20 6" />
          </svg>
        )}
        {active && (
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--amber)',
              animation: 'thinkpulse 1.4s ease-in-out infinite',
              display: 'inline-block',
            }}
          />
        )}
      </span>
      <span>{children}</span>
    </div>
  )
}

function DecisionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '.5px solid var(--line)',
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--text)',
      }}
    >
      {children}
    </div>
  )
}

function ActionItem({ who, children }: { who: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '.5px solid var(--line)',
      }}
    >
      <span className="mono" style={{ fontSize: 10, color: 'var(--amber)', whiteSpace: 'nowrap' }}>
        {who}
      </span>
      <span style={{ fontSize: 11.5, color: 'var(--text)' }}>{children}</span>
    </div>
  )
}

function ComposingIndicator({ agent }: { agent: Agent | undefined }) {
  const { t } = useT()
  if (!agent) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        color: 'var(--text-dim)',
        fontSize: 12,
        animation: 'fadein .25s',
      }}
    >
      <span style={{ fontSize: 18 }}>{agent.emoji}</span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--text)' }}>
        {agent.name}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--text-dim)',
              animation: `dotbob 1.2s ease-in-out ${i * 0.18}s infinite`,
              display: 'inline-block',
            }}
          />
        ))}
      </div>
      <span style={{ fontStyle: 'italic' }}>{t('meet.composing')}</span>
    </div>
  )
}

function MeetingMsg({
  m,
  agents,
  streaming,
}: {
  m: HiveMeetingMessage
  agents: Agent[]
  streaming?: boolean
}) {
  const { t } = useT()

  if (m.kind === 'user') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          animation: 'slideup .3s ease-out',
        }}
      >
        <div style={{ maxWidth: '62%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'flex-end',
              marginBottom: 5,
            }}
          >
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
              {m.t}
            </span>
            <span
              className="mono"
              style={{ fontSize: 11.5, color: 'var(--amber)', fontWeight: 600 }}
            >
              {t('meet.you')}
            </span>
          </div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '14px 14px 4px 14px',
              background: 'var(--amber-tint)',
              border: '.5px solid var(--amber)',
              color: 'var(--text)',
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
            {m.text}
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--amber), var(--amber-deep))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--bg)',
            flexShrink: 0,
          }}
        >
          SC
        </div>
      </div>
    )
  }

  const a = agents.find((x) => x.id === m.from)
  if (!a) return null
  return (
    <div
      style={{ display: 'flex', gap: 12, animation: 'slideup .3s ease-out' }}
    >
      <div style={{ flexShrink: 0 }}>
        <AgentCard agent={a} size="sm" showLabel={false} showActions={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}
          >
            {a.name}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>
            {t(a.roleKey)}
          </span>
          <span
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-mute)', marginLeft: 'auto' }}
          >
            {m.t}
          </span>
        </div>
        <div
          style={{
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: '4px 14px 14px 14px',
            background: 'var(--surface)',
            border: '.5px solid var(--line)',
            color: 'var(--text)',
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          {m.text}
          {streaming && (
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 13,
                background: 'var(--amber)',
                marginLeft: 1,
                transform: 'translateY(2px)',
                animation: 'caretblink 1s steps(1) infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface MeetingRoomViewProps {
  agents: Agent[]
  topic: string
  participantIds: string[]
  meetingId: string
  onClose: () => void
}

export default function MeetingRoomView({
  agents,
  topic,
  participantIds,
  meetingId,
  onClose,
}: MeetingRoomViewProps) {
  const { t, lang } = useT()
  const [messages, setMessages] = useState<HiveMeetingMessage[]>([])
  const [streamingAgentId, setStreamingAgentId] = useState<string | null>(null)
  const [isRoundStreaming, setIsRoundStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startRef = useRef(Date.now())
  const hasStarted = useRef(false)

  const { addMeetingMessage, appendToLastMeetingMessage, endCurrentMeeting } =
    useHiveStore()

  const attendees = participantIds
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as Agent[]

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingAgentId])

  const fetchRound = useCallback(
    async (history: HiveMeetingMessage[]) => {
      if (isRoundStreaming) return
      setIsRoundStreaming(true)

      try {
        const res = await fetch('/api/hive/meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            participantIds,
            history: history.map((m) => ({
              from: m.from,
              kind: m.kind,
              text: m.text,
            })),
          }),
        })

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buf += decoder.decode(value, { stream: true })
          const parts = buf.split('\n\n')
          buf = parts.pop() ?? ''

          for (const part of parts) {
            const lines = part.split('\n')
            const eventLine = lines.find((l) => l.startsWith('event: '))
            const dataLine = lines.find((l) => l.startsWith('data: '))
            if (!eventLine || !dataLine) continue

            const eventType = eventLine.slice(7)
            try {
              const data = JSON.parse(dataLine.slice(6))

              if (eventType === 'agent-start') {
                const newMsg: HiveMeetingMessage = {
                  id: crypto.randomUUID(),
                  from: data.agentId,
                  kind: 'agent',
                  t: new Date().toTimeString().slice(0, 5),
                  text: '',
                }
                setMessages((prev) => [...prev, newMsg])
                addMeetingMessage(meetingId, newMsg)
                setStreamingAgentId(data.agentId)
              } else if (eventType === 'delta') {
                setMessages((prev) => {
                  const msgs = [...prev]
                  const last = msgs[msgs.length - 1]
                  if (last && last.from === data.agentId) {
                    msgs[msgs.length - 1] = {
                      ...last,
                      text: last.text + data.text,
                    }
                  }
                  return msgs
                })
                appendToLastMeetingMessage(meetingId, data.text)
              } else if (eventType === 'agent-done') {
                setStreamingAgentId(null)
              } else if (eventType === 'meeting-done') {
                setIsRoundStreaming(false)
              }
            } catch {}
          }
        }
      } catch {
        setIsRoundStreaming(false)
      } finally {
        setStreamingAgentId(null)
        setIsRoundStreaming(false)
      }
    },
    [
      topic,
      participantIds,
      meetingId,
      isRoundStreaming,
      addMeetingMessage,
      appendToLastMeetingMessage,
    ]
  )

  // Auto-start first round on mount
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    fetchRound([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendUserMsg = () => {
    if (!input.trim() || isRoundStreaming) return
    const ts = new Date().toTimeString().slice(0, 5)
    const userMsg: HiveMeetingMessage = {
      id: crypto.randomUUID(),
      from: 'user',
      kind: 'user',
      t: ts,
      text: input.trim(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    addMeetingMessage(meetingId, userMsg)
    setInput('')
    fetchRound(next)
  }

  const handleEnd = () => {
    endCurrentMeeting(meetingId)
    onClose()
  }

  const agendaItems =
    lang === 'zh'
      ? ['Cohort 拆解走查', '识别根因', '提议干预', '定义成功指标']
      : [
          'Cohort split walkthrough',
          'Identify root cause',
          'Propose intervention',
          'Define success metric',
        ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        animation: 'fadein .25s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '.5px solid var(--line-soft)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 11px',
              background: 'var(--amber-tint)',
              border: '.5px solid var(--amber)',
              borderRadius: 99,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--amber)',
                boxShadow: '0 0 8px var(--amber)',
                animation: 'thinkpulse 1.6s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--amber)',
                letterSpacing: '.1em',
                textTransform: lang === 'zh' ? 'none' : 'uppercase',
                fontWeight: 600,
              }}
            >
              {t('meet.live')} · {formatElapsed(elapsed)}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-.01em',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {topic}
            </div>
            <div
              className="mono"
              style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}
            >
              {new Date(startRef.current).toTimeString().slice(0, 5)} ·{' '}
              {t('meet.attending').replace('%n', String(attendees.length))}
            </div>
          </div>
        </div>

        {/* Attendee row */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 18 }}>
          {attendees.map((a, i) => (
            <div
              key={a.id}
              style={{ marginLeft: i === 0 ? 0 : -18, zIndex: attendees.length - i }}
            >
              <AgentCard agent={a} size="sm" showLabel={false} showActions={false} />
            </div>
          ))}
        </div>

        <button
          onClick={handleEnd}
          style={{
            appearance: 'none',
            border: '.5px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text-dim)',
            borderRadius: 8,
            padding: '7px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="close" size={13} />
          <span>{t('meet.exit')}</span>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Transcript */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '28px 36px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {messages.length === 0 && !isRoundStreaming && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-mute)',
                fontSize: 13,
                marginTop: 40,
              }}
            >
              {lang === 'zh' ? '会议开始中…' : 'Starting meeting…'}
            </div>
          )}
          {messages.map((m) => (
            <MeetingMsg
              key={m.id}
              m={m}
              agents={agents}
              streaming={streamingAgentId === m.from && m === messages[messages.length - 1]}
            />
          ))}
          {streamingAgentId && messages[messages.length - 1]?.from !== streamingAgentId && (
            <ComposingIndicator agent={agents.find((a) => a.id === streamingAgentId)} />
          )}
        </div>

        {/* Side panel */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderLeft: '.5px solid var(--line-soft)',
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            overflow: 'auto',
            background: 'var(--surface)',
          }}
        >
          <div>
            <Label>{t('meet.agenda')}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agendaItems.map((item, i) => (
                <AgendaItem
                  key={i}
                  done={i === 0}
                  active={i === 1}
                >
                  {item}
                </AgendaItem>
              ))}
            </div>
          </div>
          <div>
            <Label>
              {t('meet.decisions')}{' '}
              <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>
                · {t('meet.decisionsHint')}
              </span>
            </Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DECISIONS.map((d, i) => (
                <DecisionCard key={i}>{tx(d, lang)}</DecisionCard>
              ))}
            </div>
          </div>
          <div>
            <Label>{t('meet.actions')}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ACTION_ITEMS.map((it, i) => (
                <ActionItem key={i} who={it.who}>
                  {tx(it.text, lang)}
                </ActionItem>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          padding: '14px 32px 22px',
          borderTop: '.5px solid var(--line-soft)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 14,
            background: 'var(--surface)',
            border: `.5px solid ${input ? 'var(--amber)' : 'var(--line)'}`,
            boxShadow: input ? '0 0 0 4px var(--amber-tint)' : 'none',
            transition: 'border-color .2s',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendUserMsg()
              }
            }}
            placeholder={t('meet.placeholder')}
            style={{
              flex: 1,
              minHeight: 38,
              maxHeight: 120,
              resize: 'none',
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 13.5,
              lineHeight: 1.5,
              padding: '8px 4px',
            }}
          />
          <button
            onClick={sendUserMsg}
            disabled={!input.trim() || isRoundStreaming}
            style={{
              appearance: 'none',
              border: 0,
              background:
                input.trim() && !isRoundStreaming
                  ? 'var(--amber)'
                  : 'var(--surface-2)',
              color:
                input.trim() && !isRoundStreaming
                  ? 'var(--bg)'
                  : 'var(--text-mute)',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '9px 14px',
              borderRadius: 8,
              cursor:
                input.trim() && !isRoundStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow:
                input.trim() && !isRoundStreaming
                  ? '0 0 16px var(--amber-glow)'
                  : 'none',
            }}
          >
            <Icon name="send" size={13} />
            {t('meet.speak')}
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            fontSize: 11,
            color: 'var(--text-mute)',
          }}
        >
          <span className="mono">
            ↵ {lang === 'zh' ? '发送' : 'send'} · ⇧↵{' '}
            {lang === 'zh' ? '换行' : 'newline'}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              style={{
                appearance: 'none',
                border: 0,
                background: 'transparent',
                color: 'var(--text-dim)',
                fontFamily: 'inherit',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {t('meet.summarise')}
            </button>
            <button
              onClick={handleEnd}
              style={{
                appearance: 'none',
                border: '.5px solid var(--red)',
                background: 'transparent',
                color: 'var(--red)',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 500,
                padding: '5px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {t('meet.end')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
