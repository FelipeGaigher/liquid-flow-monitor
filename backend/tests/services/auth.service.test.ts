import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AuthService, AuthError } from '../../src/services/auth.service.js';
import { User } from '../../src/types/index.js';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password_hash: '$2a$10$test-hash',
    name: 'Test User',
    role: 'admin',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should create different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);

      const result = await authService.verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await bcrypt.hash(password, 10);

      const result = await authService.verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should throw error for password shorter than 6 characters', () => {
      expect(() => authService.validatePasswordStrength('12345')).toThrow(AuthError);
      expect(() => authService.validatePasswordStrength('12345')).toThrow('Senha deve ter no minimo 6 caracteres');
    });

    it('should not throw for password with 6 or more characters', () => {
      expect(() => authService.validatePasswordStrength('123456')).not.toThrow();
      expect(() => authService.validatePasswordStrength('longerPassword')).not.toThrow();
    });

    it('should throw for empty password', () => {
      expect(() => authService.validatePasswordStrength('')).toThrow(AuthError);
    });

    it('should throw for password with 5 characters', () => {
      expect(() => authService.validatePasswordStrength('12345')).toThrow(AuthError);
    });

    it('should accept password with exactly 6 characters', () => {
      expect(() => authService.validatePasswordStrength('123456')).not.toThrow();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = authService.generateTokens(mockUser);

      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      expect(typeof tokens.access_token).toBe('string');
      expect(typeof tokens.refresh_token).toBe('string');
    });

    it('should include user data in token payload', () => {
      const tokens = authService.generateTokens(mockUser);
      const decoded = jwt.decode(tokens.access_token) as any;

      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should generate different tokens for access and refresh', () => {
      const tokens = authService.generateTokens(mockUser);

      expect(tokens.access_token).not.toBe(tokens.refresh_token);
    });

    it('should include expiration in tokens', () => {
      const tokens = authService.generateTokens(mockUser);
      const decodedAccess = jwt.decode(tokens.access_token) as any;
      const decodedRefresh = jwt.decode(tokens.refresh_token) as any;

      expect(decodedAccess.exp).toBeDefined();
      expect(decodedRefresh.exp).toBeDefined();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => {
      const tokens = authService.generateTokens(mockUser);
      const payload = authService.verifyAccessToken(tokens.access_token);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw for invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid-token')).toThrow(AuthError);
    });

    it('should throw for malformed token', () => {
      expect(() => authService.verifyAccessToken('not.a.valid.jwt')).toThrow(AuthError);
    });

    it('should throw for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      expect(() => authService.verifyAccessToken(expiredToken)).toThrow(AuthError);
      expect(() => authService.verifyAccessToken(expiredToken)).toThrow('Token expirado');
    });

    it('should throw for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => authService.verifyAccessToken(tokenWithWrongSecret)).toThrow(AuthError);
    });
  });

  describe('toPublicUser', () => {
    it('should convert user to public user (no password hash)', () => {
      const publicUser = authService.toPublicUser(mockUser);

      expect(publicUser.id).toBe(mockUser.id);
      expect(publicUser.email).toBe(mockUser.email);
      expect(publicUser.name).toBe(mockUser.name);
      expect(publicUser.role).toBe(mockUser.role);
      expect(publicUser.status).toBe(mockUser.status);
      expect((publicUser as any).password_hash).toBeUndefined();
    });

    it('should include all required public fields', () => {
      const publicUser = authService.toPublicUser(mockUser);

      expect(publicUser).toHaveProperty('id');
      expect(publicUser).toHaveProperty('email');
      expect(publicUser).toHaveProperty('name');
      expect(publicUser).toHaveProperty('role');
      expect(publicUser).toHaveProperty('status');
    });

    it('should not include sensitive fields', () => {
      const publicUser = authService.toPublicUser(mockUser);

      expect(publicUser).not.toHaveProperty('password_hash');
      expect(publicUser).not.toHaveProperty('created_at');
      expect(publicUser).not.toHaveProperty('updated_at');
    });
  });

  describe('AuthError', () => {
    it('should create error with message and code', () => {
      const error = new AuthError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AuthError');
    });

    it('should be instance of Error', () => {
      const error = new AuthError('Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
    });
  });
});
