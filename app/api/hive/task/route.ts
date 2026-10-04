import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AGENTS } from '@/lib/hive-data'
import { buildSystemPrompt } from '@/lib/agent-prompts'
import { buildFileContext } from '@/lib/file-extract'
import { PROVIDERS, resolveAgentModel } from '@/lib/llm/providers'
import { streamChat, type ChatTurn } from '@/lib/llm/stream'
import { sseResponse } from '@/lib/llm/sse'
import type { WorkspaceContext } from '@/lib/hive-store'

// Long answers stream for a while; allow up to 5 minutes on Vercel.
export const maxDuration = 300

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
    workspace?: WorkspaceContext
  } = await req.json()

  const agent = AGENTS.find((a) => a.id === agentId)
  if (!agent) return new Response('Agent not found', { status: 404 })

  const modelRef = resolveAgentModel(agent)
  const systemPrompt = buildSystemPrompt(agent, workspace)

  // Build task content — append file context if any uploads
  let fullTask = task
  if (uploadIds?.length) {
    const uploads = await db.upload.findMany({
      where: { id: { in: uploadIds }, OR: [{ userId }, { userId: null }] },
      select: { id: true, originalName: true, mimeType: true, extractedText: true },
    })
    for (const upload of uploads) {
      fullTask += buildFileContext(upload.originalName, upload.mimeType, upload.extractedText)
    }
  }

  return sseResponse(async (send) => {
    send('status', { status: 'thinking', agentId })
    send('model', { ...modelRef, label: PROVIDERS[modelRef.provider].label })

    // Resolve or create conversation in DB
    let convId = existingConvId
    if (projectId) {
      if (!convId) {
        const conv = await db.conversation.create({
          data: { agentId, title: task.slice(0, 60), projectId },
        })
        convId = conv.id
        send('conversationId', { conversationId: convId })
      }

      const userMsg = await db.chatMessage.create({
        data: { role: 'user', content: task, conversationId: convId },
      })

      if (uploadIds?.length) {
        await db.messageAttachment.createMany({
          data: uploadIds.map((uploadId) => ({ uploadId, messageId: userMsg.id })),
          skipDuplicates: true,
        })
      }
    }

    // Load conversation history if continuing
    let messages: ChatTurn[]
    if (convId && existingConvId) {
      const history = await db.chatMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: 'asc' },
      })
      messages = history.map((m: { role: string; content: string }) => ({
        role: (m.role === 'agent' ? 'assistant' : 'user') as ChatTurn['role'],
        content: m.content,
      }))
    } else {
      messages = [{ role: 'user', content: fullTask }]
    }

    send('status', { status: 'working', agentId })

    let fullContent = ''
    for await (const chunk of streamChat(modelRef, { system: systemPrompt, messages, maxTokens: 2048 })) {
      if (chunk.type === 'text') {
        fullContent += chunk.text
        send('delta', { text: chunk.text, agentId })
      } else {
        send('usage', { promptTokens: chunk.promptTokens, completionTokens: chunk.completionTokens })
      }
    }

    if (convId && projectId) {
      await db.chatMessage.create({
        data: { role: 'agent', content: fullContent, agentId, conversationId: convId },
      })
      await db.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } })
    }

    send('done', { agentId, fullContent, conversationId: convId })
  })
}
