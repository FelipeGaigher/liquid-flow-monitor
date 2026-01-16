import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('price_lists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.decimal('price_per_l', 10, 4).notNullable();
    table.date('valid_from').notNullable();
    table.date('valid_until');
    table.string('status', 20).notNullable().defaultTo('futuro');
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['product_id'], 'idx_price_product');
    table.index(['valid_from'], 'idx_price_valid');
    table.index(['status'], 'idx_price_status');
  });

  await knex.raw('ALTER TABLE price_lists ADD CONSTRAINT chk_price_positive CHECK (price_per_l > 0)');
  await knex.raw("ALTER TABLE price_lists ADD CONSTRAINT chk_price_status CHECK (status IN ('vigente', 'futuro', 'expirado'))");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('price_lists');
}
