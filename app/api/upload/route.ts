import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { saveFile, fileUrl } from '@/lib/storage'
import { extractText } from '@/lib/file-extract'

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const storedName = `${crypto.randomUUID()}${ext}`

  await saveFile(buffer, storedName)

  const extractedText = await extractText(buffer, file.type, file.name)

  const upload = await db.upload.create({
    data: {
      originalName: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      storageUrl: fileUrl(storedName),
      extractedText,
      ...(projectId ? { projectId } : {}),
    },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      storageUrl: true,
      extractedText: true,
      createdAt: true,
    },
  })

  return NextResponse.json(upload, { status: 201 })
}
