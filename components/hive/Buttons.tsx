'use client'
import { ReactNode, CSSProperties } from 'react'
import Icon from './Icon'
import { useT } from '@/lib/i18n'

interface PrimaryBtnProps {
  children: ReactNode
  icon?: string
  onClick?: () => void
  large?: boolean
  disabled?: boolean
  style?: CSSProperties
}

export function PrimaryBtn({ children, icon, onClick, large = false, disabled = false, style }: PrimaryBtnProps) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: 'none', border: 0,
      background: disabled ? 'var(--surface-2)' : 'var(--amber)',
      color: disabled ? 'var(--text-mute)' : 'var(--bg)',
      fontFamily: 'inherit', fontSize: large ? 14 : 12.5, fontWeight: 600,
      padding: large ? '11px 18px' : '8px 14px', borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: disabled ? 'none' : '0 1px 0 rgba(0,0,0,.1), 0 0 16px var(--amber-glow)',
      transition: 'all .15s',
      width: '100%',
      ...style,
    }}>
      {icon && <Icon name={icon} size={large ? 14 : 13} />}
      {children}
    </button>
  )
}

interface SoftBtnProps {
  children: ReactNode
  icon?: string
  onClick?: () => void
  style?: CSSProperties
}

export function SoftBtn({ children, icon, onClick, style }: SoftBtnProps) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: '.5px solid var(--line)',
      background: 'var(--surface)', color: 'var(--text)',
      fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
      padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      ...style,
    }}>
      {icon && <Icon name={icon} size={13} style={{ color: 'var(--text-dim)' }} />}
      {children}
    </button>
  )
}

interface IconBtnProps {
  children: ReactNode
  onClick?: () => void
  active?: boolean
}

export function IconBtn({ children, onClick, active }: IconBtnProps) {
  return (
    <button onClick={onClick} style={{
      position: 'relative', width: 32, height: 32, borderRadius: 8,
      border: '.5px solid ' + (active ? 'var(--amber)' : 'var(--line)'),
      background: active ? 'var(--amber-tint)' : 'var(--surface)',
      color: active ? 'var(--amber)' : 'var(--text-dim)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  )
}

export function Label({ children }: { children: ReactNode }) {
  const { lang } = useT()
  return (
    <div className="mono" style={{
      fontSize: 10, color: 'var(--text-dim)',
      letterSpacing: lang === 'zh' ? '.04em' : '.08em',
      textTransform: lang === 'zh' ? 'none' : 'uppercase',
      fontWeight: 600, marginBottom: 8, display: 'block',
    }}>{children}</div>
  )
}
