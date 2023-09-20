import winston from 'winston'

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
      winston.format.printf(({ level, message }) => `${level}: ${message}`)
    ),
  })
)

export default logger

console.log = (...args) => logger.info.call(logger, args.join(''))
console.info = (...args) => logger.info.apply(logger, args.join(''))
console.warn = (...args) => logger.warn.call(logger, args.join(''))
console.error = (...args) => logger.error.call(logger, args.join(''))
console.debug = (...args) => logger.debug.call(logger, args.join(''))
