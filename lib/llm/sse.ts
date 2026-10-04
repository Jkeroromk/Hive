// Small helper so every streaming route speaks the same `event:/data:` format.
export type Send = (event: string, data: object) => void

export function sseResponse(run: (send: Send) => Promise<void>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send: Send = (event, data) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      try {
        await run(send)
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
