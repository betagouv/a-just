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
  } catch {}

  // Otherwise, create a span using startSpan API
  if (!span) {
    try {
      Sentry.startSpan({ name, op: 'task', forceTransaction: true, attributes: { 'sentry.tag.latency_event': label } }, async () => {})
      // getActiveSpan is not in all builds; guard access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getActive = (Sentry as any).getActiveSpan
      if (typeof getActive === 'function') span = getActive()
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
    } catch {}
  }

  return { stage, finish, setAttribute }
}
