import { db } from '../config/database.js';
import { AuditAction, AuditLog, PaginatedResponse } from '../types/index.js';

export interface CreateAuditLogDTO {
  user_id?: string;
  action: AuditAction;
  entity: string;
  entity_id?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction;
  entity?: string;
  entity_id?: string;
  start_date?: Date;
  end_date?: Date;
}

class AuditLogsService {
  async create(payload: CreateAuditLogDTO): Promise<AuditLog> {
    const [log] = await db<AuditLog>('audit_logs')
      .insert({
        id: crypto.randomUUID(),
        user_id: payload.user_id ?? null,
        action: payload.action,
        entity: payload.entity,
        entity_id: payload.entity_id ?? null,
        old_values: payload.old_values ?? null,
        new_values: payload.new_values ?? null,
        ip_address: payload.ip_address ?? null,
        created_at: new Date(),
      })
      .returning('*');

    return log;
  }

  async findAll(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<AuditLog>> {
    let query = db<AuditLog>('audit_logs').select('*');

    if (filters.user_id) query = query.where('user_id', filters.user_id);
    if (filters.action) query = query.where('action', filters.action);
    if (filters.entity) query = query.where('entity', filters.entity);
    if (filters.entity_id) query = query.where('entity_id', filters.entity_id);
    if (filters.start_date) query = query.where('created_at', '>=', filters.start_date);
    if (filters.end_date) query = query.where('created_at', '<=', filters.end_date);

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('id as count');
    const total = Number(count);

    const offset = (page - 1) * limit;
    const data = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: data as AuditLog[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditLogsService = new AuditLogsService();
