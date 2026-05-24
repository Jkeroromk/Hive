import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

async function getProject(id: string, userId: string) {
  return db.project.findFirst({ where: { id, userId } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await db.project.findFirst({
    where: { id: params.id, userId },
    include: {
      conversations: {
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      },
      meetings: {
        orderBy: { startedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      },
      uploads: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, description } = await req.json()
  const updated = await db.project.update({
    where: { id: params.id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() ?? null } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.project.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
