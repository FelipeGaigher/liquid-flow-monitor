import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tanks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.uuid('site_id').notNullable().references('id').inTable('sites');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.decimal('capacity_l', 12, 2).notNullable();
    table.decimal('current_volume_l', 12, 2).notNullable().defaultTo(0);
    table.decimal('min_alert_l', 12, 2).notNullable().defaultTo(0);
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['site_id'], 'idx_tank_site');
    table.index(['product_id'], 'idx_tank_product');
    table.index(['status'], 'idx_tank_status');
  });

  await knex.raw('ALTER TABLE tanks ADD CONSTRAINT chk_tank_capacity CHECK (capacity_l > 0)');
  await knex.raw(
    'ALTER TABLE tanks ADD CONSTRAINT chk_tank_volume CHECK (current_volume_l >= 0 AND current_volume_l <= capacity_l)'
  );
  await knex.raw(
    'ALTER TABLE tanks ADD CONSTRAINT chk_tank_min_alert CHECK (min_alert_l >= 0 AND min_alert_l <= capacity_l)'
  );
  await knex.raw("ALTER TABLE tanks ADD CONSTRAINT chk_tank_status CHECK (status IN ('active', 'inactive'))");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tanks');
}
