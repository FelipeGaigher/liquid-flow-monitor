import { newDb } from 'pg-mem';
import type { Knex } from 'knex';

export interface TestDb {
  db: Knex;
  teardown: () => Promise<void>;
}

export function createTestDb(): TestDb {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  mem.public.registerFunction({
    name: 'now',
    returns: 'timestamp',
    implementation: () => new Date(),
  });

  const db = mem.adapters.createKnex();

  return {
    db,
    teardown: async () => {
      await db.destroy();
    },
  };
}

export async function setupSchema(db: Knex): Promise<void> {
  await db.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('role').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
  });

  await db.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('users.id');
    table.string('token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').notNullable();
    table.timestamp('created_at').notNullable();
  });

  await db.schema.createTable('sites', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
  });

  await db.schema.createTable('products', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
  });

  await db.schema.createTable('tanks', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.uuid('site_id').notNullable().references('sites.id');
    table.uuid('product_id').notNullable().references('products.id');
    table.float('capacity_l').notNullable();
    table.float('current_volume_l').notNullable();
    table.float('min_alert_l').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
  });

  await db.schema.createTable('movements', (table) => {
    table.uuid('id').primary();
    table.uuid('tank_id').notNullable().references('tanks.id');
    table.uuid('product_id').notNullable().references('products.id');
    table.string('type').notNullable();
    table.float('volume_l').notNullable();
    table.float('price_per_l');
    table.float('cost_per_l');
    table.float('total_value');
    table.float('total_cost');
    table.float('profit');
    table.string('reference');
    table.text('notes');
    table.uuid('operator_id').notNullable().references('users.id');
    table.timestamp('created_at').notNullable();
  });

  await db.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').nullable();
    table.string('action').notNullable();
    table.string('entity').notNullable();
    table.string('entity_id').nullable();
    table.jsonb('old_values').nullable();
    table.jsonb('new_values').nullable();
    table.string('ip_address').nullable();
    table.timestamp('created_at').notNullable();
  });
}

export async function truncateAll(db: Knex): Promise<void> {
  await db('audit_logs').del();
  await db('movements').del();
  await db('tanks').del();
  await db('products').del();
  await db('sites').del();
  await db('password_reset_tokens').del();
  await db('users').del();
}
