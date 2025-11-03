import { startLatency, startLatencyScope, type LatencyTxn } from './sentry-latency'

export interface DetailItem {
  expected: number
  completed: number
  txn?: LatencyTxn
  timer?: any
}

export type DetailState = Record<string, DetailItem>

/** Build the legacy, verbose label for analytics detail sections */
function buildDetailVerboseLabel(sectionKey: string): string {
  const map: Record<string, string> = {
    stocks: 'Stocks',
    stock: 'Stocks',
    entrees: 'Entrées',
    sorties: 'Sorties',
    ETPTSiege: 'ETPT Siège',
    ETPTGreffe: 'ETPT Greffe',
    ETPTEam: 'ETPT EAM',
    cover: 'Couverture',
    couverture: 'Couverture',
  }
  const pretty = map[sectionKey] || sectionKey
  return `Cockpit graphiques, ${pretty}, affichage des graphes de détail`
}

/**
 * Begin latency tracking for a detail section with a given scope.
 * Stores a minimal tracker in the provided state map and starts a LatencyTxn.
 */
export function beginDetail(state: DetailState, key: string, expected: number, scope = 'view-analytics'): void {
  try { state[key]?.txn?.finish?.('success') } catch {}
  // Start a verbose-labeled latency txn to match legacy logs
  const label = buildDetailVerboseLabel(key)
  const txn = startLatency(label, 'analytics: detail graphs')
  try {
    txn.setAttribute('detail_section', key)
    txn.setAttribute('scope', scope)
    txn.stage?.('open')
  } catch {}
  const item: DetailItem = { expected, completed: 0, txn }
  // If nothing is expected, finish quickly to ensure the event is sent
  if (!expected || expected <= 0) {
    try { setTimeout(() => txn.finish('success'), 0) } catch {}
  } else {
    // Safety timeout: auto-finish if children never all report completion (e.g., 30s)
    try {
      item.timer = setTimeout(() => {
        try {
          txn.setAttribute('timeout_expected', expected)
          txn.finish('timeout')
        } catch {}
        delete state[key]
      }, 30000)
    } catch {}
  }
  state[key] = item
}

/**
 * Mark one sub-graph as complete and finish the txn when all expected are done.
 */
export function markDetailComplete(state: DetailState, key: string): void {
  const st = state[key]
  if (!st) return
  st.completed += 1
  if (st.completed >= st.expected) {
    try {
      st.timer && clearTimeout(st.timer)
      st.txn?.stage?.('complete')
      st.txn?.setAttribute?.('completed', st.completed)
      st.txn?.finish('success')
    } catch {}
    delete state[key]
  }
}

/**
 * Toggle a detail section open/close with latency tracking centralized here.
 * - When open=false: clears any existing state and returns false.
 * - When open=true: begins a new detail scope and returns true.
 */
export function toggleDetail(state: DetailState, key: string, open: boolean, expected: number, scope = 'view-analytics'): boolean {
  if (!open) {
    try {
      const it = state[key]
      it?.timer && clearTimeout(it.timer)
      it?.txn?.finish?.('success')
    } catch {}
    delete state[key]
    return false
  }
  beginDetail(state, key, expected, scope)
  return true
}
