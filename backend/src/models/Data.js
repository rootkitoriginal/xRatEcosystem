const mongoose = require('mongoose');

/**
 * Data Entity Schema
 * Represents a flexible data entity with metadata and validation
 */
const dataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
      index: true, // Index for search performance
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    content: {
      type: mongoose.Schema.Types.Mixed, // Flexible content field
      required: [true, 'Content is required'],
    },
    type: {
      type: String,
      enum: ['text', 'json', 'number', 'boolean', 'array', 'object'],
      default: 'text',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true, // Index for search performance
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
dataSchema.index({ userId: 1, status: 1 });
dataSchema.index({ userId: 1, createdAt: -1 });
dataSchema.index({ name: 'text', description: 'text' }); // Full-text search

// Virtual field for age of data
dataSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // Age in days
});

// Static method to find by user with filters
dataSchema.statics.findByUserWithFilters = function (userId, filters = {}) {
  const query = { userId, status: filters.status || 'active' };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  return this.find(query);
};

// Instance method to archive data
dataSchema.methods.archive = function () {
  this.status = 'archived';
  return this.save();
};

// Instance method to activate data
dataSchema.methods.activate = function () {
  this.status = 'active';
  return this.save();
};

// Pre-save hook to validate content type
dataSchema.pre('save', function (next) {
  // Auto-detect type if not set
  if (this.isNew && !this.type) {
    const contentType = typeof this.content;
    if (Array.isArray(this.content)) {
      this.type = 'array';
    } else if (contentType === 'object' && this.content !== null) {
      this.type = 'object';
    } else {
      this.type = contentType;
    }
  }
  next();
});

module.exports = mongoose.model('Data', dataSchema);
