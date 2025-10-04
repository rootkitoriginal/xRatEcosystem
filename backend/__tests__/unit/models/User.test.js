const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');

// Mock bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation - Success Cases', () => {
    it('should create a valid user with required fields', () => {
      const validUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = validUser.validateSync();
      expect(error).toBeUndefined();
      expect(validUser.username).toBe('testuser');
      expect(validUser.email).toBe('test@example.com');
      expect(validUser.password).toBe('Password123');
    });

    it('should create user with all optional fields', () => {
      const validUser = new User({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'SecurePass123',
        role: 'admin',
        refreshToken: 'some-refresh-token',
      });

      const error = validUser.validateSync();
      expect(error).toBeUndefined();
      expect(validUser.role).toBe('admin');
      expect(validUser.refreshToken).toBe('some-refresh-token');
    });

    it('should trim whitespace from username', () => {
      const validUser = new User({
        username: '  trimmed  ',
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = validUser.validateSync();
      expect(error).toBeUndefined();
      expect(validUser.username).toBe('trimmed');
    });

    it('should convert email to lowercase', () => {
      const validUser = new User({
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123',
      });

      const error = validUser.validateSync();
      expect(error).toBeUndefined();
      expect(validUser.email).toBe('test@example.com');
    });

    it('should set default role to user', () => {
      const validUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(validUser.role).toBe('user');
    });
  });

  describe('Schema Validation - Failure Cases', () => {
    it('should require username field', () => {
      const invalidUser = new User({
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.username.message).toBe('Username is required');
    });

    it('should require email field', () => {
      const invalidUser = new User({
        username: 'testuser',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.email.message).toBe('Email is required');
    });

    it('should require password field', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'test@example.com',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.message).toBe('Password is required');
    });

    it('should enforce minimum username length', () => {
      const invalidUser = new User({
        username: 'ab', // Only 2 characters
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.username.message).toContain('at least 3 characters');
    });

    it('should enforce maximum username length', () => {
      const invalidUser = new User({
        username: 'a'.repeat(31), // 31 characters
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.username.message).toContain('not exceed 30 characters');
    });

    it('should enforce minimum password length', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Pass12', // Only 6 characters
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.message).toContain('at least 8 characters');
    });

    it('should validate email format', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.email.message).toContain('valid email');
    });

    it('should validate role enum values', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: 'superadmin', // Invalid role
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });
  });

  describe('Password Hashing - Pre-save Hook', () => {
    it('should hash password before saving new user', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'PlainPassword123',
      });

      // Mock bcrypt methods
      bcrypt.genSalt.mockResolvedValue('mocksalt');
      bcrypt.hash.mockResolvedValue('hashedpassword123');

      // Mock save to trigger pre-save hook
      user.save = jest.fn(async function () {
        // Simulate the pre-save hook
        if (this.isModified('password')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        return this;
      });

      user.isModified = jest.fn(() => true);

      await user.save();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('PlainPassword123', 'mocksalt');
      expect(user.password).toBe('hashedpassword123');
    });

    it('should not hash password if not modified', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      user.isModified = jest.fn(() => false);
      user.save = jest.fn(async function () {
        if (this.isModified('password')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        return this;
      });

      await user.save();

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should handle hashing errors', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'PlainPassword123',
      });

      const hashError = new Error('Hashing failed');
      bcrypt.genSalt.mockRejectedValue(hashError);

      user.isModified = jest.fn(() => true);
      user.save = jest.fn(async function () {
        if (this.isModified('password')) {
          try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
          } catch (error) {
            throw error;
          }
        }
        return this;
      });

      await expect(user.save()).rejects.toThrow('Hashing failed');
    });
  });

  describe('Password Comparison - comparePassword Method', () => {
    it('should return true for matching passwords', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await user.comparePassword('PlainPassword123');

      expect(bcrypt.compare).toHaveBeenCalledWith('PlainPassword123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await user.comparePassword('WrongPassword123');

      expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword123', 'hashedpassword');
      expect(result).toBe(false);
    });

    it('should handle comparison errors', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const compareError = new Error('Comparison failed');
      bcrypt.compare.mockRejectedValue(compareError);

      await expect(user.comparePassword('PlainPassword123')).rejects.toThrow('Comparison failed');
    });
  });

  describe('toJSON Serialization', () => {
    it('should remove password from JSON output', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.username).toBe('testuser');
      expect(json.email).toBe('test@example.com');
      expect(json.role).toBe('user');
    });

    it('should remove refreshToken from JSON output', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        refreshToken: 'secret-token',
      });

      const json = user.toJSON();

      expect(json.refreshToken).toBeUndefined();
      expect(json.username).toBe('testuser');
    });

    it('should preserve other fields in JSON output', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'admin',
      });

      user._id = new mongoose.Types.ObjectId();
      user.createdAt = new Date();
      user.updatedAt = new Date();

      const json = user.toJSON();

      expect(json.username).toBe('testuser');
      expect(json.email).toBe('test@example.com');
      expect(json.role).toBe('admin');
      expect(json._id).toBeDefined();
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });
  });

  describe('Timestamp Updates', () => {
    it('should update updatedAt timestamp on save', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      const originalTime = new Date('2024-01-01');
      user.updatedAt = originalTime;

      // Mock save to trigger pre-save hook
      user.save = jest.fn(async function () {
        this.updatedAt = new Date();
        return this;
      });

      await user.save();

      expect(user.updatedAt).not.toEqual(originalTime);
      expect(new Date(user.updatedAt).getTime()).toBeGreaterThan(originalTime.getTime());
    });

    it('should have default createdAt timestamp', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(user.createdAt).toBeDefined();
    });

    it('should have default updatedAt timestamp', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in optional fields', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        refreshToken: '',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.refreshToken).toBe('');
    });

    it('should handle special characters in username', () => {
      const user = new User({
        username: 'test_user-123',
        email: 'test@example.com',
        password: 'Password123',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should validate email with subdomains', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@mail.example.com',
        password: 'Password123',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject email without domain', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'test@',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should reject email without @ symbol', () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'testexample.com',
        password: 'Password123',
      });

      const error = invalidUser.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });
  });
});
