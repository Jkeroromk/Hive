import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AGENTS } from '@/lib/hive-data'
import { AGENT_PROMPTS } from '@/lib/agent-prompts'

const client = new Anthropic()

interface HistoryMsg {
  from: string
  kind: 'agent' | 'user'
  text: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const {
    topic,
    participantIds,
    history,
    projectId,
    meetingDbId,
  }: {
    topic: string
    participantIds: string[]
    history: HistoryMsg[]
    projectId?: string
    meetingDbId?: string
  } = await req.json()

  const participantAgents = AGENTS.filter((a) => participantIds.includes(a.id))
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        // Create meeting record in DB on first round
        let dbMeetingId = meetingDbId
        if (projectId && !dbMeetingId && history.length === 0) {
          const meeting = await db.meeting.create({
            data: { topic, participantIds, projectId },
          })
          dbMeetingId = meeting.id
          send('meetingDbId', { meetingDbId: dbMeetingId })
        }

        // Save user message if present in history
        if (dbMeetingId) {
          const lastMsg = history[history.length - 1]
          if (lastMsg?.kind === 'user') {
            // Check if already saved (idempotency)
            const existing = await db.meetingMessage.findFirst({
              where: { meetingId: dbMeetingId, kind: 'user' },
              orderBy: { createdAt: 'desc' },
            })
            const alreadySaved = existing?.content === lastMsg.text
            if (!alreadySaved) {
              await db.meetingMessage.create({
                data: {
                  fromId: 'user',
                  kind: 'user',
                  content: lastMsg.text,
                  meetingId: dbMeetingId,
                },
              })
            }
          }
        }

        for (const agent of participantAgents) {
          send('agent-start', {
            agentId: agent.id,
            agentName: agent.name,
            agentEmoji: agent.emoji,
          })

          const conversationLines = history.map((msg) =>
            msg.kind === 'user'
              ? `[User]: ${msg.text}`
              : `[${msg.from}]: ${msg.text}`
          )

          const systemPrompt =
            AGENT_PROMPTS[agent.id] ??
            `You are ${agent.name}, a helpful AI assistant.`

          const userPrompt =
            conversationLines.length === 0
              ? `Meeting topic: "${topic}"\n\nYou are opening the meeting. Give a brief, focused opening statement from your perspective. Under 100 words.`
              : `Meeting topic: "${topic}"\n\nTranscript so far:\n${conversationLines.join('\n')}\n\nContinue the discussion as ${agent.name}. Build on what's been said, add your unique perspective, keep it moving. Under 120 words.`

          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            stream: true,
          })

          let agentContent = ''
          for await (const chunk of response) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              agentContent += chunk.delta.text
              send('delta', { text: chunk.delta.text, agentId: agent.id })
            }
          }

          // Persist agent message
          if (dbMeetingId) {
            await db.meetingMessage.create({
              data: {
                fromId: agent.id,
                kind: 'agent',
                content: agentContent,
                meetingId: dbMeetingId,
              },
            })
          }

          send('agent-done', { agentId: agent.id, content: agentContent })
          await new Promise((r) => setTimeout(r, 200))
        }

        // Mark meeting endedAt if user ended it
        send('meeting-done', { meetingDbId: dbMeetingId })
      } catch (err) {
        send('error', { message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
