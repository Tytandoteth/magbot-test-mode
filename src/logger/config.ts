export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  filePath: process.env.LOG_FILE_PATH || 'logs/',
  enableDebug: process.env.ENABLE_DEBUG_LOGS === 'true'
};