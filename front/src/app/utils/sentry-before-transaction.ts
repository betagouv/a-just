// Utility to build a beforeSendTransaction handler for Sentry
// Centralizes how we compute and attach latency_event and context tags.
import { getJurisdictionTitle } from './sentry-context'

export function buildBeforeSendTransaction() {
  return function beforeSendTransaction(event: any) {
    try {
      const fullUrl = typeof window !== 'undefined' ? window.location?.href : undefined
      const pathname = typeof window !== 'undefined' ? window.location?.pathname || '' : ''
      const op = (event as any)?.contexts?.trace?.op
      const transactionName = (event as any)?.transaction as string | undefined
      const produit = fullUrl && fullUrl.includes('a-just-ca') ? 'CA' : 'TJ'
      const juridictionTitle = getJurisdictionTitle()

      let latencyEvent: string | null = null
      const pathLike = pathname || transactionName || ''
      const txName = (event as any)?.transaction || ''

      // 1) Try to read tag from span attributes for any task-like custom transaction
      const traceCtx: any = (event as any)?.contexts?.trace
      const taggedAttr = (!latencyEvent && traceCtx && (
        traceCtx['sentry.tag.latency_event'] ||
        traceCtx?.attributes?.['sentry.tag.latency_event'] ||
        traceCtx?.attributes?.['latency_event'] ||
        traceCtx?.data?.['sentry.tag.latency_event'] ||
        traceCtx?.data?.['latency_event']
      )) as string | undefined
      if (typeof taggedAttr === 'string' && taggedAttr.length > 0) {
        latencyEvent = taggedAttr
      }

      // 1b) If still not found, scan child spans for a tagged latency_event
      if (!latencyEvent && Array.isArray((event as any)?.spans)) {
        try {
          const spans: any[] = (event as any).spans
          for (const s of spans) {
            const d = (s as any)?.data || (s as any)?.attributes
            const v = d?.['sentry.tag.latency_event'] || d?.['latency_event']
            if (typeof v === 'string' && v.length > 0) {
              latencyEvent = v
              break
            }
          }
        } catch {}
      }

      // 2) Ensure custom Extracteur/Simulateur transactions are tagged by name as a fallback
      if (!latencyEvent && typeof txName === 'string') {
        if ((txName as string).startsWith('extracteur: export excel')) {
          latencyEvent = (txName as string).includes('(effectifs)')
            ? "Préparation de l'extracteur Excel de données d'effectifs"
            : "Préparation de l'extracteur Excel de données d'activités"
        } else if ((txName as string).startsWith('Simulateur:')) {
          const isWhite = (pathname || '').startsWith('/simulateur-sans-donnees')
          latencyEvent = isWhite
            ? 'Calcul du simulateur sans données pré-alimentées'
            : "Calcul du simulateur avec les données d'A-JUST"
        }
      }

      // 3) For pageload/navigation, always map the page regardless of any scope tag
      if (op === 'pageload' || op === 'navigation') {
        if (pathLike.startsWith('/panorama')) {
          latencyEvent = 'Chargement du panorama'
        } else if (pathLike.startsWith('/ventilations')) {
          latencyEvent = 'Chargement du ventilateur'
        } else if (pathLike.startsWith('/cockpit')) {
          latencyEvent = 'Chargement du cockpit'
        } else if (pathLike.startsWith('/dashboard')) {
          latencyEvent = "Chargement de l'extracteur"
        } else if (pathLike.startsWith('/reaffectateur')) {
          latencyEvent = 'Chargement du reaffectateur'
        } else if (pathLike.startsWith('/donnees-d-activite')) {
          latencyEvent = "Chargement des données d'activité"
        } else if (pathLike.startsWith('/simulateur-sans-donnees')) {
          latencyEvent = 'Chargement du simulateur sans données pré-alimentées'
        } else if (pathLike.startsWith('/simulateur')) {
          latencyEvent = 'Chargement du simulateur'
        }
      }

      // Compute is_exctractor flag (present only for extracteur cases)
      let isExtracteur: boolean | undefined
      try {
        isExtracteur =
          latencyEvent === "Préparation de l'extracteur Excel de données d'effectifs" ||
          latencyEvent === "Préparation de l'extracteur Excel de données d'activités"
      } catch {}

      event.tags = {
        ...event.tags,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(produit ? { produit } : {}),
        ...(juridictionTitle ? { juridiction_title: juridictionTitle } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
        ...(isExtracteur ? { is_exctractor: 'true' } : {}),
      }
      event.extra = {
        ...event.extra,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(produit ? { produit } : {}),
        ...(juridictionTitle ? { juridiction_title: juridictionTitle } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
        ...(isExtracteur ? { is_exctractor: true } : {}),
      }
      return event
    } catch {
      return event
    }
  }
}
