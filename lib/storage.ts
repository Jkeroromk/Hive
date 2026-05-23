import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

export function uploadPath(storedName: string) {
  return path.join(UPLOAD_DIR, storedName)
}

export async function saveFile(buffer: Buffer, storedName: string) {
  await ensureUploadDir()
  await fs.writeFile(uploadPath(storedName), buffer)
}

export async function deleteFile(storedName: string) {
  try {
    await fs.unlink(uploadPath(storedName))
  } catch {}
}

// Public URL served by Next.js route handler
export function fileUrl(storedName: string) {
  return `/api/files/${storedName}`
}
