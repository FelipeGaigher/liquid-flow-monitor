import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

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

const { MovementsService } = await import('../../src/services/movements.service.js');

describe('MovementsService integration', () => {
  let movementsService: InstanceType<typeof MovementsService>;

  beforeAll(async () => {
    await setupSchema(testDb.db);
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await truncateAll(testDb.db);
    emailServiceMock.sendLowStockAlert.mockReset();

    await testDb.db('users').insert({
      id: 'user-1',
      email: 'operator@test.com',
      password_hash: 'hash',
      name: 'Operador',
      role: 'operador',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('sites').insert({
      id: 'site-1',
      name: 'Site Teste',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('products').insert({
      id: 'prod-1',
      name: 'Produto A',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('tanks').insert({
      id: 'tank-1',
      name: 'Tanque 01',
      site_id: 'site-1',
      product_id: 'prod-1',
      capacity_l: 10000,
      current_volume_l: 5000,
      min_alert_l: 1000,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    movementsService = new MovementsService();
  });

  it('creates entrada movement and updates tank volume', async () => {
    const movement = await movementsService.create({
      tank_id: 'tank-1',
      type: 'entrada',
      volume_l: 1000,
      cost_per_l: 2.0,
      operator_id: 'user-1',
    });

    expect(movement.id).toBeTruthy();
    expect(movement.type).toBe('entrada');

    const updatedTank = await testDb.db('tanks').where({ id: 'tank-1' }).first();
    expect(Number(updatedTank.current_volume_l)).toBe(6000);

    const logs = await testDb.db('audit_logs').select('*');
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[0].entity).toBe('movement');
  });

  it('sends low stock alert when volume crosses min alert', async () => {
    await testDb.db('tanks')
      .where({ id: 'tank-1' })
      .update({ current_volume_l: 1500, min_alert_l: 1000 });

    await movementsService.create({
      tank_id: 'tank-1',
      type: 'saida',
      volume_l: 600,
      price_per_l: 5.0,
      operator_id: 'user-1',
    });

    expect(emailServiceMock.sendLowStockAlert).toHaveBeenCalledTimes(1);
    const payload = emailServiceMock.sendLowStockAlert.mock.calls[0][0];
    expect(payload.tankName).toBe('Tanque 01');
    expect(payload.currentVolume).toBe(900);
  });

  it('blocks saida without price and does not create movement', async () => {
    await expect(movementsService.create({
      tank_id: 'tank-1',
      type: 'saida',
      volume_l: 100,
      operator_id: 'user-1',
    })).rejects.toThrow('Preco por litro e obrigatorio para saidas');

    const movements = await testDb.db('movements').select('*');
    expect(movements).toHaveLength(0);
  });
});
