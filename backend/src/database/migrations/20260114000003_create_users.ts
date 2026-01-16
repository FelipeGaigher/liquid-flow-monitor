import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 150).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('phone', 20);
    table.string('role', 20).notNullable().defaultTo('operador');
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('last_login');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw("ALTER TABLE users ADD CONSTRAINT chk_user_role CHECK (role IN ('admin', 'operador', 'viewer'))");
  await knex.raw("ALTER TABLE users ADD CONSTRAINT chk_user_status CHECK (status IN ('active', 'inactive'))");
  await knex.raw('CREATE INDEX idx_user_email_lower ON users(LOWER(email))');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_user_email_lower');
  await knex.schema.dropTableIfExists('users');
}
