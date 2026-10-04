'use client'
import { useEffect, useState } from 'react'
import type { ProviderId } from '@/types'
import type { AgentModelInfo } from '@/lib/models'

export interface ModelsInfo {
  agents: Record<string, AgentModelInfo>
  providers: { id: ProviderId; label: string; configured: boolean }[]
  reviewerId: string
}

let cache: Promise<ModelsInfo | null> | null = null

function load(): Promise<ModelsInfo | null> {
  if (!cache) {
    cache = fetch('/api/hive/models')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((v) => {
        if (!v) cache = null // let a later mount retry
        return v
      })
  }
  return cache
}

/** Fetched once per page load and shared by every component that asks. */
export function useAgentModels(): ModelsInfo | null {
  const [info, setInfo] = useState<ModelsInfo | null>(null)
  useEffect(() => {
    let alive = true
    load().then((v) => alive && setInfo(v))
    return () => {
      alive = false
    }
  }, [])
  return info
}
