import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AGENTS } from '@/lib/hive-data'
import { buildSystemPrompt } from '@/lib/agent-prompts'
import { resolveAgentModel } from '@/lib/llm/providers'
import { streamChat } from '@/lib/llm/stream'
import { sseResponse } from '@/lib/llm/sse'
import type { WorkspaceContext } from '@/lib/hive-store'

interface HistoryMsg {
  from: string // agent id, or 'user'
  kind: 'agent' | 'user'
  text: string
}

const nameOf = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? id

// Several agents speak in turn; allow up to 5 minutes on Vercel.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const {
    topic,
    participantIds,
    history,
    projectId,
    meetingDbId,
    workspace,
  }: {
    topic: string
    participantIds: string[]
    history: HistoryMsg[]
    projectId?: string
    meetingDbId?: string
    workspace?: WorkspaceContext
  } = await req.json()

  const participantAgents = AGENTS.filter((a) => participantIds.includes(a.id))

  return sseResponse(async (send) => {
    // Create meeting record in DB on first round
    let dbMeetingId = meetingDbId
    if (projectId && !dbMeetingId && history.length === 0) {
      const meeting = await db.meeting.create({ data: { topic, participantIds, projectId } })
      dbMeetingId = meeting.id
      send('meetingDbId', { meetingDbId: dbMeetingId })
    }

    // Save the user's latest message (idempotent)
    if (dbMeetingId) {
      const lastMsg = history[history.length - 1]
      if (lastMsg?.kind === 'user') {
        const existing = await db.meetingMessage.findFirst({
          where: { meetingId: dbMeetingId, kind: 'user' },
          orderBy: { createdAt: 'desc' },
        })
        if (existing?.content !== lastMsg.text) {
          await db.meetingMessage.create({
            data: { fromId: 'user', kind: 'user', content: lastMsg.text, meetingId: dbMeetingId },
          })
        }
      }
    }

    // Agents who spoke this round also count as "already covered" for later speakers
    const transcript = [...history]

    for (const agent of participantAgents) {
      send('agent-start', { agentId: agent.id, agentName: agent.name, agentEmoji: agent.emoji })

      const conversationLines = transcript.map((msg) =>
        msg.kind === 'user' ? `[User]: ${msg.text}` : `[${nameOf(msg.from)}]: ${msg.text}`
      )
      const otherSpeakers = Array.from(
        new Set(transcript.filter((m) => m.kind === 'agent' && m.from !== agent.id).map((m) => nameOf(m.from)))
      )
      const alreadySaid = otherSpeakers.length
        ? `\n\nALREADY COVERED BY OTHERS: ${otherSpeakers.join(', ')} have spoken. DO NOT repeat their points. Add something ONLY your role can contribute.`
        : ''

      const userPrompt =
        conversationLines.length === 0
          ? `Meeting topic: "${topic}"\n\nOpen the meeting strictly from your role's angle. No greetings, no "let's dive in". Jump straight to your most important domain-specific point. Under 80 words.`
          : `Meeting topic: "${topic}"\n\nTranscript:\n${conversationLines.join('\n')}${alreadySaid}\n\nRespond ONLY from your specific domain. Be concrete and opinionated — not generic. Do NOT acknowledge the user's identity or restate the topic. Under 100 words.`

      let agentContent = ''
      try {
        const stream = streamChat(resolveAgentModel(agent), {
          system: buildSystemPrompt(agent, workspace),
          messages: [{ role: 'user', content: userPrompt }],
          maxTokens: 512,
        })
        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            agentContent += chunk.text
            send('delta', { text: chunk.text, agentId: agent.id })
          } else {
            send('usage', { promptTokens: chunk.promptTokens, completionTokens: chunk.completionTokens })
          }
        }
      } catch (err) {
        // One agent's provider failing shouldn't end the meeting — show it in their bubble and move on.
        const note = `⚠ ${agent.name} couldn't speak: ${err instanceof Error ? err.message : String(err)}`
        send('delta', { text: (agentContent ? '\n\n' : '') + note, agentId: agent.id })
        send('agent-done', { agentId: agent.id, content: agentContent, error: true })
        continue
      }

      if (dbMeetingId) {
        await db.meetingMessage.create({
          data: { fromId: agent.id, kind: 'agent', content: agentContent, meetingId: dbMeetingId },
        })
      }
      transcript.push({ from: agent.id, kind: 'agent', text: agentContent })

      send('agent-done', { agentId: agent.id, content: agentContent })
      await new Promise((r) => setTimeout(r, 200))
    }

    send('meeting-done', { meetingDbId: dbMeetingId })
  })
}
