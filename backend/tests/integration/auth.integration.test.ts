import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import bcrypt from 'bcryptjs';

import { createTestDb, setupSchema, truncateAll } from '../helpers/test-db.js';

const testDb = createTestDb();

const emailServiceMock = {
  sendPasswordResetEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendLowStockAlert: jest.fn(),
};

jest.unstable_mockModule('../../src/config/database.js', () => ({
  db: testDb.db,
  testConnection: async () => true,
  closeConnection: async () => testDb.db.destroy(),
}));

jest.unstable_mockModule('../../src/services/email.service.js', () => ({
  emailService: emailServiceMock,
}));

const { AuthService } = await import('../../src/services/auth.service.js');

describe('AuthService integration', () => {
  let authService: InstanceType<typeof AuthService>;
  const userId = '11111111-1111-1111-1111-111111111111';
  const oldTokenId = '22222222-2222-2222-2222-222222222222';
  const resetTokenId = '33333333-3333-3333-3333-333333333333';

  beforeAll(async () => {
    await setupSchema(testDb.db);
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await truncateAll(testDb.db);
    emailServiceMock.sendPasswordResetEmail.mockReset();

    const passwordHash = await bcrypt.hash('password123', 10);
    await testDb.db('users').insert({
      id: userId,
      email: 'user@test.com',
      password_hash: passwordHash,
      name: 'Test User',
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    authService = new AuthService();
  });

  it('logs login and returns tokens', async () => {
    const result = await authService.login('user@test.com', 'password123');

    expect(result.tokens.access_token).toBeTruthy();
    expect(result.tokens.refresh_token).toBeTruthy();
    expect(result.user.email).toBe('user@test.com');

    const logs = await testDb.db('audit_logs').select('*');
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('LOGIN');
    expect(logs[0].entity).toBe('user');
    expect(logs[0].user_id).toBe(userId);
  });

  it('creates password reset token and invalidates previous ones', async () => {
    await testDb.db('password_reset_tokens').insert({
      id: oldTokenId,
      user_id: userId,
      token: 'old-token',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
      created_at: new Date(Date.now() - 1000),
    });

    await authService.requestPasswordReset('user@test.com');

    expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const tokens = await testDb.db('password_reset_tokens')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc');

    expect(tokens).toHaveLength(2);
    const [oldToken, newToken] = tokens;
    expect(oldToken.used).toBe(true);
    expect(newToken.used).toBe(false);
    expect(newToken.token).not.toBe('old-token');
  });

  it('confirms password reset and updates user password', async () => {
    await testDb.db('password_reset_tokens').insert({
      id: resetTokenId,
      user_id: userId,
      token: 'reset-token',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
      created_at: new Date(),
    });

    await authService.confirmPasswordReset('reset-token', 'newPassword123');

    const user = await testDb.db('users').where({ id: userId }).first();
    expect(user).toBeTruthy();
    const matches = await bcrypt.compare('newPassword123', user.password_hash);
    expect(matches).toBe(true);

    const token = await testDb.db('password_reset_tokens').where({ id: resetTokenId }).first();
    expect(token.used).toBe(true);
  });
});
