//import winston from 'winston'
import config from 'config'
/*import Sentry from 'winston-sentry-log'
import packageJson from '../../package.json'*/
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: config.sentryApi,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  integrations: [...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()],
})

/*const logger = winston.createLogger({
  level: 'info',
  exitOnError: false,
  format: winston.format.json(),
  // defaultMeta: { service: 'user-service' },
  transports: config.sentryApi
    ? [
      new Sentry({
        config: {
          dsn: config.sentryApi,
          environment: process.env.NODE_ENV || 'developpement',
          release: `${packageJson.name}@${packageJson.version}`,
        },
        level: 'error',
      }),
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
      //new winston.transports.File({ filename: 'error.log', level: 'error' }),
      //new winston.transports.File({ filename: 'combined.log' }),
      new winston.transports.File({ filename: 'error.log' }),
    ]
    : [],
})

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, ...meta }) => `${level}: ${JSON.stringify(message, null, 4)} ${JSON.stringify(meta)}\n`)
    ),
  })
)

logger.log('info', 'Voici un log simple')

export default logger
export const log = (...args) => console.log(...args)
export const logError = (...args) => logger.error(args)*/
