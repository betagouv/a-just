// Test-only helper to expose downloaded buffers to Cypress when saveAs is blocked
// Safe no-op in production.

export function exposeDownloadToCypress(
  buffer: ArrayBuffer | Uint8Array | Blob,
  filename: string
): void {
  try {
    const w = (window as any)
    if (!w || !w.Cypress) return

    let blob: Blob
    if (buffer instanceof Blob) {
      blob = buffer
    } else if (buffer instanceof Uint8Array) {
      blob = new Blob([buffer])
    } else {
      blob = new Blob([new Uint8Array(buffer)])
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      try {
        const res = String(reader.result || '')
        const base64 = res.includes(',') ? res.split(',')[1] : res
        w.__lastDownloadBase64 = base64
        w.__lastDownloadName = filename
      } catch {}
    }
    reader.readAsDataURL(blob)
  } catch {}
}
