import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AGENTS } from '@/lib/hive-data'
import { AGENT_PROMPTS } from '@/lib/agent-prompts'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface HistoryMsg {
  from: string
  kind: 'agent' | 'user'
  text: string
}

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
    workspace?: {
      ceoName: string; companyName: string; industry: string
      mission: string; stage: string; teamSize: string
      topPriorities: string; commStyle: string
    }
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

          const basePrompt = AGENT_PROMPTS[agent.id] ?? `You are ${agent.name}, a helpful AI assistant.`
          const systemPrompt = workspace
            ? `--- WORKSPACE CONTEXT ---
CEO: ${workspace.ceoName} | Company: ${workspace.companyName} (${workspace.industry})
Mission: ${workspace.mission}
Stage: ${workspace.stage} | Team: ${workspace.teamSize}
Current priorities: ${workspace.topPriorities}
CEO communication style: ${workspace.commStyle}
--- END CONTEXT ---

${basePrompt}`
            : basePrompt

          const otherSpeakers = history
            .filter(m => m.kind === 'agent' && m.from !== agent.name)
            .map(m => m.from)
          const alreadySaid = otherSpeakers.length > 0
            ? `\n\nALREADY COVERED BY OTHERS: ${otherSpeakers.join(', ')} have spoken. DO NOT repeat their points. Add something ONLY your role can contribute.`
            : ''

          const userPrompt =
            conversationLines.length === 0
              ? `Meeting topic: "${topic}"\n\nOpen the meeting strictly from your role's angle. No greetings, no "let's dive in". Jump straight to your most important domain-specific point. Under 80 words.`
              : `Meeting topic: "${topic}"\n\nTranscript:\n${conversationLines.join('\n')}${alreadySaid}\n\nRespond ONLY from your specific domain. Be concrete and opinionated — not generic. Do NOT acknowledge the user's identity or restate the topic. Under 100 words.`

          const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 512,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            stream_options: { include_usage: true },
          })

          let agentContent = ''
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              agentContent += text
              send('delta', { text, agentId: agent.id })
            }
            if (chunk.usage) {
              send('usage', {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens,
              })
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
