// Shared helper to build a human-readable latency_event label for the simulator
// Centralizes wording so pages/services can import it instead of duplicating logic.

export function buildSimulatorLatencyEventLabel(params: any, white: boolean): string {
  const base = white
    ? 'Calcul du simulateur sans données pré-alimentées'
    : "Calcul du simulateur avec les données d'A-JUST"

  const l1 = params?.lockedParams?.param1?.label || ''
  const l2 = params?.lockedParams?.param2?.label || ''
  const s = new Set([l1, l2].filter(Boolean))

  let suffix = ''
  if (s.has('etpMag') || s.has('etpFon') || s.has('etpCont')) suffix = 'à ETPT constant'
  else if (s.has('magRealTimePerCase')) suffix = 'à temps moyen par dossier constant'
  else if (s.has('totalIn')) suffix = 'à entrées mensuelles constantes'
  else if (s.has('totalOut')) suffix = 'à sorties mensuelles constantes'
  else if (s.has('lastStock')) suffix = 'à stock constant'
  else if (s.has('realCoverage')) suffix = 'à taux de couverture constant'
  else if (s.has('realDTESInMonths')) suffix = 'à DTES constant'

  return suffix ? `${base} ${suffix}` : base
}
