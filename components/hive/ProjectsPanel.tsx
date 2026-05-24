'use client'
import { useState, useEffect, useCallback } from 'react'
import { useT } from '@/lib/i18n'
import Icon from './Icon'
import { PrimaryBtn, Label } from './Buttons'

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count: { conversations: number; meetings: number; uploads: number }
}

interface ConversationDetail {
  id: string
  agentId: string
  title: string | null
  updatedAt: string
  messages: { id: string; role: string; content: string; agentId: string | null; createdAt: string }[]
}

interface MeetingDetail {
  id: string
  topic: string
  startedAt: string
  participantIds: string[]
  _count: { messages: number }
}

interface ProjectDetail extends Project {
  conversations: ConversationDetail[]
  meetings: MeetingDetail[]
  uploads: { id: string; originalName: string; mimeType: string; size: number; createdAt: string }[]
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = diffMs / 3_600_000
  if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`
  if (diffH < 24) return `${Math.round(diffH)}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD}d ago`
  return d.toLocaleDateString()
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-mute)', fontSize: 12.5 }}>
      <Icon name={icon} size={22} />
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  )
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (p: Project) => void
}) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? 'Failed to create project')
        return
      }
      const proj = await res.json()
      onCreate({ ...proj, _count: { conversations: 0, meetings: 0, uploads: 0 } })
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 9,
    background: 'var(--bg)', border: '.5px solid var(--line)',
    color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: 420, background: 'var(--surface)',
        border: '.5px solid var(--line)', borderRadius: 16,
        padding: '28px 24px', boxShadow: '0 12px 48px rgba(0,0,0,.28)',
        animation: 'slideup .25s ease-out',
      }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
          {t('proj.new')}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>{t('proj.name')}</Label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Q3 Launch Campaign"
              style={inp} autoFocus required
            />
          </div>
          <div>
            <Label>{t('proj.desc')}</Label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Optional description…"
              style={{ ...inp, minHeight: 72, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 10px', background: 'rgba(239,68,68,.08)', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, appearance: 'none', border: '.5px solid var(--line)',
              background: 'var(--surface-2)', color: 'var(--text-dim)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              padding: '10px 0', borderRadius: 9, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || loading} style={{
              flex: 1, appearance: 'none', border: 0,
              background: !name.trim() || loading ? 'var(--surface-2)' : 'var(--amber)',
              color: !name.trim() || loading ? 'var(--text-mute)' : 'var(--bg)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              padding: '10px 0', borderRadius: 9,
              cursor: !name.trim() || loading ? 'not-allowed' : 'pointer',
              boxShadow: !name.trim() || loading ? 'none' : '0 0 16px var(--amber-glow)',
            }}>
              {loading ? 'Creating…' : t('proj.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  selected,
  onClick,
}: {
  project: Project
  selected: boolean
  onClick: () => void
}) {
  const { t } = useT()
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none', width: '100%', textAlign: 'left',
        background: selected ? 'var(--amber-tint)' : 'var(--surface-2)',
        border: `.5px solid ${selected ? 'var(--amber)' : 'var(--line)'}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{project.name}</div>
        <span style={{ fontSize: 10.5, color: 'var(--text-mute)', flexShrink: 0, marginTop: 2 }}>
          {fmtDate(project.updatedAt)}
        </span>
      </div>
      {project.description && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {project.description}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-mute)' }}>
        <span>{project._count.conversations} {t('proj.conversations')}</span>
        <span>{project._count.meetings} {t('proj.meetings')}</span>
        {project._count.uploads > 0 && <span>{project._count.uploads} {t('proj.files')}</span>}
      </div>
    </button>
  )
}

function ConversationItem({ conv }: { conv: ConversationDetail }) {
  const [expanded, setExpanded] = useState(false)
  const lastMsg = conv.messages[conv.messages.length - 1]
  return (
    <div style={{
      border: '.5px solid var(--line)', borderRadius: 10,
      overflow: 'hidden', transition: 'all .15s',
    }}>
      <button
        onClick={() => setExpanded(x => !x)}
        style={{
          width: '100%', appearance: 'none', background: 'var(--surface-2)',
          border: 0, textAlign: 'left', padding: '10px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 15 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {conv.title ?? conv.agentId}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
            {conv.messages.length} messages · {fmtDate(conv.updatedAt)}
          </div>
        </div>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} />
      </button>
      {expanded && (
        <div style={{ maxHeight: 240, overflowY: 'auto', padding: '10px 12px',
          borderTop: '.5px solid var(--line-soft)', background: 'var(--bg)',
          display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conv.messages.slice(-6).map(m => (
            <div key={m.id} style={{
              display: 'flex', gap: 8,
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            }}>
              <div style={{
                maxWidth: '85%', padding: '7px 10px', borderRadius: 8, fontSize: 12,
                background: m.role === 'user' ? 'var(--amber-tint)' : 'var(--surface-2)',
                border: `.5px solid ${m.role === 'user' ? 'var(--amber)' : 'var(--line)'}`,
                color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {m.content.slice(0, 300)}{m.content.length > 300 ? '…' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MeetingItem({ meeting }: { meeting: MeetingDetail }) {
  return (
    <div style={{
      border: '.5px solid var(--line)', borderRadius: 10,
      padding: '10px 12px', background: 'var(--surface-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>🎙️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meeting.topic}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
            {meeting.participantIds.length} agents · {meeting._count.messages} msgs · {fmtDate(meeting.startedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const { t } = useT()
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'conversations' | 'meetings' | 'files'>('conversations')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        appearance: 'none', border: 0, borderRadius: 7, fontFamily: 'inherit',
        background: tab === id ? 'var(--surface)' : 'transparent',
        color: tab === id ? 'var(--text)' : 'var(--text-mute)',
        fontSize: 11.5, fontWeight: 600, padding: '5px 11px', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '.5px solid var(--line-soft)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{
          appearance: 'none', border: 0, background: 'transparent',
          color: 'var(--text-dim)', cursor: 'pointer', padding: 4,
        }}>
          <Icon name="chevron-left" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {detail?.name ?? '…'}
          </div>
          {detail?.description && (
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 1 }}>
              {detail.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '10px 14px 0',
        background: 'var(--surface-2)', borderBottom: '.5px solid var(--line-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 9,
          background: 'var(--bg)', border: '.5px solid var(--line)' }}>
          {tabBtn('conversations', `Convos ${detail ? `(${detail.conversations.length})` : ''}`)}
          {tabBtn('meetings', `Meetings ${detail ? `(${detail.meetings.length})` : ''}`)}
          {tabBtn('files', `Files ${detail ? `(${detail.uploads.length})` : ''}`)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-mute)', fontSize: 12.5 }}>Loading…</div>
        )}

        {!loading && tab === 'conversations' && (
          detail?.conversations.length
            ? detail.conversations.map(c => <ConversationItem key={c.id} conv={c} />)
            : <EmptyState icon="task" label={t('proj.emptyConvos')} />
        )}

        {!loading && tab === 'meetings' && (
          detail?.meetings.length
            ? detail.meetings.map(m => <MeetingItem key={m.id} meeting={m} />)
            : <EmptyState icon="meeting" label={t('proj.emptyMeetings')} />
        )}

        {!loading && tab === 'files' && (
          detail?.uploads.length
            ? detail.uploads.map(u => (
              <div key={u.id} style={{
                border: '.5px solid var(--line)', borderRadius: 10,
                padding: '10px 12px', background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Icon name="attach" size={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.originalName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
                    {fmtSize(u.size)} · {fmtDate(u.createdAt)}
                  </div>
                </div>
              </div>
            ))
            : <EmptyState icon="attach" label={t('proj.emptyFiles')} />
        )}
      </div>
    </div>
  )
}

interface ProjectsPanelProps {
  onClose: () => void
}

export default function ProjectsPanel({ onClose }: ProjectsPanelProps) {
  const { t } = useT()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadProjects = useCallback(() => {
    setLoading(true)
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setProjects(d) : setProjects([]))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const handleCreate = (p: Project) => {
    setProjects(prev => [p, ...prev])
    setShowCreate(false)
    setSelectedId(p.id)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      animation: 'slideup .3s cubic-bezier(.2,.7,.2,1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: '.5px solid var(--line-soft)',
        background: 'var(--backdrop)', backdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparks" size={16} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {t('proj.title')}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)', background: 'var(--surface-2)',
            border: '.5px solid var(--line)', borderRadius: 99, padding: '2px 8px' }}>
            {projects.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <PrimaryBtn icon="bolt" onClick={() => setShowCreate(true)}>
            {t('proj.new')}
          </PrimaryBtn>
          <button onClick={onClose} style={{
            appearance: 'none', border: '.5px solid var(--line)', borderRadius: 8,
            background: 'var(--surface)', color: 'var(--text-dim)',
            padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit', fontSize: 12,
          }}>
            <Icon name="close" size={13} />
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Projects list */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: '.5px solid var(--line-soft)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 80px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-mute)', fontSize: 12.5 }}>
                Loading…
              </div>
            )}
            {!loading && projects.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Icon name="sparks" size={28} />
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.5 }}>
                  {t('proj.empty')}
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    marginTop: 16, appearance: 'none',
                    background: 'var(--amber)', border: 0, borderRadius: 9,
                    color: 'var(--bg)', fontFamily: 'inherit', fontSize: 12.5,
                    fontWeight: 600, padding: '9px 18px', cursor: 'pointer',
                    boxShadow: '0 0 16px var(--amber-glow)',
                  }}
                >
                  {t('proj.create')}
                </button>
              </div>
            )}
            {!loading && projects.map(p => (
              <div key={p.id} style={{ marginBottom: 6 }}>
                <ProjectCard
                  project={p}
                  selected={selectedId === p.id}
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Detail pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedId
            ? <ProjectDetail key={selectedId} projectId={selectedId} onBack={() => setSelectedId(null)} />
            : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12, color: 'var(--text-mute)' }}>
                <Icon name="sparks" size={32} />
                <div style={{ fontSize: 13 }}>{t('proj.selectHint')}</div>
              </div>
            )
          }
        </div>
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
