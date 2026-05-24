'use client'
import { useState } from 'react'
import { useHiveStore, WorkspaceContext } from '@/lib/hive-store'
import Icon from './Icon'

const STAGES = ['Pre-idea', 'MVP', 'Early traction', 'Growth', 'Scale', 'Enterprise']
const COMM_STYLES = ['Direct & concise', 'Strategic & big-picture', 'Data-driven', 'Narrative-first', 'Collaborative']

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  appearance: 'none', border: '.5px solid var(--line)', borderRadius: 9,
  background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit',
  fontSize: 13, padding: '9px 12px', width: '100%', outline: 'none',
  transition: 'border-color .15s',
}

const taStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.55,
}

export default function WorkspaceSetupModal({ onClose }: { onClose: () => void }) {
  const existing = useHiveStore(s => s.workspace)
  const setWorkspace = useHiveStore(s => s.setWorkspace)

  const [form, setForm] = useState<WorkspaceContext>({
    ceoName:       existing?.ceoName       ?? '',
    companyName:   existing?.companyName   ?? '',
    industry:      existing?.industry      ?? '',
    mission:       existing?.mission       ?? '',
    stage:         existing?.stage         ?? 'MVP',
    teamSize:      existing?.teamSize      ?? '',
    topPriorities: existing?.topPriorities ?? '',
    commStyle:     existing?.commStyle     ?? 'Direct & concise',
  })

  const set = (k: keyof WorkspaceContext, v: string) => setForm(f => ({ ...f, [k]: v }))

  const canSave = form.ceoName.trim() && form.companyName.trim() && form.mission.trim()

  const handleSave = () => {
    if (!canSave) return
    setWorkspace(form)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--surface)', border: '.5px solid var(--line)',
        borderRadius: 18, width: '100%', maxWidth: 540,
        maxHeight: '90dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', animation: 'flyin .25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '.5px solid var(--line-soft)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
              Workspace Setup
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>
              Agents use this to respond as your team — fill in once, applies everywhere.
            </div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', border: 0, background: 'transparent',
            color: 'var(--text-mute)', cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Your name" hint="How agents address you">
              <input
                style={inputStyle} value={form.ceoName} placeholder="e.g. Alex"
                onChange={e => set('ceoName', e.target.value)}
              />
            </Field>
            <Field label="Company name">
              <input
                style={inputStyle} value={form.companyName} placeholder="e.g. Acme Inc."
                onChange={e => set('companyName', e.target.value)}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Industry">
              <input
                style={inputStyle} value={form.industry} placeholder="e.g. B2B SaaS, Fintech"
                onChange={e => set('industry', e.target.value)}
              />
            </Field>
            <Field label="Team size">
              <input
                style={inputStyle} value={form.teamSize} placeholder="e.g. 8-person startup"
                onChange={e => set('teamSize', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Company mission" hint="One sentence — what you exist to do">
            <input
              style={inputStyle} value={form.mission}
              placeholder="e.g. Make enterprise procurement as simple as a consumer checkout"
              onChange={e => set('mission', e.target.value)}
            />
          </Field>

          <Field label="Company stage">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => set('stage', s)} style={{
                  appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12, padding: '5px 12px', borderRadius: 99, transition: 'all .15s',
                  border: `.5px solid ${form.stage === s ? 'var(--amber)' : 'var(--line)'}`,
                  background: form.stage === s ? 'var(--amber-tint)' : 'var(--surface-2)',
                  color: form.stage === s ? 'var(--amber)' : 'var(--text-dim)',
                  fontWeight: form.stage === s ? 600 : 400,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Top priorities right now" hint="What you and the team are focused on this quarter">
            <textarea
              style={taStyle} value={form.topPriorities}
              placeholder={"• Close Series A by end of Q3\n• Launch v2 with enterprise tier\n• Hire Head of Sales"}
              onChange={e => set('topPriorities', e.target.value)}
            />
          </Field>

          <Field label="Your communication style" hint="Agents will match your tone in outputs">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMM_STYLES.map(s => (
                <button key={s} onClick={() => set('commStyle', s)} style={{
                  appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12, padding: '5px 12px', borderRadius: 99, transition: 'all .15s',
                  border: `.5px solid ${form.commStyle === s ? 'var(--amber)' : 'var(--line)'}`,
                  background: form.commStyle === s ? 'var(--amber-tint)' : 'var(--surface-2)',
                  color: form.commStyle === s ? 'var(--amber)' : 'var(--text-dim)',
                  fontWeight: form.commStyle === s ? 600 : 400,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '.5px solid var(--line-soft)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: 'var(--surface)',
        }}>
          <button onClick={onClose} style={{
            appearance: 'none', border: '.5px solid var(--line)', borderRadius: 9,
            background: 'transparent', color: 'var(--text-dim)', fontFamily: 'inherit',
            fontSize: 13, padding: '8px 18px', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave} style={{
            appearance: 'none', border: 0, borderRadius: 9,
            background: canSave ? 'var(--amber)' : 'var(--surface-3)',
            color: canSave ? '#000' : 'var(--text-mute)', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, padding: '8px 22px',
            cursor: canSave ? 'pointer' : 'default', transition: 'all .15s',
          }}>
            Save workspace
          </button>
        </div>
      </div>
    </div>
  )
}
