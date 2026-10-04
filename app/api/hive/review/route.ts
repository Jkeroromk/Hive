import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AGENTS, REVIEWER_ID } from '@/lib/hive-data'
import { AUTHOR_REPLY_INSTRUCTIONS, REVIEW_INSTRUCTIONS, buildSystemPrompt } from '@/lib/agent-prompts'
import { PROVIDERS, resolveAgentModel } from '@/lib/llm/providers'
import { completeChat } from '@/lib/llm/stream'
import { sseResponse } from '@/lib/llm/sse'
import { disputedIssueIds, parseAuthorReply, parseReview } from '@/lib/llm/review-parse'
import type { WorkspaceContext } from '@/lib/hive-store'

// Cross-model review: reviewer critiques → author responds → disagreements go to the user.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const {
    agentId,
    task,
    output,
    workspace,
    reviewerId = REVIEWER_ID,
  }: {
    agentId: string
    task: string
    output: string
    workspace?: WorkspaceContext
    reviewerId?: string
  } = await req.json()

  const author = AGENTS.find((a) => a.id === agentId)
  const reviewer = AGENTS.find((a) => a.id === reviewerId)
  if (!author || !reviewer) return new Response('Agent not found', { status: 404 })
  if (author.id === reviewer.id) return new Response('An agent cannot review its own work', { status: 400 })
  if (!output?.trim()) return new Response('Nothing to review', { status: 400 })

  const authorModel = resolveAgentModel(author)
  const reviewerModel = resolveAgentModel(reviewer)

  return sseResponse(async (send) => {
    const onUsage = (u: { promptTokens: number; completionTokens: number }) => send('usage', u)

    // 1. Reviewer critiques
    send('review-start', {
      reviewerId: reviewer.id,
      model: { ...reviewerModel, label: PROVIDERS[reviewerModel.provider].label },
    })
    const reviewRaw = await completeChat(
      reviewerModel,
      {
        system: `${buildSystemPrompt(reviewer, workspace)}\n\n${REVIEW_INSTRUCTIONS}`,
        messages: [
          {
            role: 'user',
            content: `TASK given to ${author.name}:\n${task}\n\n--- ${author.name}'s OUTPUT ---\n${output}\n--- END OUTPUT ---\n\nReview it now. JSON only.`,
          },
        ],
        maxTokens: 2000,
      },
      onUsage
    )
    const review = parseReview(reviewRaw)
    send('review-done', { review })

    if (review.issues.length === 0) {
      send('done', { review, disputed: [] })
      return
    }

    // 2. Author responds point by point
    send('reply-start', {
      agentId: author.id,
      model: { ...authorModel, label: PROVIDERS[authorModel.provider].label },
    })
    const replyRaw = await completeChat(
      authorModel,
      {
        system: `${buildSystemPrompt(author, workspace)}\n\n${AUTHOR_REPLY_INSTRUCTIONS}`,
        messages: [
          { role: 'user', content: task },
          { role: 'assistant', content: output },
          {
            role: 'user',
            content: `${reviewer.name} (reviewer) raised these issues:\n${JSON.stringify(review.issues, null, 2)}\n\nRespond to each. JSON only.`,
          },
        ],
        maxTokens: 4096,
      },
      onUsage
    )
    const reply = parseAuthorReply(replyRaw, review.issues.map((i) => i.id))
    send('reply-done', { reply })

    // 3. Whatever is still contested goes to the user
    send('done', { review, reply, disputed: disputedIssueIds(review, reply) })
  })
}
