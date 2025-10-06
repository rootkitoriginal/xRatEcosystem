const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Ensure the logs directory exists and is writable
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
  }
} catch (error) {
  console.warn(`Failed to create logs directory: ${error.message}`);
}

// Check if we can write to the logs directory
const canWriteToLogsDir = (() => {
  try {
    const testFile = path.join(logsDir, '.write-test');
    fs.writeFileSync(testFile, 'test', { flag: 'w' });
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    console.warn(`Cannot write to logs directory: ${error.message}`);
    return false;
  }
})();

// Console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaStr = '';
      if (Object.keys(meta).length > 0) {
        metaStr = ` ${JSON.stringify(meta)}`;
      }
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
  ),
});

// Define file transports only if we can write to logs directory
let combinedFileTransport;
let errorFileTransport;

if (canWriteToLogsDir) {
  try {
    // File transport for combined logs
    combinedFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      // Add error handling
      handleExceptions: true,
    });

    // File transport for error logs
    errorFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      // Add error handling
      handleExceptions: true,
    });

    // Add error handlers to transports
    combinedFileTransport.on('error', (error) => {
      console.error('Combined log transport error:', error);
    });

    errorFileTransport.on('error', (error) => {
      console.error('Error log transport error:', error);
    });
  } catch (error) {
    console.warn(`Failed to create file transports: ${error.message}`);
    combinedFileTransport = null;
    errorFileTransport = null;
  }
}

// Create logger instance
const transports = [consoleTransport];

// Add file transports if they were created successfully and we're not in test mode
if (
  canWriteToLogsDir &&
  combinedFileTransport &&
  errorFileTransport &&
  process.env.NODE_ENV !== 'test'
) {
  transports.push(combinedFileTransport);
  transports.push(errorFileTransport);
  console.log('File logging enabled');
} else {
  console.log('File logging disabled - using console transport only');
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'xrat-backend' },
  transports: transports,
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Add stream object for morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Log the logger status
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    if (canWriteToLogsDir && combinedFileTransport && errorFileTransport) {
      logger.info('Logging system initialized with file transports', {
        directory: logsDir,
        fileTransports: true,
      });
    } else {
      logger.warn('File logging disabled due to permission issues or test environment', {
        directory: logsDir,
        canWrite: canWriteToLogsDir,
        fileTransports: !!(combinedFileTransport && errorFileTransport),
      });
    }
  }, 100);
}

module.exports = logger;
