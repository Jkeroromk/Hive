import fs from 'fs/promises'
import path from 'path'

// Vercel's filesystem is read-only, so there the file bytes go into Postgres (Upload.data).
// Locally they go to data/uploads/. Force DB storage anywhere with STORAGE_PROVIDER=db.
export const storeInDb = Boolean(process.env.VERCEL) || process.env.STORAGE_PROVIDER === 'db'

// Vercel rejects request bodies over 4.5 MB, so cap uploads below that there.
export const MAX_UPLOAD_BYTES = storeInDb ? 4 * 1024 * 1024 : 50 * 1024 * 1024

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

export function uploadPath(storedName: string) {
  return path.join(UPLOAD_DIR, path.basename(storedName))
}

export async function saveFile(buffer: Buffer, storedName: string) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(uploadPath(storedName), buffer)
}

export async function readFile(storedName: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(uploadPath(storedName))
  } catch {
    return null
  }
}

// Public URL served by the /api/files route handler
export function fileUrl(storedName: string) {
  return `/api/files/${storedName}`
}
