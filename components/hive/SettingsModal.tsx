'use client'
import { useState } from 'react'
import { useHiveStore, WorkspaceContext, TokenUsage } from '@/lib/hive-store'
import Icon from './Icon'

// ─── Shared primitives ────────────────────────────────────────────────────────

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
  transition: 'border-color .15s', boxSizing: 'border-box',
}

const taStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.55,
}

function ChipGroup({ options, value, onChange }: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12, padding: '5px 12px', borderRadius: 99, transition: 'all .15s',
          border: `.5px solid ${value === o ? 'var(--amber)' : 'var(--line)'}`,
          background: value === o ? 'var(--amber-tint)' : 'var(--surface-2)',
          color: value === o ? 'var(--amber)' : 'var(--text-dim)',
          fontWeight: value === o ? 600 : 400,
        }}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ─── Workspace tab ─────────────────────────────────────────────────────────────

const STAGES = ['Pre-idea', 'MVP', 'Early traction', 'Growth', 'Scale', 'Enterprise']
const COMM_STYLES = ['直接简洁', '战略全局', '数据驱动', '叙事优先', '协作共建']

function WorkspaceTab() {
  const existing = useHiveStore(s => s.workspace)
  const setWorkspace = useHiveStore(s => s.setWorkspace)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<WorkspaceContext>({
    ceoName:       existing?.ceoName       ?? '',
    companyName:   existing?.companyName   ?? '',
    industry:      existing?.industry      ?? '',
    mission:       existing?.mission       ?? '',
    stage:         existing?.stage         ?? 'MVP',
    teamSize:      existing?.teamSize      ?? '',
    topPriorities: existing?.topPriorities ?? '',
    commStyle:     existing?.commStyle     ?? '直接简洁',
  })

  const set = (k: keyof WorkspaceContext, v: string) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.ceoName.trim() && form.companyName.trim() && form.mission.trim()

  const handleSave = () => {
    if (!canSave) return
    setWorkspace(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Field label="你的名字">
        <input style={inputStyle} value={form.ceoName} placeholder="例：Jason"
          onChange={e => set('ceoName', e.target.value)} />
      </Field>

      <Field label="公司名称" hint=" ">
        <input style={inputStyle} value={form.companyName} placeholder="例：Jkeroro"
          onChange={e => set('companyName', e.target.value)} />
      </Field>

      <Field label="行业" hint=" ">
        <input style={inputStyle} value={form.industry} placeholder="例：B2B SaaS、消费互联网"
          onChange={e => set('industry', e.target.value)} />
      </Field>

      <Field label="团队规模" hint=" ">
        <input style={inputStyle} value={form.teamSize} placeholder="例：10人初创"
          onChange={e => set('teamSize', e.target.value)} />
      </Field>

      <div style={{ gridColumn: 'span 2' }}>
        <Field label="公司使命" hint="一句话 — 你们存在的理由">
          <input style={inputStyle} value={form.mission}
            placeholder="例：让企业采购像消费者购物一样简单"
            onChange={e => set('mission', e.target.value)} />
        </Field>
      </div>

      <div style={{ gridColumn: 'span 2' }}>
        <Field label="公司阶段">
          <ChipGroup options={STAGES} value={form.stage} onChange={v => set('stage', v)} />
        </Field>
      </div>

      <div style={{ gridColumn: 'span 2' }}>
        <Field label="当前核心优先级" hint="本季度你和团队聚焦的事">
          <textarea style={taStyle} value={form.topPriorities}
            placeholder={'• Q3 完成 A 轮融资\n• 上线企业版\n• 招募销售负责人'}
            onChange={e => set('topPriorities', e.target.value)} />
        </Field>
      </div>

      <div style={{ gridColumn: 'span 2' }}>
        <Field label="你的沟通风格" hint="Agent 输出会匹配你的语气">
          <ChipGroup options={COMM_STYLES} value={form.commStyle} onChange={v => set('commStyle', v)} />
        </Field>
      </div>

      <div style={{ gridColumn: 'span 2' }}>
        <button onClick={handleSave} disabled={!canSave} style={{
          appearance: 'none', border: 0, borderRadius: 9,
          background: canSave ? 'var(--amber)' : 'var(--surface-3)',
          color: canSave ? '#000' : 'var(--text-mute)', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, padding: '9px 24px',
          cursor: canSave ? 'pointer' : 'default', transition: 'all .15s',
        }}>
          {saved ? '✓ 已保存' : '保存工作区'}
        </button>
      </div>
    </div>
  )
}

// ─── Usage tab ────────────────────────────────────────────────────────────────

const GROQ_FREE_DAILY = 500_000  // Groq free tier: ~500k tokens/day (llama-3.3-70b)

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function UsageBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.min((used / total) * 100, 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--text-dim)' }}>{label}</span>
        <span className="mono" style={{ color: 'var(--text)', fontSize: 11.5 }}>
          {fmt(used)} / {fmt(total)}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`,
          background: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--amber)' : color,
          transition: 'width .4s ease',
        }} />
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 4 }}>
        {pct.toFixed(1)}% 已使用
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: '.5px solid var(--line)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function UsageTab() {
  const usage = useHiveStore(s => s.tokenUsage)
  const resetTokenUsage = useHiveStore(s => s.resetTokenUsage)
  const [confirmed, setConfirmed] = useState(false)

  const handleReset = () => {
    if (!confirmed) { setConfirmed(true); return }
    resetTokenUsage()
    setConfirmed(false)
  }

  const costEst = ((usage.totalTokens / 1_000_000) * 0.59).toFixed(4)  // Groq paid: ~$0.59/1M tokens

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--amber-tint)', border: '.5px solid var(--amber)',
        fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        当前使用 Groq 免费套餐 · 模型：llama-3.3-70b-versatile
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatCard label="总 Token 用量" value={fmt(usage.totalTokens)} sub="本设备累计" />
        <StatCard label="请求次数" value={String(usage.requestCount)} sub="任务 + 会议" />
        <StatCard label="预估成本" value={`$${costEst}`} sub="按 Groq 付费价估算" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <UsageBar
          label="每日免费额度估算"
          used={usage.totalTokens}
          total={GROQ_FREE_DAILY}
          color="var(--green)"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--surface-2)', border: '.5px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginBottom: 4 }}>输入 Token</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{fmt(usage.promptTokens)}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '.5px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginBottom: 4 }}>输出 Token</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{fmt(usage.completionTokens)}</div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '.5px solid var(--line-soft)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
          数据存储在本地设备，刷新不丢失
        </div>
        <button onClick={handleReset} style={{
          appearance: 'none', fontFamily: 'inherit', cursor: 'pointer',
          border: `.5px solid ${confirmed ? 'var(--red)' : 'var(--line)'}`,
          background: confirmed ? 'rgba(248,113,113,.08)' : 'transparent',
          color: confirmed ? 'var(--red)' : 'var(--text-mute)',
          fontSize: 11.5, padding: '6px 14px', borderRadius: 7, transition: 'all .15s',
        }}>
          {confirmed ? '再次点击确认清零' : '清零统计'}
        </button>
      </div>
    </div>
  )
}

// ─── Preferences tab ──────────────────────────────────────────────────────────

function PreferencesTab({ theme, onTheme, lang, onLang }: {
  theme: string; onTheme: (t: string) => void
  lang: string; onLang: (l: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Field label="界面主题">
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'dark', label: '深色', icon: '🌙' },
            { value: 'light', label: '浅色', icon: '☀️' },
          ].map(opt => (
            <button key={opt.value} onClick={() => onTheme(opt.value)} style={{
              flex: 1, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '14px', borderRadius: 12, transition: 'all .15s',
              border: `.5px solid ${theme === opt.value ? 'var(--amber)' : 'var(--line)'}`,
              background: theme === opt.value ? 'var(--amber-tint)' : 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <span style={{ fontSize: 12, fontWeight: theme === opt.value ? 600 : 400,
                color: theme === opt.value ? 'var(--amber)' : 'var(--text-dim)' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="界面语言">
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'zh', label: '中文', sub: '简体中文' },
            { value: 'en', label: 'English', sub: 'English UI' },
          ].map(opt => (
            <button key={opt.value} onClick={() => onLang(opt.value)} style={{
              flex: 1, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '14px', borderRadius: 12, transition: 'all .15s',
              border: `.5px solid ${lang === opt.value ? 'var(--amber)' : 'var(--line)'}`,
              background: lang === opt.value ? 'var(--amber-tint)' : 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600,
                color: lang === opt.value ? 'var(--amber)' : 'var(--text)' }}>
                {opt.label}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Groq API Key" hint="存储在本地，不上传服务器">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            defaultValue="gsk_••••••••••••••••"
            readOnly
            style={{ ...inputStyle, flex: 1, color: 'var(--text-mute)', cursor: 'not-allowed' }}
          />
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 9, textDecoration: 'none',
              border: '.5px solid var(--line)', background: 'var(--surface-2)',
              fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
          >
            Groq 控制台 ↗
          </a>
        </div>
      </Field>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'workspace', label: '工作区', icon: 'user' },
  { id: 'usage',     label: '用量统计', icon: 'bolt' },
  { id: 'prefs',     label: '偏好设置', icon: 'sun' },
] as const

type TabId = typeof TABS[number]['id']

interface SettingsModalProps {
  onClose: () => void
  theme: string
  onTheme: (t: string) => void
  lang: string
  onLang: (l: string) => void
  initialTab?: TabId
}

export default function SettingsModal({ onClose, theme, onTheme, lang, onLang, initialTab = 'workspace' }: SettingsModalProps) {
  const [tab, setTab] = useState<TabId>(initialTab)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--surface)', border: '.5px solid var(--line)',
        borderRadius: 18, width: '100%', maxWidth: 600,
        maxHeight: '92dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', animation: 'flyin .22s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 0', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
            设置
          </span>
          <button onClick={onClose} style={{
            appearance: 'none', border: 0, background: 'transparent',
            color: 'var(--text-mute)', cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '12px 24px 0', flexShrink: 0,
          borderBottom: '.5px solid var(--line-soft)',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              appearance: 'none', border: 0, background: 'transparent',
              fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--text)' : 'var(--text-mute)',
              padding: '8px 14px 10px', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? 'var(--amber)' : 'transparent'}`,
              marginBottom: -1, transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 28px' }}>
          {tab === 'workspace' && <WorkspaceTab />}
          {tab === 'usage'     && <UsageTab />}
          {tab === 'prefs'     && <PreferencesTab theme={theme} onTheme={onTheme} lang={lang} onLang={onLang} />}
        </div>
      </div>
    </div>
  )
}
