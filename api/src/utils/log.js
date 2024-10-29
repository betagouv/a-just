import winston from 'winston'
import config from 'config'

const logger = winston.createLogger({
  level: 'info',
  exitOnError: false,
  format: winston.format.json(),
  transports: [],
})

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message }) => `${level}: ${typeof message !== 'string' ? JSON.stringify(message) : message}`)
    ),
  })
)

export default logger

if (config.formatLogs) {
  console.log = (...args) => logger.info.call(logger, args.join(' '))
  console.info = (...args) => logger.info.apply(logger, args.join(' '))
  console.warn = (...args) => logger.warn.call(logger, args.join(' '))
  console.error = (...args) => logger.error.call(logger, args.join(' '))
  console.debug = (...args) => logger.debug.call(logger, args.join(' '))
}
