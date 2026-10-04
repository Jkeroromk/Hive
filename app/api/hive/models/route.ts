import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AGENTS, REVIEWER_ID } from '@/lib/hive-data'
import { PROVIDERS, isConfigured, resolveAgentModel } from '@/lib/llm/providers'
import type { AgentModelInfo } from '@/lib/models'

// Which model each agent actually runs on (after env overrides), and whether its key is set.
// Never returns keys or base URLs.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const agents: Record<string, AgentModelInfo> = {}
  for (const a of AGENTS) {
    const ref = resolveAgentModel(a)
    agents[a.id] = { ...ref, label: PROVIDERS[ref.provider].label, configured: isConfigured(ref.provider) }
  }

  const providers = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    configured: isConfigured(p.id),
  }))

  return NextResponse.json({ agents, providers, reviewerId: REVIEWER_ID })
}
