const Joi = require('joi');
const validator = require('validator');
const logger = require('../config/logger');

/**
 * WebSocket Event Validators
 * Provides schemas and validation for all WebSocket events
 */

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove any HTML tags and trim whitespace
  let sanitized = validator.escape(input);
  sanitized = validator.trim(sanitized);

  return sanitized;
}

/**
 * Deep sanitize object - recursively sanitize all string values
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}

/**
 * Validation Schemas
 */
const schemas = {
  // data:subscribe event
  dataSubscribe: Joi.object({
    entity: Joi.string()
      .required()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.pattern.base':
          'Entity name can only contain alphanumeric characters, hyphens, and underscores',
        'string.max': 'Entity name must not exceed 100 characters',
        'any.required': 'Entity is required',
      }),
    filters: Joi.object()
      .optional()
      .max(10)
      .pattern(
        Joi.string().max(50),
        Joi.alternatives().try(Joi.string().max(200), Joi.number(), Joi.boolean())
      )
      .messages({
        'object.max': 'Maximum 10 filters allowed',
      }),
  }).unknown(false),

  // notification:read event
  notificationRead: Joi.object({
    notificationId: Joi.string()
      .required()
      .trim()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid notification ID format (must be MongoDB ObjectId)',
        'any.required': 'Notification ID is required',
      }),
  }).unknown(false),

  // user:typing event
  userTyping: Joi.object({
    roomId: Joi.string().required().trim().min(1).max(200).messages({
      'string.min': 'Room ID cannot be empty',
      'string.max': 'Room ID must not exceed 200 characters',
      'any.required': 'Room ID is required',
    }),
    isTyping: Joi.boolean().optional(),
  }).unknown(false),

  // room:join event
  roomJoin: Joi.object({
    roomId: Joi.string()
      .required()
      .trim()
      .min(1)
      .max(200)
      .pattern(/^[a-zA-Z0-9:_-]+$/)
      .messages({
        'string.pattern.base':
          'Room ID can only contain alphanumeric characters, colons, hyphens, and underscores',
        'string.max': 'Room ID must not exceed 200 characters',
        'any.required': 'Room ID is required',
      }),
    entity: Joi.string()
      .optional()
      .trim()
      .max(100)
      .pattern(/^[a-zA-Z0-9_-]+$/),
    filters: Joi.object().optional().max(10),
  }).unknown(false),

  // room:leave event
  roomLeave: Joi.object({
    roomId: Joi.string().required().trim().min(1).max(200).messages({
      'any.required': 'Room ID is required',
    }),
  }).unknown(false),

  // message:send event (for future chat implementation)
  messageSend: Joi.object({
    roomId: Joi.string().required().trim().min(1).max(200),
    message: Joi.string().required().trim().min(1).max(5000).messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 5000 characters',
      'any.required': 'Message is required',
    }),
    metadata: Joi.object().optional().max(10),
  }).unknown(false),
};

/**
 * Validate and sanitize event data
 * @param {string} eventName - The event name
 * @param {object} data - The data to validate
 * @param {object} context - Additional context (userId, socketId)
 * @returns {object} - { valid, sanitizedData, error }
 */
function validateEvent(eventName, data, context = {}) {
  // Get schema for event
  const schema = schemas[eventName];

  if (!schema) {
    logger.warn('No validation schema for event', {
      eventName,
      socketId: context.socketId,
      userId: context.userId,
    });
    return {
      valid: false,
      error: 'Unknown event type',
    };
  }

  // Validate against schema
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('; ');

    logger.warn('WebSocket event validation failed', {
      eventName,
      socketId: context.socketId,
      userId: context.userId,
      errors: errorMessages,
      data: JSON.stringify(data),
    });

    return {
      valid: false,
      error: errorMessages,
      details: error.details,
    };
  }

  // Sanitize the validated data
  const sanitizedData = sanitizeObject(value);

  logger.debug('WebSocket event validated successfully', {
    eventName,
    socketId: context.socketId,
    userId: context.userId,
  });

  return {
    valid: true,
    sanitizedData,
  };
}

/**
 * Create a validation middleware for WebSocket events
 * @param {string} eventName - The event name to validate
 * @returns {function} - Middleware function
 */
function createValidator(eventName) {
  return (socket, data, callback) => {
    const context = {
      socketId: socket.id,
      userId: socket.user?._id?.toString(),
      username: socket.user?.username,
    };

    const result = validateEvent(eventName, data, context);

    if (!result.valid) {
      const error = {
        event: eventName,
        message: 'Validation failed',
        error: result.error,
        timestamp: new Date().toISOString(),
      };

      socket.emit('validation:error', error);

      logger.warn('WebSocket validation error sent to client', {
        ...context,
        eventName,
        error: result.error,
      });

      if (callback && typeof callback === 'function') {
        callback(error);
      }

      return null;
    }

    return result.sanitizedData;
  };
}

module.exports = {
  schemas,
  validateEvent,
  sanitizeString,
  sanitizeObject,
  createValidator,
};
