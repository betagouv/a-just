import { startLatencyScope, type LatencyTxn } from './sentry-latency'

export interface DetailItem {
  expected: number
  completed: number
  txn?: LatencyTxn
}

export type DetailState = Record<string, DetailItem>

/**
 * Begin latency tracking for a detail section with a given scope.
 * Stores a minimal tracker in the provided state map and starts a LatencyTxn.
 */
export function beginDetail(state: DetailState, key: string, expected: number, scope = 'view-analytics'): void {
  try { state[key]?.txn?.finish?.('success') } catch {}
  state[key] = { expected, completed: 0, txn: startLatencyScope(scope) }
}

/**
 * Mark one sub-graph as complete and finish the txn when all expected are done.
 */
export function markDetailComplete(state: DetailState, key: string): void {
  const st = state[key]
  if (!st) return
  st.completed += 1
  if (st.completed >= st.expected) {
    try { st.txn?.finish('success') } catch {}
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
    try { state[key]?.txn?.finish?.('success') } catch {}
    delete state[key]
    return false
  }
  beginDetail(state, key, expected, scope)
  return true
}
