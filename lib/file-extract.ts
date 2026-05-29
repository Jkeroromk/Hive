// Text extraction from uploaded files for AI context

const TEXT_MIME_TYPES = new Set([
  'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml',
  'application/json', 'application/xml',
])

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c',
  '.cs', '.rb', '.php', '.swift', '.kt', '.sh', '.bash', '.zsh',
  '.sql', '.graphql', '.prisma', '.yaml', '.yml', '.toml', '.env',
  '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.md',
])

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string | null> {
  const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase()

  // Plain text / code / CSV / markdown
  if (TEXT_MIME_TYPES.has(mimeType) || CODE_EXTENSIONS.has(ext)) {
    const text = buffer.toString('utf-8')
    // Truncate very large files to 100k chars
    return text.slice(0, 100_000)
  }

  // PDF
  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>
      const data = await pdfParse(buffer)
      return data.text.slice(0, 100_000)
    } catch {
      return null
    }
  }

  // DOCX / Word
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === '.docx' || ext === '.doc'
  ) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value.slice(0, 100_000)
    } catch {
      return null
    }
  }

  // Excel / CSV — xlsx handles both
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ext === '.xlsx' || ext === '.xls'
  ) {
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const lines: string[] = []
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        lines.push(`# Sheet: ${sheetName}`)
        lines.push(XLSX.utils.sheet_to_csv(sheet))
      }
      return lines.join('\n').slice(0, 100_000)
    } catch {
      return null
    }
  }

  // Images — no text extraction; Claude Vision will handle the raw bytes
  if (mimeType.startsWith('image/')) {
    return null
  }

  return null
}

// Build the content block(s) to send to Claude for a given upload
export function buildFileContext(
  originalName: string,
  mimeType: string,
  extractedText: string | null,
  base64Data?: string // only for images
): string {
  if (mimeType.startsWith('image/') && base64Data) {
    // Caller must handle image blocks separately via Claude's vision API
    return `[Attached image: ${originalName}]`
  }
  if (!extractedText) return `[Attached file: ${originalName} — content could not be extracted]`
  return `\n\n--- Attached file: ${originalName} ---\n${extractedText}\n--- End of file ---`
}
