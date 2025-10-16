import * as Sentry from '@sentry/browser'

export type LatencyResult = 'success' | 'error' | 'timeout'

export interface LatencyTxn {
  stage: (name: string) => void
  finish: (result?: LatencyResult) => void
  setAttribute: (key: string, val: any) => void
}

/** Simple scope -> config mapping so pages only pass a scope string */
const SCOPE_MAP: Record<string, { name: string; label: string }> = {
  'activity-export': {
    name: 'extracteur: export excel (activite)',
    label: "Préparation de l'extracteur Excel de données d'activités",
  },
  'effectif-export': {
    name: 'extracteur: export excel (effectifs)',
    label: "Préparation de l'extracteur Excel de données d'effectifs",
  },
  reaffectator: {
    name: 'reaffectator: operation',
    label: 'Préparation du réaffectateur',
  },
  'view-analytics': {
    name: 'analytics: view generation',
    label: 'Préparation des vues analytiques',
  },
  simulator: {
    name: 'simulator: run',
    label: 'Préparation du simulateur',
  },
  default: {
    name: 'latency-op',
    label: 'Operation',
  },
}

export function startLatencyScope(scope: string): LatencyTxn {
  const cfg = SCOPE_MAP[scope] || SCOPE_MAP['default']
  try {
    // Attach scope as tag for querying
    Sentry.withScope((s) => {
      try { s.setTag('scope', scope) } catch {}
    })
  } catch {}
  return startLatency(cfg.label, cfg.name)
}

/**
 * Start a Sentry latency measurement with graceful fallbacks.
 * - Creates a span/transaction if available
 * - Tags latency event label
 * - Tracks start time to compute latency_ms on finish
 *
 * name: span/transaction name (e.g., 'extracteur: export excel')
 * label: friendly label attached as tag/extra
 */
export function startLatency(label: string, name = 'latency-op'): LatencyTxn {
  let startAt = 0
  let span: any | undefined
  let txn: any | undefined
  let endSpanResolve: (() => void) | undefined

  // Start clock first to guarantee measurement even if Sentry fails
  try { startAt = performance.now() } catch { startAt = Date.now() }

  // Prefer manual transaction when available
  try {
    const startTransaction = (Sentry as any).startTransaction as any
    if (typeof startTransaction === 'function') {
      txn = startTransaction({ name, op: 'task', forceTransaction: true })
      try { (Sentry as any).getCurrentHub?.().configureScope?.((scope: any) => scope.setSpan?.(txn)) } catch {}
      span = txn
    }
    // Fallback: try starting from hub if global function is missing
    if (!txn) {
      const hub = (Sentry as any).getCurrentHub?.()
      const hubStart = hub?.startTransaction
      if (typeof hubStart === 'function') {
        txn = hubStart.call(hub, { name, op: 'task', forceTransaction: true })
        try { (Sentry as any).getCurrentHub?.().configureScope?.((scope: any) => scope.setSpan?.(txn)) } catch {}
        span = txn
      }
    }
  } catch {}

  // Note: avoid startSpan(callback) here because it auto-finishes immediately,
  // leading to 0ms durations. If startTransaction is not available, we will
  // try to use startSpanManual to create a long-lived span; otherwise rely on
  // manual timing and scope tags only.
  if (!span) {
    try {
      const startSpanManual = (Sentry as any).startSpanManual as any
      if (typeof startSpanManual === 'function') {
        span = startSpanManual({ name, op: 'task', attributes: { 'sentry.tag.latency_event': label } })
      }
    } catch {}
  }

  // Fallback: use startSpan with a pending promise to keep the span open until finish()
  if (!span && !txn) {
    try {
      const startSpan = (Sentry as any).startSpan as any
      if (typeof startSpan === 'function') {
        const pending = new Promise<void>((resolve) => { endSpanResolve = resolve })
        startSpan({ name, op: 'task', forceTransaction: true, attributes: { 'sentry.tag.latency_event': label } }, () => pending)
        // Active span will exist during the pending promise; attributes will be set via getActiveSpan in setAttribute
      }
    } catch {}
  }

  // Attach label everywhere we can
  try {
    Sentry.withScope((scope) => {
      try {
        scope.setTag('latency_event', label)
        scope.setExtra('latency_event', label)
      } catch {}
    })
    span?.setAttribute?.('sentry.tag.latency_event', label)
  } catch {}

  const setAttribute = (key: string, val: any) => {
    try { span?.setAttribute?.(key, val) } catch {}
    try { Sentry.getActiveSpan()?.setAttribute?.(key, val) } catch {}
  }

  const stage = (stageName: string) => {
    // Emit a browser event to help E2E synchronize (optional)
    try { window.dispatchEvent(new CustomEvent('excel-stage', { detail: stageName })) } catch {}
    setAttribute('stage', stageName)
  }

  const finish = (result: LatencyResult = 'success') => {
    try {
      const now = performance.now?.() ?? Date.now()
      const ms = Math.max(0, now - startAt)
      setAttribute('latency_ms', ms as any)
      setAttribute('result', result)
      txn?.finish?.()
      ;(span as any)?.finish?.()
      ;(span as any)?.end?.()
      endSpanResolve?.()
    } catch {}
  }

  return { stage, finish, setAttribute }
}
