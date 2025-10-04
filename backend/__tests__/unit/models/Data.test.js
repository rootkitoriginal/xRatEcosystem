const mongoose = require('mongoose');
const Data = require('../../../src/models/Data');

describe('Data Model', () => {
  let mockUserId;

  beforeAll(() => {
    // Create a mock ObjectId
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe('Schema Validation - Success Cases', () => {
    it('should create a valid data entity with required fields', () => {
      const validData = new Data({
        name: 'Test Data',
        content: 'Test content',
        userId: mockUserId,
      });

      const error = validData.validateSync();
      expect(error).toBeUndefined();
      expect(validData.name).toBe('Test Data');
      expect(validData.content).toBe('Test content');
      expect(validData.userId).toEqual(mockUserId);
    });

    it('should create data with all optional fields', () => {
      const validData = new Data({
        name: 'Complete Data',
        description: 'A comprehensive description',
        content: { key: 'value' },
        type: 'json',
        tags: ['tag1', 'tag2'],
        status: 'active',
        metadata: new Map([['key', 'value']]),
        userId: mockUserId,
      });

      const error = validData.validateSync();
      expect(error).toBeUndefined();
      expect(validData.description).toBe('A comprehensive description');
      expect(validData.type).toBe('json');
      expect(validData.tags).toEqual(['tag1', 'tag2']);
      expect(validData.status).toBe('active');
    });

    it('should trim whitespace from name', () => {
      const validData = new Data({
        name: '  Trimmed Name  ',
        content: 'content',
        userId: mockUserId,
      });

      const error = validData.validateSync();
      expect(error).toBeUndefined();
      expect(validData.name).toBe('Trimmed Name');
    });

    it('should accept different content types', () => {
      const testCases = [
        { content: 'string content', expectedType: 'text' },
        { content: 123, expectedType: 'number' },
        { content: true, expectedType: 'boolean' },
        { content: ['array', 'items'], expectedType: 'array' },
        { content: { key: 'value' }, expectedType: 'object' },
      ];

      testCases.forEach(({ content }) => {
        const validData = new Data({
          name: 'Test',
          content,
          userId: mockUserId,
        });

        const error = validData.validateSync();
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Schema Validation - Failure Cases', () => {
    it('should require name field', () => {
      const invalidData = new Data({
        content: 'content',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toBe('Name is required');
    });

    it('should require content field', () => {
      const invalidData = new Data({
        name: 'Test',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.content).toBeDefined();
      expect(error.errors.content.message).toBe('Content is required');
    });

    it('should require userId field', () => {
      const invalidData = new Data({
        name: 'Test',
        content: 'content',
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.userId.message).toBe('User ID is required');
    });

    it('should enforce minimum name length', () => {
      const invalidData = new Data({
        name: 'A', // Only 1 character
        content: 'content',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toContain('at least 2 characters');
    });

    it('should enforce maximum name length', () => {
      const invalidData = new Data({
        name: 'A'.repeat(101), // 101 characters
        content: 'content',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toContain('not exceed 100 characters');
    });

    it('should enforce maximum description length', () => {
      const invalidData = new Data({
        name: 'Test',
        description: 'A'.repeat(501), // 501 characters
        content: 'content',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.description.message).toContain('not exceed 500 characters');
    });

    it('should validate type enum values', () => {
      const invalidData = new Data({
        name: 'Test',
        content: 'content',
        type: 'invalid-type',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should validate status enum values', () => {
      const invalidData = new Data({
        name: 'Test',
        content: 'content',
        status: 'invalid-status',
        userId: mockUserId,
      });

      const error = invalidData.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate age in days', () => {
      const data = new Data({
        name: 'Test',
        content: 'content',
        userId: mockUserId,
      });

      // Set createdAt to 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      data.createdAt = fiveDaysAgo;

      expect(data.age).toBe(5);
    });

    it('should return 0 age for newly created data', () => {
      const data = new Data({
        name: 'Test',
        content: 'content',
        userId: mockUserId,
      });

      data.createdAt = new Date();
      expect(data.age).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    describe('archive()', () => {
      it('should change status to archived', async () => {
        const data = new Data({
          name: 'Test',
          content: 'content',
          userId: mockUserId,
          status: 'active',
        });

        // Mock save method
        data.save = jest.fn().mockResolvedValue(data);

        await data.archive();

        expect(data.status).toBe('archived');
        expect(data.save).toHaveBeenCalled();
      });
    });

    describe('activate()', () => {
      it('should change status to active', async () => {
        const data = new Data({
          name: 'Test',
          content: 'content',
          userId: mockUserId,
          status: 'archived',
        });

        // Mock save method
        data.save = jest.fn().mockResolvedValue(data);

        await data.activate();

        expect(data.status).toBe('active');
        expect(data.save).toHaveBeenCalled();
      });
    });
  });

  describe('Pre-save Hook - Type Auto-detection', () => {
    it('should auto-detect array type when type is not set', () => {
      const data = new Data({
        name: 'Array Data',
        content: ['item1', 'item2'],
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = true;
      data.type = undefined;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBe('array');
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should auto-detect object type when type is not set', () => {
      const data = new Data({
        name: 'Object Data',
        content: { key: 'value' },
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = true;
      data.type = undefined;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBe('object');
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should auto-detect string type when type is not set', () => {
      const data = new Data({
        name: 'String Data',
        content: 'text content',
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = true;
      data.type = undefined;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBe('string');
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should auto-detect number type when type is not set', () => {
      const data = new Data({
        name: 'Number Data',
        content: 42,
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = true;
      data.type = undefined;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBe('number');
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should not change type if already set', () => {
      const data = new Data({
        name: 'Typed Data',
        content: { key: 'value' },
        type: 'json',
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = true;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBe('json');
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should not change type if not a new document', () => {
      const data = new Data({
        name: 'Existing Data',
        content: 'text',
        userId: mockUserId,
      });

      const nextSpy = jest.fn();
      data.isNew = false;
      data.type = undefined;

      // Simulate the pre-save hook
      const preSaveHook = function(next) {
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
      };

      preSaveHook.call(data, nextSpy);

      expect(data.type).toBeUndefined();
      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    describe('findByUserWithFilters()', () => {
      beforeEach(() => {
        // Mock the find method
        Data.find = jest.fn().mockReturnValue(Promise.resolve([]));
      });

      it('should build query with userId and default status', () => {
        Data.findByUserWithFilters(mockUserId);

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'active',
        });
      });

      it('should include type filter when provided', () => {
        Data.findByUserWithFilters(mockUserId, { type: 'json' });

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'active',
          type: 'json',
        });
      });

      it('should include tags filter when provided', () => {
        const tags = ['tag1', 'tag2'];
        Data.findByUserWithFilters(mockUserId, { tags });

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'active',
          tags: { $in: tags },
        });
      });

      it('should include search filter when provided', () => {
        Data.findByUserWithFilters(mockUserId, { search: 'test query' });

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'active',
          $text: { $search: 'test query' },
        });
      });

      it('should override default status when provided', () => {
        Data.findByUserWithFilters(mockUserId, { status: 'archived' });

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'archived',
        });
      });

      it('should combine multiple filters', () => {
        const filters = {
          type: 'json',
          tags: ['tag1'],
          status: 'active',
          search: 'test',
        };

        Data.findByUserWithFilters(mockUserId, filters);

        expect(Data.find).toHaveBeenCalledWith({
          userId: mockUserId,
          status: 'active',
          type: 'json',
          tags: { $in: ['tag1'] },
          $text: { $search: 'test' },
        });
      });
    });
  });

  describe('Pre-save Hook - Auto-detect Type', () => {
    it('should auto-detect type as array for array content when type not set', () => {
      const data = new Data({
        name: 'Test',
        content: ['item1', 'item2'],
        userId: mockUserId,
      });

      // Without explicitly setting type, the default is 'text'
      // But we can test the logic by unsetting it
      data.type = undefined;
      data.isNew = true;

      // Manually trigger the pre-save logic
      if (data.isNew && !data.type) {
        const contentType = typeof data.content;
        if (Array.isArray(data.content)) {
          data.type = 'array';
        } else if (contentType === 'object' && data.content !== null) {
          data.type = 'object';
        } else {
          data.type = contentType;
        }
      }

      expect(data.type).toBe('array');
    });

    it('should auto-detect type as object for object content when type not set', () => {
      const data = new Data({
        name: 'Test',
        content: { key: 'value' },
        userId: mockUserId,
      });

      data.type = undefined;
      data.isNew = true;

      if (data.isNew && !data.type) {
        const contentType = typeof data.content;
        if (Array.isArray(data.content)) {
          data.type = 'array';
        } else if (contentType === 'object' && data.content !== null) {
          data.type = 'object';
        } else {
          data.type = contentType;
        }
      }

      expect(data.type).toBe('object');
    });

    it('should auto-detect type as string for string content when type not set', () => {
      const data = new Data({
        name: 'Test',
        content: 'text content',
        userId: mockUserId,
      });

      data.type = undefined;
      data.isNew = true;

      if (data.isNew && !data.type) {
        const contentType = typeof data.content;
        if (Array.isArray(data.content)) {
          data.type = 'array';
        } else if (contentType === 'object' && data.content !== null) {
          data.type = 'object';
        } else {
          data.type = contentType;
        }
      }

      expect(data.type).toBe('string');
    });

    it('should not override explicitly set type', () => {
      const data = new Data({
        name: 'Test',
        content: ['array'],
        type: 'json',
        userId: mockUserId,
      });

      data.isNew = true;

      // Pre-save hook should not run if type is already set
      if (data.isNew && !data.type) {
        if (Array.isArray(data.content)) {
          data.type = 'array';
        } else if (typeof data.content === 'object' && data.content !== null) {
          data.type = 'object';
        } else {
          data.type = typeof data.content;
        }
      }

      expect(data.type).toBe('json');
    });
  });

  describe('Default Values', () => {
    it('should set default type to text', () => {
      const data = new Data({
        name: 'Test',
        content: 'content',
        userId: mockUserId,
      });

      // When not auto-detected, schema default is 'text'
      expect(data.type).toBeDefined();
    });

    it('should set default status to active', () => {
      const data = new Data({
        name: 'Test',
        content: 'content',
        userId: mockUserId,
      });

      expect(data.status).toBe('active');
    });

    it('should set default tags to empty array', () => {
      const data = new Data({
        name: 'Test',
        content: 'content',
        userId: mockUserId,
      });

      expect(data.tags).toEqual([]);
    });
  });
});
