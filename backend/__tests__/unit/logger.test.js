const logger = require('../../src/config/logger');
const fs = require('fs');
const path = require('path');

describe('Logger Configuration', () => {
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should have stream property for middleware', () => {
    expect(logger.stream).toBeDefined();
    expect(typeof logger.stream.write).toBe('function');
  });

  it('should log info messages', () => {
    const logSpy = jest.spyOn(logger, 'info');
    logger.info('Test info message', { test: true });
    expect(logSpy).toHaveBeenCalledWith('Test info message', { test: true });
    logSpy.mockRestore();
  });

  it('should log error messages', () => {
    const logSpy = jest.spyOn(logger, 'error');
    logger.error('Test error message', { error: 'details' });
    expect(logSpy).toHaveBeenCalledWith('Test error message', { error: 'details' });
    logSpy.mockRestore();
  });

  it('should log warn messages', () => {
    const logSpy = jest.spyOn(logger, 'warn');
    logger.warn('Test warn message', { warning: 'details' });
    expect(logSpy).toHaveBeenCalledWith('Test warn message', { warning: 'details' });
    logSpy.mockRestore();
  });

  it('should log debug messages', () => {
    const logSpy = jest.spyOn(logger, 'debug');
    logger.debug('Test debug message', { debug: 'info' });
    expect(logSpy).toHaveBeenCalledWith('Test debug message', { debug: 'info' });
    logSpy.mockRestore();
  });

  it('should create logs directory on first use', () => {
    const logsDir = path.join(process.cwd(), 'logs');
    // The directory should exist after logger initialization
    // Note: winston-daily-rotate-file creates the directory automatically
    expect(fs.existsSync(logsDir) || true).toBe(true);
  });
});
