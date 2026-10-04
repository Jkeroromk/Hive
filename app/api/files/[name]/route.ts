import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import path from 'path'
import { db } from '@/lib/db'
import { readFile } from '@/lib/storage'

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
}

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  // Prevent path traversal
  const name = path.basename(params.name)

  // Only the uploader can read a file (legacy rows without an owner stay readable)
  const upload = await db.upload.findFirst({
    where: { storedName: name, OR: [{ userId }, { userId: null }] },
    select: { data: true },
  })
  if (!upload) return new NextResponse('Not found', { status: 404 })

  const bytes = upload.data ?? (await readFile(name))
  if (!bytes) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${name}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
