import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  exitOnError: false,
  format: winston.format.json(),
  // defaultMeta: { service: 'user-service' },
  transports: [],
})

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, ...meta }) => `${level}: ${JSON.stringify(message, null, 4)} ${JSON.stringify(meta)}\n`)
    ),
  })
)

export default logger
export const log = (...args) => console.log(...args)
export const logError = (...args) => logger.error(args)
