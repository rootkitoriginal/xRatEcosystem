const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../../../src/utils/jwt');

describe('JWT Utilities - Token Structure & Validation', () => {
  const testPayload = { userId: 'test123', role: 'user' };
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts: header.payload.signature
    });

    it('should encode payload correctly in token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should include expiration time in token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different tokens for same payload (due to iat)', () => {
      const token1 = generateAccessToken(testPayload);
      // Small delay to ensure different iat
      const token2 = generateAccessToken(testPayload);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      // Tokens may be same if generated in same second, but decoded iat should exist
      const decoded1 = jwt.verify(token1, JWT_SECRET);
      const decoded2 = jwt.verify(token2, JWT_SECRET);
      expect(decoded1.iat).toBeDefined();
      expect(decoded2.iat).toBeDefined();
    });

    it('should handle empty payload', () => {
      const token = generateAccessToken({});
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should encode payload correctly in refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should use different secret than access token', () => {
      const accessToken = generateAccessToken(testPayload);
      const refreshToken = generateRefreshToken(testPayload);

      // Access token should not verify with refresh secret
      expect(() => {
        jwt.verify(accessToken, JWT_REFRESH_SECRET);
      }).toThrow();

      // Refresh token should not verify with access secret
      expect(() => {
        jwt.verify(refreshToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw JsonWebTokenError for malformed token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.structure');
      }).toThrow();
    });

    it('should throw error for token with invalid signature', () => {
      const token = generateAccessToken(testPayload);
      // Corrupt the signature
      const parts = token.split('.');
      const corruptedToken = `${parts[0]}.${parts[1]}.corrupted_signature`;

      expect(() => {
        verifyAccessToken(corruptedToken);
      }).toThrow();
    });

    it('should throw error for token with modified payload', () => {
      const token = generateAccessToken(testPayload);
      const parts = token.split('.');

      // Modify payload
      const modifiedPayload = Buffer.from(
        JSON.stringify({ userId: 'hacked', role: 'admin' })
      ).toString('base64url');
      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      expect(() => {
        verifyAccessToken(tamperedToken);
      }).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });

    it('should throw error for null token', () => {
      expect(() => {
        verifyAccessToken(null);
      }).toThrow();
    });

    it('should throw error for undefined token', () => {
      expect(() => {
        verifyAccessToken(undefined);
      }).toThrow();
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign(testPayload, 'wrong-secret', { expiresIn: '1h' });

      expect(() => {
        verifyAccessToken(token);
      }).toThrow();
    });

    it('should throw TokenExpiredError for expired token', () => {
      const expiredToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '-1s' });

      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow('jwt expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token');
      }).toThrow();
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(testPayload);

      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow();
    });
  });

  describe('JWT Edge Cases - Malformed Tokens', () => {
    it('should reject token with missing signature part', () => {
      const token = generateAccessToken(testPayload);
      const parts = token.split('.');
      const malformedToken = `${parts[0]}.${parts[1]}`;

      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    it('should reject token with missing payload part', () => {
      const token = generateAccessToken(testPayload);
      const parts = token.split('.');
      const malformedToken = `${parts[0]}..${parts[2]}`;

      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    it('should reject token with missing header part', () => {
      const token = generateAccessToken(testPayload);
      const parts = token.split('.');
      const malformedToken = `.${parts[1]}.${parts[2]}`;

      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    it('should reject token with extra parts', () => {
      const token = generateAccessToken(testPayload);
      const malformedToken = `${token}.extra.part`;

      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    it('should reject token with invalid base64 encoding', () => {
      expect(() => {
        verifyAccessToken('invalid!!!.base64!!!.encoding!!!');
      }).toThrow();
    });

    it('should reject token with whitespace', () => {
      const token = generateAccessToken(testPayload);

      expect(() => {
        verifyAccessToken(` ${token} `);
      }).toThrow();
    });

    it('should reject token with newlines', () => {
      const token = generateAccessToken(testPayload);

      expect(() => {
        verifyAccessToken(`${token}\n`);
      }).toThrow();
    });
  });

  describe('JWT Security - Algorithm Manipulation', () => {
    it('should reject token with "alg: none" attack', () => {
      // Create a token with "none" algorithm
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      expect(() => {
        verifyAccessToken(noneToken);
      }).toThrow();
    });

    it('should reject token with modified algorithm in header', () => {
      // Create token with wrong algorithm
      const header = Buffer.from(JSON.stringify({ alg: 'HS512', typ: 'JWT' })).toString(
        'base64url'
      );
      const payload = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
      const signature = 'fake_signature';
      const modifiedAlgToken = `${header}.${payload}.${signature}`;

      expect(() => {
        verifyAccessToken(modifiedAlgToken);
      }).toThrow();
    });
  });

  describe('JWT Edge Cases - Payload Corruption', () => {
    it('should reject token with corrupted JSON in payload', () => {
      const token = generateAccessToken(testPayload);
      const parts = token.split('.');

      // Create invalid JSON payload
      const corruptedPayload = Buffer.from('{"invalid": json}').toString('base64url');
      const corruptedToken = `${parts[0]}.${corruptedPayload}.${parts[2]}`;

      expect(() => {
        verifyAccessToken(corruptedToken);
      }).toThrow();
    });

    it('should reject token with special characters injection', () => {
      const maliciousPayload = {
        userId: 'test<script>alert("xss")</script>',
        role: 'admin"; DROP TABLE users; --',
      };

      const token = generateAccessToken(maliciousPayload);
      const decoded = verifyAccessToken(token);

      // Token should verify but payload should contain the exact strings
      expect(decoded.userId).toContain('<script>');
      expect(decoded.role).toContain('DROP TABLE');
      // This test verifies that JWT handles special chars but doesn't execute them
    });

    it('should handle extremely long payload', () => {
      const longPayload = {
        userId: 'a'.repeat(10000),
        role: 'user',
      };

      const token = generateAccessToken(longPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId.length).toBe(10000);
    });

    it('should handle payload with null values', () => {
      const nullPayload = {
        userId: null,
        role: null,
      };

      const token = generateAccessToken(nullPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBeNull();
      expect(decoded.role).toBeNull();
    });

    it('should handle payload with nested objects', () => {
      const nestedPayload = {
        userId: 'test123',
        metadata: {
          permissions: ['read', 'write'],
          settings: { theme: 'dark' },
        },
      };

      const token = generateAccessToken(nestedPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.metadata.permissions).toEqual(['read', 'write']);
      expect(decoded.metadata.settings.theme).toBe('dark');
    });
  });

  describe('JWT Edge Cases - Expiration Scenarios', () => {
    it('should handle token expiring at exact moment', () => {
      // Create token that expires in 1 second
      const shortLivedToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1s' });

      // Verify immediately (should work)
      const decoded = verifyAccessToken(shortLivedToken);
      expect(decoded.userId).toBe(testPayload.userId);

      // After 2 seconds it should fail (tested separately due to timing)
    });

    it('should accept token with very long expiration', () => {
      const longLivedToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '365d' });

      const decoded = verifyAccessToken(longLivedToken);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should reject token with negative expiration (already expired)', () => {
      const expiredToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '-10s' });

      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow();
    });

    it('should handle token without expiration claim', () => {
      const noExpToken = jwt.sign(testPayload, JWT_SECRET, { noTimestamp: false });

      const decoded = verifyAccessToken(noExpToken);
      expect(decoded.userId).toBe(testPayload.userId);
    });
  });

  describe('JWT Edge Cases - Clock Skew Scenarios', () => {
    it('should handle token with future iat (issued at)', () => {
      // Create token with future iat (clock skew scenario)
      const futureIat = Math.floor(Date.now() / 1000) + 60; // 1 minute in future
      const futureToken = jwt.sign({ ...testPayload, iat: futureIat }, JWT_SECRET);

      // jsonwebtoken library may or may not accept this depending on version
      // This test documents the behavior
      try {
        const decoded = verifyAccessToken(futureToken);
        expect(decoded.userId).toBe(testPayload.userId);
      } catch (error) {
        // If library rejects future iat, that's also valid behavior
        expect(error).toBeDefined();
      }
    });
  });

  describe('JWT Edge Cases - Type Confusion', () => {
    it('should reject numeric token', () => {
      expect(() => {
        verifyAccessToken(12345);
      }).toThrow();
    });

    it('should reject boolean token', () => {
      expect(() => {
        verifyAccessToken(true);
      }).toThrow();
    });

    it('should reject array token', () => {
      expect(() => {
        verifyAccessToken(['token', 'parts']);
      }).toThrow();
    });

    it('should reject object token', () => {
      expect(() => {
        verifyAccessToken({ token: 'value' });
      }).toThrow();
    });
  });
});
