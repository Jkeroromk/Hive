'use client'
import { useEffect, useRef, useState, useMemo, ReactNode } from 'react'
import { Agent } from '@/types'
import AgentCard from './AgentCard'

export const HEX_W = 168
export const HEX_H = 168
export const COL_STEP = 168 + 14
export const ROW_DROP = 168 + 14

interface AgentGridProps {
  agents: Agent[]
  onSelectAgent: (a: Agent) => void
  onAssign: (a: Agent) => void
  onInvite: (a: Agent) => void
  onRemove: (a: Agent) => void
  glowMul?: number
}

export default function AgentGrid({ agents, onSelectAgent, onAssign, onInvite, onRemove, glowMul = 1 }: AgentGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ w: 1200, h: 600 })

  useEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const r = containerRef.current!.getBoundingClientRect()
      setFit({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const colCount = useMemo(() => {
    const n = agents.length
    if (n === 0) return 1
    if (n <= 4) return n
    if (n <= 9) return Math.ceil(Math.sqrt(n))
    if (n <= 16) return 4
    return 5
  }, [agents.length])

  const gridScale = useMemo(() => {
    const n = agents.length
    if (n === 0) return 1
    const rowCount = Math.ceil(n / colCount)
    const naturalW = colCount * COL_STEP
    const naturalH = rowCount * ROW_DROP
    const PAD = 60
    const sx = (fit.w - PAD) / naturalW
    const sy = (fit.h - PAD) / naturalH
    return Math.min(1, sx, sy)
  }, [agents.length, colCount, fit])

  return (
    <div ref={containerRef} style={{
      flex: 1, minHeight: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', padding: '12px 40px 90px',
      position: 'relative',
    }}>
      {agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, minmax(0, ${HEX_W}px))`,
          gap: 14,
          transform: `scale(${gridScale})`,
          transformOrigin: 'center',
          transition: 'transform .35s ease',
        }}>
          {agents.map((agent, i) => (
            <div key={agent.id} style={{ animation: `flyin .45s ${i * 32}ms cubic-bezier(.2,.7,.2,1) both` }}>
              <AgentCard
                agent={agent}
                onClick={() => onSelectAgent(agent)}
                onAssign={onAssign}
                onInvite={onInvite}
                onRemove={onRemove}
                glowMul={glowMul}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, opacity: .4, marginBottom: 16 }}>⬡</div>
      <div className="serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
        The hive is empty
      </div>
      <div style={{ fontSize: 13.5 }}>Recruit your first agent to get started</div>
    </div>
  )
}
