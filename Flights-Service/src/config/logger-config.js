/**
 * Winston logger configuration.
 * Outputs structured logs to both the console and a combined.log file.
 * Format: "YYYY-MM-DD HH:mm:ss <level>: <message>"
 * Imported via src/config/index.js and used throughout the service for info/error logging.
 */
const {createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});


const logger = createLogger({
  format: combine(
    timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    customFormat
  ),
  transports: [new transports.Console(),
    new transports.File({filename: 'combined.log'})
  ]
});

module.exports = logger