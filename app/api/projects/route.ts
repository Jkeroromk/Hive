import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const projects = await db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { conversations: true, meetings: true, uploads: true },
      },
    },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const { name, description } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name required' }, { status: 400 })
  }

  const project = await db.project.create({
    data: { name: name.trim(), description: description?.trim() ?? null, userId },
  })

  return NextResponse.json(project, { status: 201 })
}
