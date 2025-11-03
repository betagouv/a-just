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

// Read an E2E override max milliseconds for operations that poll or have deadlines.
// Looks for a number in window.__AJ_E2E_EXPORT_MAX_MS or localStorage.__AJ_E2E_EXPORT_MAX_MS.
// Returns the provided defaultMs if nothing is configured.
export function getE2EExportMaxMs(defaultMs: number): number {
  try {
    const w = (window as any)
    const fromWin = Number(w && w.__AJ_E2E_EXPORT_MAX_MS)
    if (Number.isFinite(fromWin) && fromWin > 0) return fromWin
  } catch {}
  try {
    const fromLS = Number(localStorage.getItem('__AJ_E2E_EXPORT_MAX_MS'))
    if (Number.isFinite(fromLS) && fromLS > 0) return fromLS
  } catch {}
  return defaultMs
}
