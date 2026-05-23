// @ts-nocheck
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_AGENTS } from '@/lib/agents'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { agentId, task } = await req.json()

  const agent = DEFAULT_AGENTS.find(a => a.id === agentId)
  if (!agent) return new Response('Agent not found', { status: 404 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        send('status', { status: 'thinking', agentId })
        await new Promise(r => setTimeout(r, 500))
        send('status', { status: 'working', agentId })

        const response = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: agent.systemPrompt,
          messages: [{ role: 'user', content: task }],
          stream: true,
        })

        let fullContent = ''
        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullContent += chunk.delta.text
            send('delta', { text: chunk.delta.text, agentId })
          }
        }

        send('status', { status: 'done', agentId, lastOutput: fullContent.slice(0, 100) })
        send('done', { agentId, fullContent })
      } catch (err) {
        send('status', { status: 'error', agentId })
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
