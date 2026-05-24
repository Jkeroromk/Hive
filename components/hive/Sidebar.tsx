'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Agent, Status } from '@/types'
import { tx, sv } from '@/lib/hive-data'
import { useHiveStore, TaskRecord, WorkspaceContext } from '@/lib/hive-store'
import { useT } from '@/lib/i18n'
import Icon from './Icon'
import AgentCard from './AgentCard'
import { PrimaryBtn, Label } from './Buttons'

// ─── File Upload helpers ──────────────────────────────────────────────────────

interface UploadedFile {
  id: string
  name: string
  size: number
  mimeType: string
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function FileChip({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px 4px 6px', borderRadius: 99,
      background: 'var(--surface-2)', border: '.5px solid var(--line)',
      fontSize: 11, color: 'var(--text-dim)', maxWidth: 180,
    }}>
      <Icon name="file" size={11} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {file.name}
      </span>
      <span style={{ color: 'var(--text-mute)', flexShrink: 0 }}>{fmtBytes(file.size)}</span>
      <button onClick={onRemove} style={{
        appearance: 'none', border: 0, background: 'transparent',
        color: 'var(--text-mute)', cursor: 'pointer', padding: 0, lineHeight: 1,
        display: 'flex', alignItems: 'center',
      }}>
        <Icon name="close" size={10} />
      </button>
    </div>
  )
}

function FileDropZone({
  uploading,
  onFiles,
}: {
  uploading: boolean
  onFiles: (files: FileList) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      style={{
        border: `.5px dashed ${dragOver ? 'var(--amber)' : 'var(--line)'}`,
        borderRadius: 10, padding: '10px 14px',
        background: dragOver ? 'var(--amber-tint)' : 'transparent',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', transition: 'all .15s',
        color: 'var(--text-mute)', fontSize: 12,
      }}
    >
      <Icon name={uploading ? 'clock' : 'upload'} size={14} />
      <span>{uploading ? 'Uploading…' : 'Attach files — drop or click'}</span>
      <input
        ref={fileRef} type="file" multiple style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,.json,.ts,.tsx,.py,.go"
        onChange={e => e.target.files?.length && onFiles(e.target.files)}
      />
    </div>
  )
}

// ─── Task History helpers ─────────────────────────────────────────────────────

function TaskHistoryPanel() {
  const { t } = useT()
  const taskHistory = useHiveStore(s => s.taskHistory)
  const clearTaskHistory = useHiveStore(s => s.clearTaskHistory)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (taskHistory.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10, color: 'var(--text-mute)', padding: 24 }}>
        <Icon name="history" size={24} />
        <div style={{ fontSize: 12.5 }}>{t('hist.empty')}</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 80px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button onClick={clearTaskHistory} style={{
          appearance: 'none', border: '.5px solid var(--line)', borderRadius: 7,
          background: 'transparent', color: 'var(--text-mute)', fontFamily: 'inherit',
          fontSize: 11, padding: '4px 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="trash" size={11} />
          {t('hist.clear')}
        </button>
      </div>
      {taskHistory.map(r => (
        <div key={r.id} style={{
          border: '.5px solid var(--line)', borderRadius: 10, overflow: 'hidden',
        }}>
          <button onClick={() => setExpanded(x => x === r.id ? null : r.id)} style={{
            width: '100%', appearance: 'none', border: 0,
            background: 'var(--surface-2)', textAlign: 'left', padding: '10px 12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{r.agentEmoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.agentName}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.task}
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-mute)', flexShrink: 0 }}>
              {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Icon name={expanded === r.id ? 'chevron-up' : 'chevron-down'} size={12} />
          </button>
          {expanded === r.id && (
            <div style={{
              padding: '10px 12px', borderTop: '.5px solid var(--line-soft)',
              background: 'var(--bg)', fontSize: 12, lineHeight: 1.6,
              color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto',
            }}>
              {r.output}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 0,
        borderRadius: 7,
        background: active ? 'var(--surface)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-mute)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 12px',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}

function AgentPicker({
  agents,
  onSelect,
  title,
}: {
  agents: Agent[]
  onSelect: (a: Agent) => void
  title: string
}) {
  const { t } = useT()
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px 22px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            style={{
              appearance: 'none',
              border: '.5px solid var(--line)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              borderRadius: 10,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20 }}>{a.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                {a.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {t(a.roleKey)}
              </div>
            </div>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: sv(a.status, 'dotVar'),
                display: 'inline-block',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function getAgentPrompts(agentId: string, lang: string): string[] {
  const map: Record<string, { en: string[]; zh: string[] }> = {
    'pm-ming': {
      en: ['Draft product roadmap for next quarter', 'Prioritize feature backlog', 'Write a one-pager for stakeholders', 'Define success metrics for launch'],
      zh: ['起草下季度产品路线图', '整理功能待办优先级', '写利益相关者一页纸', '定义上线成功指标'],
    },
    'dev-taro': {
      en: ['Review architecture decisions', 'Identify technical debt risks', 'Draft engineering hiring spec', 'Evaluate build vs buy tradeoffs'],
      zh: ['审查架构决策', '识别技术债风险', '起草工程招聘规格', '评估自建还是采购'],
    },
    'mk-juno': {
      en: ['Draft go-to-market strategy', 'Write launch email campaign', 'Identify top growth levers', 'Create competitive positioning'],
      zh: ['起草市场进入策略', '写上线邮件营销', '识别增长关键杠杆', '创建竞争差异定位'],
    },
    'sl-finn': {
      en: ['Write sales email sequence', 'Identify ideal customer profile', 'Draft objection handling guide', 'Analyze pipeline conversion'],
      zh: ['写销售邮件序列', '定义理想客户画像', '起草异议处理指南', '分析销售漏斗转化'],
    },
    'fn-orion': {
      en: ['Build Q3 budget forecast', 'Model fundraising scenarios', 'Identify cost reduction opportunities', 'Draft investor update'],
      zh: ['构建Q3预算预测', '建立融资情景模型', '识别降本机会', '起草投资人更新'],
    },
    'wr-sage': {
      en: ['Write team all-hands email', 'Draft press release', 'Create investor narrative', 'Polish executive presentation'],
      zh: ['写全员大会邮件', '起草新闻稿', '创建投资人叙事', '打磨高管演示文稿'],
    },
  }
  const fallback = {
    en: ['Summarize key decisions needed', 'Draft weekly team update', 'Identify top 3 risks this week', 'Create action plan'],
    zh: ['总结需要的关键决策', '起草每周团队更新', '识别本周前三大风险', '制定行动计划'],
  }
  const entry = map[agentId] ?? fallback
  return lang === 'zh' ? entry.zh : entry.en
}

function AssignTaskPanel({
  agent,
  agents,
  onSelectAgent,
  onAgentStatusChange,
}: {
  agent: Agent | null
  agents: Agent[]
  onSelectAgent: (a: Agent) => void
  onAgentStatusChange?: (agentId: string, status: Status) => void
}) {
  const { t, lang } = useT()
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [streamError, setStreamError] = useState('')
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const addTaskRecord = useHiveStore((s) => s.addTaskRecord)
  const addTokenUsage = useHiveStore((s) => s.addTokenUsage)
  const workspace = useHiveStore((s) => s.workspace)

  useEffect(() => {
    setIsStreaming(false)
    setOutput('')
    setStreamError('')
    setText('')
    setUploads([])
  }, [agent?.id])

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true)
    const results: UploadedFile[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          results.push({ id: data.id, name: file.name, size: file.size, mimeType: file.type })
        }
      } catch {}
    }
    setUploads(prev => [...prev, ...results])
    setUploading(false)
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const prompts = getAgentPrompts(agent?.id ?? '', lang)

  const handleAssign = async () => {
    if (!agent || !text.trim() || isStreaming) return

    setIsStreaming(true)
    setOutput('')
    setStreamError('')
    onAgentStatusChange?.(agent.id, 'thinking')

    try {
      const res = await fetch('/api/hive/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          task: text,
          uploadIds: uploads.length ? uploads.map(u => u.id) : undefined,
          workspace: workspace ?? undefined,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let fullContent = ''

      onAgentStatusChange?.(agent.id, 'working')

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
            if (eventType === 'delta') {
              fullContent += data.text
              setOutput((prev) => prev + data.text)
            } else if (eventType === 'done') {
              const record: TaskRecord = {
                id: crypto.randomUUID(),
                agentId: agent.id,
                agentName: agent.name,
                agentEmoji: agent.emoji,
                task: text,
                output: data.fullContent ?? fullContent,
                timestamp: Date.now(),
              }
              addTaskRecord(record)
              setUploads([])
              onAgentStatusChange?.(agent.id, 'done')
            } else if (eventType === 'usage') {
              addTokenUsage(data.promptTokens ?? 0, data.completionTokens ?? 0)
            } else if (eventType === 'error') {
              setStreamError(data.message ?? 'Something went wrong. Check your GROQ_API_KEY in .env.local')
              onAgentStatusChange?.(agent.id, 'idle')
            }
          } catch {}
        }
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Network error — could not reach the API')
      onAgentStatusChange?.(agent.id, 'idle')
    } finally {
      setIsStreaming(false)
    }
  }

  if (!agent)
    return (
      <AgentPicker
        agents={agents}
        onSelect={onSelectAgent}
        title={t('side.pickAgent')}
      />
    )

  const dot = sv(agent.status, 'dotVar')
  const txt = sv(agent.status, 'textVar')
  const glow = sv(agent.status, 'glowVar')
  const role = t(agent.roleKey)

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '18px 18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Agent identity */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <AgentCard agent={agent} size="sm" showLabel={false} showActions={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="mono"
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}
          >
            {agent.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            {role}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: dot,
                boxShadow: glow !== 'transparent' ? `0 0 6px ${dot}` : 'none',
                display: 'inline-block',
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: txt,
                textTransform: lang === 'zh' ? 'none' : 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              {t('status.' + agent.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-dim)',
          lineHeight: 1.55,
          padding: '12px 14px',
          background: 'var(--surface-2)',
          border: '.5px solid var(--line-soft)',
          borderRadius: 10,
        }}
      >
        {tx(agent.specialty, lang)}
      </div>

      {/* Current task */}
      {agent.task && (
        <div>
          <Label>{t('side.currentTask')}</Label>
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--amber-tint)',
              border: '.5px solid var(--amber)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12.5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--amber)',
                boxShadow: '0 0 8px var(--amber)',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text)' }}>{tx(agent.task, lang)}</span>
          </div>
        </div>
      )}

      {/* Task input */}
      <div>
        <Label>{t('side.newTask')}</Label>
        <div
          style={{
            border: `.5px solid ${text ? 'var(--amber)' : 'var(--line)'}`,
            borderRadius: 12,
            background: 'var(--bg)',
            padding: 12,
            transition: 'border-color .2s',
            boxShadow: text ? '0 0 0 4px var(--amber-tint)' : 'none',
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('side.taskPlaceholder').replace('%n', agent.name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAssign()
            }}
            style={{
              width: '100%',
              minHeight: 96,
              resize: 'vertical',
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          />
          <div
            className="mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: 10,
              color: 'var(--text-mute)',
              marginTop: 4,
            }}
          >
            {text.length}/2000
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setText(p)}
              style={{
                appearance: 'none',
                border: '.5px solid var(--line)',
                background: 'var(--surface-2)',
                color: 'var(--text-dim)',
                fontFamily: 'inherit',
                fontSize: 11,
                padding: '5px 9px',
                borderRadius: 99,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* File attachments */}
      <div>
        <FileDropZone uploading={uploading} onFiles={handleFiles} />
        {uploads.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {uploads.map(f => (
              <FileChip
                key={f.id}
                file={f}
                onRemove={() => setUploads(prev => prev.filter(u => u.id !== f.id))}
              />
            ))}
          </div>
        )}
      </div>

      <PrimaryBtn
        icon="bolt"
        onClick={handleAssign}
        disabled={!text.trim() || isStreaming}
        large
      >
        {isStreaming ? t('side.streaming') + '…' : t('side.assignBtn')}
      </PrimaryBtn>

      {/* Streaming output */}
      {(isStreaming || output || streamError) && (
        <div
          style={{
            marginTop: 6,
            padding: '14px 14px 16px',
            background: 'var(--surface-2)',
            border: '.5px solid var(--line)',
            borderRadius: 12,
            animation: 'slideup .4s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{agent.emoji}</span>
            <span
              className="mono"
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}
            >
              {agent.name}
            </span>
            {isStreaming && (
              <>
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--amber)',
                    display: 'inline-block',
                  }}
                />
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: 'var(--amber)',
                    letterSpacing: '.08em',
                    textTransform: lang === 'zh' ? 'none' : 'uppercase',
                  }}
                >
                  {t('side.streaming')}
                </span>
                <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: 'var(--amber)',
                        animation: `dotbob 1.2s ease-in-out ${i * 0.18}s infinite`,
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {streamError && (
            <div style={{
              fontSize: 12, lineHeight: 1.55, color: 'var(--red)',
              background: 'rgba(248,113,113,.08)', border: '.5px solid var(--red)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 8,
            }}>
              {streamError}
            </div>
          )}
          <div
            ref={outputRef}
            style={{
              fontSize: 12.5,
              lineHeight: 1.6,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {output}
            {isStreaming && (
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
      )}
    </div>
  )
}

function StartMeetingPanel({
  agents,
  preselect,
  onStart,
}: {
  agents: Agent[]
  preselect: Agent | null
  onStart: (topic: string, participantIds: string[]) => void
}) {
  const { t, lang } = useT()
  const [topic, setTopic] = useState('')
  const [invited, setInvited] = useState<string[]>(() =>
    preselect
      ? [preselect.id, ...agents.slice(0, 3).map((a) => a.id).filter((id) => id !== preselect.id)]
      : agents.slice(0, 4).map((a) => a.id)
  )

  const toggle = (id: string) =>
    setInvited((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    )

  const agendaPlaceholder =
    lang === 'zh'
      ? '• 留存数据拆解\n• 假设提议\n• 决定本周可上线的干预'
      : '• Cohort split walkthrough\n• Hypothesis proposals\n• Decide on shippable intervention'

  const topicPlaceholder =
    lang === 'zh' ? '例：本周产品优先级对齐' : 'e.g. This week\'s product priorities'

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '18px 18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <Label>{t('side.topic')}</Label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={topicPlaceholder}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--bg)',
            border: `.5px solid ${topic ? 'var(--amber)' : 'var(--line)'}`,
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color .2s',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <Label>
          {t('side.invite')}{' '}
          <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>
            · {t('side.selected').replace('%n', String(invited.length))}
          </span>
        </Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {agents.map((a) => {
            const on = invited.includes(a.id)
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                style={{
                  appearance: 'none',
                  border: `.5px solid ${on ? 'var(--amber)' : 'var(--line)'}`,
                  background: on ? 'var(--amber-tint)' : 'var(--surface-2)',
                  color: 'var(--text)',
                  borderRadius: 10,
                  padding: '7px 9px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 15 }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: 'var(--text-dim)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t(a.roleKey)}
                  </div>
                </div>
                {on && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="m4 12 5 5L20 6" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label>
          {t('side.agenda')}{' '}
          <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>
            · {t('side.agendaHint')}
          </span>
        </Label>
        <textarea
          placeholder={agendaPlaceholder}
          style={{
            width: '100%',
            minHeight: 80,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--bg)',
            border: '.5px solid var(--line)',
            resize: 'vertical',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 12.5,
            outline: 'none',
            lineHeight: 1.55,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <PrimaryBtn
          icon="meeting"
          onClick={() => onStart(topic.trim(), invited)}
          large
          disabled={invited.length === 0 || !topic.trim()}
        >
          {t('side.startBtn')}
        </PrimaryBtn>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
            fontSize: 10.5,
            color: 'var(--text-mute)',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>{t('side.meetingEta')}</span>
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  mode: 'assign' | 'meet'
  agent: Agent | null
  agents: Agent[]
  onSelectAgent: (a: Agent) => void
  onClose: () => void
  onStartMeeting: (topic: string, participantIds: string[]) => void
  onAgentStatusChange?: (agentId: string, status: Status) => void
}

export default function Sidebar({
  mode,
  agent,
  agents,
  onSelectAgent,
  onClose,
  onStartMeeting,
  onAgentStatusChange,
}: SidebarProps) {
  const { t } = useT()
  const [tab, setTab] = useState<'assign' | 'meet' | 'history'>(mode)
  useEffect(() => {
    setTab(mode)
  }, [mode])

  return (
    <aside
      className="sidebar-panel"
      style={{
        width: 380,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderLeft: '.5px solid var(--line)',
        animation: 'slideup .35s cubic-bezier(.2,.7,.2,1)',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Tab header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '.5px solid var(--line-soft)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            background: 'var(--surface-2)',
            borderRadius: 9,
            border: '.5px solid var(--line)',
          }}
        >
          <TabBtn active={tab === 'assign'} onClick={() => setTab('assign')}>
            {t('side.assign')}
          </TabBtn>
          <TabBtn active={tab === 'meet'} onClick={() => setTab('meet')}>
            {t('side.meet')}
          </TabBtn>
          <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>
            {t('hist.title')}
          </TabBtn>
        </div>
        <button
          onClick={onClose}
          aria-label={t('side.close')}
          style={{
            appearance: 'none',
            border: 0,
            background: 'transparent',
            color: 'var(--text-mute)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
          }}
        >
          <Icon name="close" size={15} />
        </button>
      </div>

      {tab === 'assign' && (
        <AssignTaskPanel
          agent={agent}
          agents={agents}
          onSelectAgent={onSelectAgent}
          onAgentStatusChange={onAgentStatusChange}
        />
      )}
      {tab === 'meet' && (
        <StartMeetingPanel
          agents={agents}
          preselect={agent}
          onStart={onStartMeeting}
        />
      )}
      {tab === 'history' && <TaskHistoryPanel />}
    </aside>
  )
}
