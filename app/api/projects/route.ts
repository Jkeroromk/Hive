import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name required' }, { status: 400 })
  }

  const project = await db.project.create({
    data: { name: name.trim(), description: description?.trim() ?? null, userId },
  })

  return NextResponse.json(project, { status: 201 })
}
