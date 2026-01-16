import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id'], 'idx_password_reset_user');
    table.index(['token'], 'idx_password_reset_token');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
