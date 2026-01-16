import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.string('description', 255);
    table.string('unit', 10).notNullable().defaultTo('L');
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw("ALTER TABLE products ADD CONSTRAINT chk_product_status CHECK (status IN ('active', 'inactive'))");

  await knex('products').insert([
    { name: 'Alcool', description: 'Alcool etilico 96%', unit: 'L' },
    { name: 'Cachaca', description: 'Cachaca artesanal', unit: 'L' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
}
