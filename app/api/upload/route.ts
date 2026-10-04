import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { saveFile, fileUrl, storeInDb, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { extractText } from '@/lib/file-extract'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = MAX_UPLOAD_BYTES / 1024 / 1024
    return NextResponse.json({ error: `File too large (max ${mb} MB)` }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const storedName = `${crypto.randomUUID()}${ext}`

  if (!storeInDb) await saveFile(buffer, storedName)

  const extractedText = await extractText(buffer, file.type, file.name)

  const upload = await db.upload.create({
    data: {
      originalName: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      storageUrl: fileUrl(storedName),
      extractedText,
      userId,
      ...(storeInDb ? { data: buffer } : {}),
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
