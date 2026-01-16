import { db } from '../config/database.js';
import { User, UserPublic } from '../types/index.js';
import { authService } from './auth.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';
import { Role } from '../config/permissions.js';
import { auditLogsService } from './audit-logs.service.js';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: Role;
  actor_id?: string;
}

class UsersService {
  async create(data: CreateUserDTO): Promise<UserPublic> {
    const passwordHash = await authService.hashPassword(data.password);

    const [user] = await db<User>('users')
      .insert({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (data.actor_id) {
      await auditLogsService.create({
        user_id: data.actor_id,
        action: 'CREATE',
        entity: 'user',
        entity_id: user.id,
        old_values: null,
        new_values: {
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    try {
      await emailService.sendWelcomeEmail({ name: user.name, email: user.email });
    } catch (error) {
      logger.error('Failed to send welcome email', { error });
    }

    return authService.toPublicUser(user);
  }
}

export const usersService = new UsersService();
