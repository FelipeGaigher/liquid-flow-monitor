import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('action', 50).notNullable();
    table.string('entity', 50).notNullable();
    table.uuid('entity_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id'], 'idx_audit_user');
    table.index(['entity', 'entity_id'], 'idx_audit_entity');
    table.index(['created_at'], 'idx_audit_date');
    table.index(['action'], 'idx_audit_action');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}
