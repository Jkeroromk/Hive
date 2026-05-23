// @ts-nocheck
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_AGENTS } from '@/lib/agents'
import { MeetingMessage } from '@/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { topic, participants, history }: {
    topic: string
    participants: string[]
    history: MeetingMessage[]
  } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        const participantAgents = DEFAULT_AGENTS.filter(a => participants.includes(a.id))

        for (const agent of participantAgents) {
          send('agent-start', {
            agentId: agent.id,
            agentName: agent.name,
            agentEmoji: agent.emoji,
          })

          const conversationHistory = history.map(msg => ({
            role: 'user' as const,
            content: msg.agentId === 'user'
              ? `[用户]: ${msg.content}`
              : `[${msg.agentName} ${msg.agentEmoji}]: ${msg.content}`,
          }))

          const userPrompt =
            conversationHistory.length === 0
              ? `会议主题是：${topic}\n\n请你作为 ${agent.name} 发表你的看法，开启讨论。`
              : `会议主题：${topic}\n\n以上是会议记录。请你作为 ${agent.name} 继续发言，针对上面的讨论提出你的观点。回复控制在150字以内，简洁有力。`

          const messages =
            conversationHistory.length === 0
              ? [{ role: 'user' as const, content: userPrompt }]
              : [...conversationHistory, { role: 'user' as const, content: userPrompt }]

          const response = await client.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 512,
            system: agent.systemPrompt,
            messages,
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

          send('agent-done', { agentId: agent.id, content: agentContent })
          await new Promise(r => setTimeout(r, 300))
        }

        send('meeting-done', {})
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
