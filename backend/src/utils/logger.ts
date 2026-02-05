import winston from 'winston';
import path from 'path';

const logDir = 'logs';

/**
 * Winston logger instance for application logging
 * 
 * Configured with:
 * - Log level from environment variable (default: 'info')
 * - JSON format for structured logging
 * - File transports for error and combined logs
 * - Console transport in non-production environments
 * 
 * Log levels: error, warn, info, verbose, debug, silly
 * 
 * @constant
 * @type {winston.Logger}
 * 
 * @example
 * logger.info('Server started');
 * logger.error('Error occurred', { error: err });
 * logger.debug('Debug information', { data: someData });
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'divideit-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };
