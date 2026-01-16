import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tank_id').notNullable().references('id').inTable('tanks');
    table.uuid('operator_id').notNullable().references('id').inTable('users');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.string('type', 20).notNullable();
    table.decimal('volume_l', 12, 2).notNullable();
    table.decimal('price_per_l', 10, 4);
    table.decimal('cost_per_l', 10, 4);
    table.decimal('total_value', 14, 2);
    table.decimal('total_cost', 14, 2);
    table.decimal('profit', 14, 2);
    table.string('reference', 100);
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['tank_id'], 'idx_movement_tank');
    table.index(['operator_id'], 'idx_movement_operator');
    table.index(['product_id'], 'idx_movement_product');
    table.index(['type'], 'idx_movement_type');
    table.index(['created_at'], 'idx_movement_date');
    table.index(['created_at', 'product_id', 'type'], 'idx_movement_filter');
  });

  await knex.raw("ALTER TABLE movements ADD CONSTRAINT chk_movement_volume CHECK (volume_l <> 0)");
  await knex.raw("ALTER TABLE movements ADD CONSTRAINT chk_movement_type CHECK (type IN ('entrada', 'saida', 'ajuste'))");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('movements');
}
