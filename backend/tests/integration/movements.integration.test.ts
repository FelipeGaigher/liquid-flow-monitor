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
  const userId = '11111111-1111-1111-1111-111111111111';
  const siteId = '22222222-2222-2222-2222-222222222222';
  const productId = '33333333-3333-3333-3333-333333333333';
  const tankId = '44444444-4444-4444-4444-444444444444';

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
      id: userId,
      email: 'operator@test.com',
      password_hash: 'hash',
      name: 'Operador',
      role: 'operador',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('sites').insert({
      id: siteId,
      name: 'Site Teste',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('products').insert({
      id: productId,
      name: 'Produto A',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await testDb.db('tanks').insert({
      id: tankId,
      name: 'Tanque 01',
      site_id: siteId,
      product_id: productId,
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
      tank_id: tankId,
      type: 'entrada',
      volume_l: 1000,
      cost_per_l: 2.0,
      operator_id: userId,
    });

    expect(movement.id).toBeTruthy();
    expect(movement.type).toBe('entrada');

    const updatedTank = await testDb.db('tanks').where({ id: tankId }).first();
    expect(Number(updatedTank.current_volume_l)).toBe(6000);

    const logs = await testDb.db('audit_logs').select('*');
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[0].entity).toBe('movement');
  });

  it('sends low stock alert when volume crosses min alert', async () => {
    await testDb.db('tanks')
      .where({ id: tankId })
      .update({ current_volume_l: 1500, min_alert_l: 1000 });

    await movementsService.create({
      tank_id: tankId,
      type: 'saida',
      volume_l: 600,
      price_per_l: 5.0,
      operator_id: userId,
    });

    expect(emailServiceMock.sendLowStockAlert).toHaveBeenCalledTimes(1);
    const payload = emailServiceMock.sendLowStockAlert.mock.calls[0][0];
    expect(payload.tankName).toBe('Tanque 01');
    expect(payload.currentVolume).toBe(900);
  });

  it('blocks saida without price and does not create movement', async () => {
    await expect(movementsService.create({
      tank_id: tankId,
      type: 'saida',
      volume_l: 100,
      operator_id: userId,
    })).rejects.toThrow('Preco por litro e obrigatorio para saidas');

    const movements = await testDb.db('movements').select('*');
    expect(movements).toHaveLength(0);
  });
});
