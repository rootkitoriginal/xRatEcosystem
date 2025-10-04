const Joi = require('joi');

/**
 * Validation schemas for Data Management API
 */

// Schema for creating a new data entity
const createDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  description: Joi.string().max(500).trim().allow('').optional(),
  content: Joi.any().required().messages({
    'any.required': 'Content is required',
  }),
  type: Joi.string().valid('text', 'json', 'number', 'boolean', 'array', 'object').optional(),
  tags: Joi.array().items(Joi.string().trim()).default([]),
  status: Joi.string().valid('active', 'archived', 'deleted').default('active'),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

// Schema for updating a data entity
const updateDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  description: Joi.string().max(500).trim().allow('').optional(),
  content: Joi.any().optional(),
  type: Joi.string().valid('text', 'json', 'number', 'boolean', 'array', 'object').optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  status: Joi.string().valid('active', 'archived', 'deleted').optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
}).min(1); // At least one field must be provided

// Schema for query parameters
const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().default('-createdAt'),
  status: Joi.string().valid('active', 'archived', 'deleted').optional(),
  type: Joi.string().valid('text', 'json', 'number', 'boolean', 'array', 'object').optional(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  search: Joi.string().trim().optional(),
});

// Schema for bulk operations
const bulkOperationSchema = Joi.object({
  operation: Joi.string().valid('create', 'update', 'delete').required(),
  data: Joi.when('operation', {
    is: 'create',
    then: Joi.array().items(createDataSchema).min(1).max(100).required().messages({
      'array.min': 'At least one item is required',
      'array.max': 'Maximum 100 items allowed per bulk operation',
    }),
    otherwise: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          updates: updateDataSchema.optional(),
        })
      )
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'At least one item is required',
        'array.max': 'Maximum 100 items allowed per bulk operation',
      }),
  }),
});

// Schema for export parameters
const exportParamsSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json'),
  status: Joi.string().valid('active', 'archived', 'deleted').optional(),
  type: Joi.string().valid('text', 'json', 'number', 'boolean', 'array', 'object').optional(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
});

/**
 * Middleware to validate request body
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * Middleware to validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  createDataSchema,
  updateDataSchema,
  queryParamsSchema,
  bulkOperationSchema,
  exportParamsSchema,
  validate,
  validateQuery,
};
