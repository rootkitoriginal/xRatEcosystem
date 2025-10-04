# Logging Guide - xRat Ecosystem Backend

## Overview

The xRat Ecosystem backend uses [Winston](https://github.com/winstonjs/winston) for structured logging with automatic log rotation.

## Features

- **Structured JSON Logging**: All logs are written in JSON format for easy parsing and analysis
- **Multiple Log Levels**: error, warn, info, debug
- **Automatic Log Rotation**: Logs are rotated daily and kept for 14 days
- **Request Logging**: All HTTP requests are automatically logged with unique request IDs
- **Console Output**: Colorized console output in development mode
- **File Output**: Separate error and combined log files with compression

## Log Levels

### error

Critical errors and exceptions that require immediate attention.

```javascript
logger.error('Failed to connect to database', {
  service: 'mongodb',
  error: err.message,
  stack: err.stack,
});
```

### warn

Warning messages for potentially harmful situations.

```javascript
logger.warn('Route not found', {
  requestId: req.requestId,
  method: req.method,
  url: req.url,
});
```

### info

Informational messages about application flow and operations.

```javascript
logger.info('User logged in successfully', {
  userId: user._id,
  email: user.email,
});
```

### debug

Detailed debug information (only in development).

```javascript
logger.debug('Cache hit', {
  key: cacheKey,
  ttl: 3600,
});
```

## Usage

### Basic Logging

```javascript
const logger = require('./config/logger');

// Log an info message
logger.info('Server started', { port: 3000 });

// Log an error with stack trace
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
  });
}
```

### Request Logging

Request logging is automatically handled by the `requestLogger` middleware. Every request gets:

- Unique request ID
- Method, URL, IP, User Agent
- Response status code and time

```javascript
// Incoming request log
{
  "level": "info",
  "message": "Incoming request",
  "requestId": "885da0c5-1e1c-4d29-9034-a5665a55079b",
  "method": "GET",
  "url": "/api/users",
  "ip": "127.0.0.1",
  "userAgent": "curl/8.5.0",
  "timestamp": "2025-10-04 08:16:18"
}

// Request completed log
{
  "level": "info",
  "message": "Request completed",
  "requestId": "885da0c5-1e1c-4d29-9034-a5665a55079b",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": "45ms",
  "timestamp": "2025-10-04 08:16:18"
}
```

## Log Files

### Location

All log files are stored in `backend/logs/`

### File Types

#### Combined Logs

- **Pattern**: `combined-YYYY-MM-DD.log`
- **Content**: All log levels (info, warn, error, debug)
- **Format**: JSON, one log entry per line

#### Error Logs

- **Pattern**: `error-YYYY-MM-DD.log`
- **Content**: Only error level logs
- **Format**: JSON, one log entry per line

### Log Rotation

- **Frequency**: Daily
- **Retention**: 14 days
- **Compression**: Old logs are automatically compressed (.gz)
- **Cleanup**: Logs older than 14 days are automatically deleted

## Configuration

### Environment Variables

```bash
# Set log level (default: info)
LOG_LEVEL=debug  # Options: error, warn, info, debug

# Set environment (affects console output)
NODE_ENV=production  # Console logging disabled in production
```

### Log Levels by Environment

**Development:**

- Console: Colorized, human-readable format
- Files: JSON format
- Level: debug (all logs)

**Production:**

- Console: Disabled (logs only to files)
- Files: JSON format
- Level: info (info, warn, error only)

## Viewing Logs

### Real-time Logs (Console)

```bash
# In development
npm run dev

# The console will show colorized logs
```

### File Logs

```bash
# View combined logs
tail -f backend/logs/combined-2025-10-04.log | jq .

# View error logs only
tail -f backend/logs/error-2025-10-04.log | jq .

# Search for specific request ID
grep "885da0c5-1e1c-4d29-9034-a5665a55079b" backend/logs/combined-*.log | jq .

# View logs from last hour
find backend/logs -name "combined-*.log" -mmin -60 -exec cat {} \; | jq .
```

### Docker Logs

```bash
# View backend logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## Best Practices

### 1. Use Structured Data

Always include relevant metadata as a second parameter:

```javascript
// Good
logger.info('User registered', {
  userId: user._id,
  email: user.email,
  role: user.role,
});

// Avoid
logger.info(`User ${user.email} registered with role ${user.role}`);
```

### 2. Include Request IDs

In route handlers, always include the request ID for correlation:

```javascript
app.post('/api/users', async (req, res) => {
  try {
    // Your logic here
    logger.info('User created', {
      requestId: req.requestId,
      userId: newUser._id,
    });
  } catch (error) {
    logger.error('Failed to create user', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });
  }
});
```

### 3. Log Important Events

- User authentication (login, logout, token refresh)
- Database operations (create, update, delete)
- External API calls
- Configuration changes
- Service start/stop

### 4. Don't Log Sensitive Data

Never log passwords, tokens, credit cards, or other sensitive information:

```javascript
// Bad
logger.info('User login', {
  email: user.email,
  password: password, // ❌ Never log passwords
});

// Good
logger.info('User login attempt', {
  email: user.email,
  success: true,
});
```

### 5. Use Appropriate Log Levels

- **error**: Failures that prevent operations from completing
- **warn**: Issues that don't stop execution but need attention
- **info**: Normal application flow and important events
- **debug**: Detailed information useful during development

## Integration with Monitoring Tools

The JSON format makes it easy to integrate with log aggregation tools:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **New Relic**
- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)

## Troubleshooting

### Logs not appearing in files

1. Check logs directory exists: `mkdir -p backend/logs`
2. Check file permissions
3. Verify LOG_LEVEL environment variable

### Disk space issues

- Adjust retention period in `src/config/logger.js` (maxFiles parameter)
- Ensure old logs are being compressed and deleted
- Monitor disk usage: `du -h backend/logs/`

### Performance impact

- Use appropriate log levels (avoid debug in production)
- Consider async logging for high-traffic applications
- Monitor log file sizes and rotation

## Further Reading

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Best Practices for Application Logging](https://logmatic.io/blog/best-practices-application-logging/)
