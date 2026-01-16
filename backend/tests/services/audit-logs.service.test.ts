import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

import { createTestDb, setupSchema, truncateAll } from '../helpers/test-db.js';

const testDb = createTestDb();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  db: testDb.db,
  testConnection: async () => true,
  closeConnection: async () => testDb.db.destroy(),
}));

const { auditLogsService } = await import('../../src/services/audit-logs.service.js');

describe('AuditLogsService', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const logId1 = '33333333-3333-3333-3333-333333333333';
  const logId2 = '44444444-4444-4444-4444-444444444444';
  const logId3 = '55555555-5555-5555-5555-555555555555';

  beforeAll(async () => {
    await setupSchema(testDb.db);
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await truncateAll(testDb.db);
  });

  it('creates logs with nullable fields when omitted', async () => {
    const log = await auditLogsService.create({
      action: 'LOGIN',
      entity: 'user',
    });

    expect(log).toBeTruthy();
    expect(log.user_id).toBeNull();
    expect(log.entity_id).toBeNull();
    expect(log.old_values).toBeNull();
    expect(log.new_values).toBeNull();
    expect(log.ip_address).toBeNull();
  });

  it('lists logs without filters and paginates', async () => {
    await testDb.db('audit_logs').insert([
      {
        id: logId1,
        user_id: userId,
        action: 'CREATE',
        entity: 'tank',
        entity_id: 'tank-1',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: logId2,
        user_id: otherUserId,
        action: 'UPDATE',
        entity: 'tank',
        entity_id: 'tank-2',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-02-01T00:00:00Z'),
      },
      {
        id: logId3,
        user_id: userId,
        action: 'DELETE',
        entity: 'movement',
        entity_id: 'mov-1',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-03-01T00:00:00Z'),
      },
    ]);

    const result = await auditLogsService.findAll({}, 1, 2);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.totalPages).toBe(2);
  });

  it('filters logs by all criteria', async () => {
    await testDb.db('audit_logs').insert([
      {
        id: logId1,
        user_id: userId,
        action: 'CREATE',
        entity: 'tank',
        entity_id: 'tank-1',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-02-15T00:00:00Z'),
      },
      {
        id: logId2,
        user_id: otherUserId,
        action: 'UPDATE',
        entity: 'tank',
        entity_id: 'tank-2',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-02-20T00:00:00Z'),
      },
      {
        id: logId3,
        user_id: userId,
        action: 'CREATE',
        entity: 'movement',
        entity_id: 'mov-1',
        old_values: null,
        new_values: null,
        ip_address: null,
        created_at: new Date('2024-03-01T00:00:00Z'),
      },
    ]);

    const result = await auditLogsService.findAll(
      {
        user_id: userId,
        action: 'CREATE',
        entity: 'tank',
        entity_id: 'tank-1',
        start_date: new Date('2024-02-01T00:00:00Z'),
        end_date: new Date('2024-02-28T23:59:59Z'),
      },
      1,
      20
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(logId1);
  });
});
