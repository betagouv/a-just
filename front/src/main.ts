import * as Sentry from '@sentry/browser'
import { browserTracingIntegration } from '@sentry/browser'
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'

// Initialize Sentry for frontend performance (page load, navigations)
Sentry.init({
  dsn: import.meta.env['NG_APP_SENTRY_DSN'] || undefined,
  environment: import.meta.env['NG_APP_NODE_ENV'] || import.meta.env['NODE_ENV'],
  release: `a-just-front@${import.meta.env['NG_APP_VERSION'] || 'dev'}`,
  integrations: [browserTracingIntegration()],
  // Propagate tracing headers only to our own backend
  tracePropagationTargets: [window.location.origin],
  // Disable SDK debug logs (cleanup)
  debug: false,

  tracesSampleRate: Math.max(
    0,
    Math.min(
      1,
      Number(
        (import.meta.env['NG_APP_SENTRY_TRACES_SAMPLE_RATE'] ?? 0) as any,
      ),
    ),
  ),

  beforeSendTransaction: (event) => {
      const fullUrl = window?.location?.href
      const pathname = window?.location?.pathname || ''
      const op = (event as any)?.contexts?.trace?.op
      const transactionName = (event as any)?.transaction as string | undefined
      // Compute produit tag once per transaction
      const produit = fullUrl && fullUrl.includes('a-just-ca') ? 'CA' : 'TJ'
      // Jurisdiction title mirrored by AppComponent
      const juridictionTitle = (window as any)?.__ajust_juridiction_title || null

      // Do NOT trust global scope tag for pageload/navigation; we will override below.
      let latencyEvent: string | null = null
      const pathLike = pathname || transactionName || ''
      const txName = (event as any)?.transaction || ''

      // 1) Try to read tag from span attributes for any task-like custom transaction
      const traceCtx = (event as any)?.contexts?.trace
      const taggedAttr = (!latencyEvent && traceCtx && (
        traceCtx['sentry.tag.latency_event'] ||
        (traceCtx as any)?.attributes?.['sentry.tag.latency_event'] ||
        (traceCtx as any)?.attributes?.['latency_event'] ||
        (traceCtx as any)?.data?.['sentry.tag.latency_event'] ||
        (traceCtx as any)?.data?.['latency_event']
      )) as
        | string
        | undefined
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
        if (txName.startsWith('extracteur: export excel')) {
          latencyEvent = txName.includes('(effectifs)')
            ? "Préparation de l'extracteur Excel de données d'effectifs"
            : "Préparation de l'extracteur Excel de données d'activités"
        } else if (txName.startsWith('Simulateur:')) {
          // Specific fallback based on current URL path
          const isWhite = (pathname || '').startsWith('/simulateur-sans-donnees')
          latencyEvent = isWhite
            ? 'Calcul du simulateur sans données pré-alimentées'
            : "Calcul du simulateur avec les données d'A-JUST"
        }
      }

      // 3) (Removed) do not read any global fallback for custom task names
      // 4) For pageload/navigation, always map the page regardless of any scope tag
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
      event.tags = {
        ...event.tags,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(produit ? { produit } : {}),
        ...(juridictionTitle ? { juridiction_title: juridictionTitle } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
      }
      event.extra = {
        ...event.extra,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(produit ? { produit } : {}),
        ...(juridictionTitle ? { juridiction_title: juridictionTitle } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
      }
      return event
    },
})

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
