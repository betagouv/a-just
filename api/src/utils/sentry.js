import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import config from 'config'
import packageJson from '../../package.json'

Sentry.init({
  dsn: config.sentryApi,
  environment: process.env.NODE_ENV || null,
  release: `${packageJson.name}@${packageJson.version}`,

  integrations: [
    nodeProfilingIntegration(),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
})

export default Sentry