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
  /**
  // Propagate tracing headers only to our own backend
  tracePropagationTargets: [window.location.origin],

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
    try {
      const fullUrl = window?.location?.href
      event.tags = {
        ...event.tags,
        ...(fullUrl ? { full_url: fullUrl } : {}),
      }
      event.extra = {
        ...event.extra,
        ...(fullUrl ? { full_url: fullUrl } : {}),
      }
    } catch {}
    return event
  },   */
})

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
