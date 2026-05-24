import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await db.project.findFirst({ where: { id: params.id, userId } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const conversations = await db.conversation.findMany({
    where: { projectId: params.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          attachments: { include: { upload: { select: { id: true, originalName: true, mimeType: true, storageUrl: true } } } },
        },
      },
    },
  })

  return NextResponse.json(conversations)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await db.project.findFirst({ where: { id: params.id, userId } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { agentId, title } = await req.json()
  const conversation = await db.conversation.create({
    data: { agentId, title: title ?? null, projectId: params.id },
  })

  return NextResponse.json(conversation, { status: 201 })
}
