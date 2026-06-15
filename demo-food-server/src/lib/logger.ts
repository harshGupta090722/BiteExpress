import winston from 'winston'

// Structured application logger. In development we pretty-print to the console;
// in production we emit JSON lines which are easy to ship to ELK later.
const isDev = process.env.NODE_ENV !== 'production'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} ${level}: ${message}${rest}`
        })
      )
    : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
})
