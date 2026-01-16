import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { User, UserPublic, AuthTokens, JWTPayload } from '../types/index.js';
import { Role } from '../config/permissions.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';
import { auditLogsService } from './audit-logs.service.js';

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  async login(email: string, password: string): Promise<{ tokens: AuthTokens; user: UserPublic }> {
    const user = await db<User>('users')
      .where({ email, status: 'active' })
      .first();

    if (!user) {
      throw new AuthError('Email ou senha invalidos', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthError('Email ou senha invalidos', 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens(user);
    const userPublic = this.toPublicUser(user);

    await auditLogsService.create({
      user_id: user.id,
      action: 'LOGIN',
      entity: 'user',
      entity_id: user.id,
      old_values: null,
      new_values: {
        email: user.email,
        role: user.role,
      },
    });

    return { tokens, user: userPublic };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JWTPayload;

      const user = await db<User>('users')
        .where({ id: payload.userId, status: 'active' })
        .first();

      if (!user) {
        throw new AuthError('Token invalido', 'INVALID_TOKEN');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expirado', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Token invalido', 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<UserPublic> {
    const user = await db<User>('users')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new AuthError('Usuario nao encontrado', 'USER_NOT_FOUND');
    }

    return this.toPublicUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await db<User>('users')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new AuthError('Usuario nao encontrado', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthError('Senha atual incorreta', 'INVALID_PASSWORD');
    }

    this.validatePasswordStrength(newPassword);

    const newPasswordHash = await this.hashPassword(newPassword);
    await db('users')
      .where({ id: userId })
      .update({ password_hash: newPasswordHash, updated_at: new Date() });
  }

  async logout(userId: string): Promise<void> {
    await auditLogsService.create({
      user_id: userId,
      action: 'LOGOUT',
      entity: 'user',
      entity_id: userId,
      old_values: null,
      new_values: null,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await db<User>('users')
      .where({ email, status: 'active' })
      .first();

    // Sempre retorna sucesso para evitar enumeracao de emails
    if (!user) {
      return;
    }

    // Invalida tokens anteriores
    await db('password_reset_tokens')
      .where({ user_id: user.id, used: false })
      .update({ used: true });

    // Gera novo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    await db('password_reset_tokens').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      token,
      expires_at: expiresAt,
      used: false,
      created_at: new Date(),
    });

    try {
      await emailService.sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        token,
        expiresHours: this.RESET_TOKEN_EXPIRY_HOURS,
      });
    } catch (error) {
      logger.error('Failed to send password reset email', { error });
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const resetToken = await db('password_reset_tokens')
      .where({ token, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!resetToken) {
      throw new AuthError('Token invalido ou expirado', 'INVALID_RESET_TOKEN');
    }

    this.validatePasswordStrength(newPassword);

    const newPasswordHash = await this.hashPassword(newPassword);

    await db.transaction(async (trx) => {
      await trx('users')
        .where({ id: resetToken.user_id })
        .update({ password_hash: newPasswordHash, updated_at: new Date() });

      await trx('password_reset_tokens')
        .where({ id: resetToken.id })
        .update({ used: true });
    });
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expirado', 'TOKEN_EXPIRED');
      }
      throw new AuthError('Token invalido', 'INVALID_TOKEN');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): void {
    if (password.length < 6) {
      throw new AuthError('Senha deve ter no minimo 6 caracteres', 'WEAK_PASSWORD');
    }
  }

  generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refresh_token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return { access_token, refresh_token };
  }

  toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }
}

export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export const authService = new AuthService();
