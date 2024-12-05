import winston from 'winston';
import { loggerConfig } from './config';

// Custom format for console output
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
  
  if (metadata.error) {
    if (metadata.error instanceof Error) {
      msg += `\nError: ${metadata.error.message}`;
      if (metadata.error.stack) {
        msg += `\nStack: ${metadata.error.stack}`;
      }
    } else {
      msg += `\nError: ${JSON.stringify(metadata.error)}`;
    }
  }
  
  if (Object.keys(metadata).length > 0) {
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.error;
    if (Object.keys(cleanMetadata).length > 0) {
      msg += `\nMetadata: ${JSON.stringify(cleanMetadata)}`;
    }
  }
  
  return msg;
});

// Format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: loggerConfig.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports: [
    // Console transport with colorization
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        consoleFormat
      ),
      level: 'debug'
    }),
    // File transport for errors
    new winston.transports.File({
      filename: `${loggerConfig.filePath}/error.log`,
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: `${loggerConfig.filePath}/combined.log`,
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  exitOnError: false
});