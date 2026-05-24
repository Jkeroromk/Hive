import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AGENTS } from '@/lib/hive-data'
import { AGENT_PROMPTS } from '@/lib/agent-prompts'
import { buildFileContext } from '@/lib/file-extract'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const {
    agentId,
    task,
    projectId,
    conversationId: existingConvId,
    uploadIds,
    workspace,
  }: {
    agentId: string
    task: string
    projectId?: string
    conversationId?: string
    uploadIds?: string[]
    workspace?: {
      ceoName: string; companyName: string; industry: string
      mission: string; stage: string; teamSize: string
      topPriorities: string; commStyle: string
    }
  } = await req.json()

  const agent = AGENTS.find((a) => a.id === agentId)
  if (!agent) return new Response('Agent not found', { status: 404 })

  const basePrompt = AGENT_PROMPTS[agentId] ?? `You are ${agent.name}, a helpful AI assistant.`
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

  // Build task content — append file context if any uploads
  let fullTask = task
  if (uploadIds?.length) {
    const uploads = await db.upload.findMany({
      where: { id: { in: uploadIds } },
      select: { id: true, originalName: true, mimeType: true, extractedText: true },
    })
    for (const upload of uploads) {
      fullTask += buildFileContext(upload.originalName, upload.mimeType, upload.extractedText)
    }
  }

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

        // Resolve or create conversation in DB
        let convId = existingConvId
        if (projectId) {
          if (!convId) {
            const conv = await db.conversation.create({
              data: {
                agentId,
                title: task.slice(0, 60),
                projectId,
              },
            })
            convId = conv.id
            send('conversationId', { conversationId: convId })
          }

          // Save user message
          const userMsg = await db.chatMessage.create({
            data: { role: 'user', content: task, conversationId: convId },
          })

          // Link uploaded files to this message
          if (uploadIds?.length) {
            await db.messageAttachment.createMany({
              data: uploadIds.map((uploadId) => ({ uploadId, messageId: userMsg.id })),
              skipDuplicates: true,
            })
          }
        }

        // Load conversation history if continuing
        let messages: { role: 'user' | 'assistant'; content: string }[] = []
        if (convId && existingConvId) {
          const history = await db.chatMessage.findMany({
            where: { conversationId: convId },
            orderBy: { createdAt: 'asc' },
          })
          messages = history.map((m: { role: string; content: string }) => ({
            role: (m.role === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content,
          }))
        } else {
          messages = [{ role: 'user', content: fullTask }]
        }

        const groqMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: systemPrompt },
          ...messages,
        ]

        const response = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: groqMessages,
          stream: true,
          stream_options: { include_usage: true },
        })

        send('status', { status: 'working', agentId })

        let fullContent = ''
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullContent += text
            send('delta', { text, agentId })
          }
          if (chunk.usage) {
            send('usage', {
              promptTokens: chunk.usage.prompt_tokens,
              completionTokens: chunk.usage.completion_tokens,
            })
          }
        }

        // Save agent reply to DB
        if (convId && projectId) {
          await db.chatMessage.create({
            data: {
              role: 'agent',
              content: fullContent,
              agentId,
              conversationId: convId,
            },
          })
          // Touch parent conversation updatedAt
          await db.conversation.update({
            where: { id: convId },
            data: { updatedAt: new Date() },
          })
        }

        send('done', { agentId, fullContent, conversationId: convId })
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
