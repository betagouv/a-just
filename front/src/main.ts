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

      // Prefer any pre-existing tag set on the scope/transaction
      let latencyEvent: string | null = ((event as any)?.tags?.latency_event as string) || null
      const pathLike = pathname || transactionName || ''
      const txName = (event as any)?.transaction || ''

      // 1) Try to read tag from span attributes for any task-like custom transaction
      const traceCtx = (event as any)?.contexts?.trace
      const taggedAttr = (!latencyEvent && traceCtx && (traceCtx['sentry.tag.latency_event'] || (traceCtx as any)?.attributes?.['sentry.tag.latency_event'])) as
        | string
        | undefined
      if (typeof taggedAttr === 'string' && taggedAttr.length > 0) {
        latencyEvent = taggedAttr
      }

      // 2) If not found yet, check for our named custom transactions by name
      if (!latencyEvent && txName.includes('simulateur: compute')) {
        const fromGlobal = (window as any)?.__ajust_last_latency_event
        try { console.debug('[Sentry][beforeSendTransaction] simulateur:compute branch, fromGlobal=', fromGlobal) } catch {}
        if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
          latencyEvent = fromGlobal
        }
      }
      if (!latencyEvent && txName.includes('cockpit: detail graphs')) {
        const fromGlobal = (window as any)?.__ajust_last_latency_event
        try { console.debug('[Sentry][beforeSendTransaction] cockpit:detail branch, fromGlobal=', fromGlobal) } catch {}
        if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
          latencyEvent = fromGlobal
        }
      }

      // 3) As a last resort, if this is a /cockpit transaction and we have a recent custom label, use it
      if (!latencyEvent && (txName.startsWith('/cockpit') || pathLike.startsWith('/cockpit'))) {
        const fromGlobal = (window as any)?.__ajust_last_latency_event
        if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
          latencyEvent = fromGlobal
        }
      }

      // 4) Fallback: map page-load and SPA navigations only if nothing custom was found
      if (!latencyEvent && (op === 'pageload' || op === 'navigation')) {
        if (pathLike.startsWith('/panorama')) {
          latencyEvent = 'Chargement du panorama'
        } else if (pathLike.startsWith('/ventilations')) {
          latencyEvent = 'Chargement du ventilateur'
        } else if (pathLike.startsWith('/cockpit')) {
          latencyEvent = 'Chargement du cockpit'
        } else if (pathLike.startsWith('/donnees-d-activite')) {
          latencyEvent = "Chargement des données d'activité"
        }
      }
      event.tags = {
        ...event.tags,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
      }
      event.extra = {
        ...event.extra,
        ...(fullUrl ? { full_url: fullUrl } : {}),
        ...(latencyEvent ? { latency_event: latencyEvent } : {}),
      }
      return event
    },
})

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
