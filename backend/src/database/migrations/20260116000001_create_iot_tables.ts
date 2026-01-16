import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('iot_devices', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.uuid('tank_id').references('id').inTable('tanks').onDelete('SET NULL');
    table.string('api_key_hash').notNullable().unique();
    table.string('status').notNullable().defaultTo('active');
    table.timestamp('last_seen_at');
    table.decimal('last_volume_l', 12, 3);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['tank_id'], 'iot_devices_tank_id_idx');
    table.index(['status'], 'iot_devices_status_idx');
  });

  await knex.schema.createTable('iot_measurements', (table) => {
    table.uuid('id').primary();
    table.uuid('device_id').notNullable().references('id').inTable('iot_devices').onDelete('CASCADE');
    table.uuid('tank_id').notNullable().references('id').inTable('tanks').onDelete('CASCADE');
    table.decimal('volume_l', 12, 3).notNullable();
    table.timestamp('measured_at').notNullable();
    table.timestamp('received_at').notNullable().defaultTo(knex.fn.now());
    table.jsonb('raw_payload');

    table.index(['device_id'], 'iot_measurements_device_idx');
    table.index(['tank_id'], 'iot_measurements_tank_idx');
    table.index(['measured_at'], 'iot_measurements_measured_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('iot_measurements');
  await knex.schema.dropTableIfExists('iot_devices');
}
