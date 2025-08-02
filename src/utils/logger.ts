// src/utils/logger.ts
const winston = require('winston');

const { combine, timestamp, printf, colorize } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp(),
    customFormat
  ),
  transports: [new winston.transports.Console()],
});
