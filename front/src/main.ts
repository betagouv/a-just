import * as Sentry from '@sentry/browser'
import { browserTracingIntegration } from '@sentry/browser'
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Initialize Sentry for frontend performance (page load, navigations)
Sentry.init({
  dsn: import.meta.env['NG_APP_SENTRY_DSN'] || undefined,
  environment: import.meta.env['NG_APP_NODE_ENV'] || import.meta.env['NODE_ENV'],
  release: `a-just-front@${import.meta.env['NG_APP_VERSION'] || 'dev'}`,
  integrations: [
    browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
})

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
