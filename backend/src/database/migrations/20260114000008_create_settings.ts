import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('key', 100).notNullable().unique();
    table.jsonb('value').notNullable();
    table.string('description', 255);
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');
  });

  await knex('settings').insert([
    { key: 'min_alert_percent', value: { value: 10 }, description: 'Percentual minimo para alerta de estoque' },
    { key: 'safety_margin', value: { value: 5 }, description: 'Margem de seguranca (%)' },
    { key: 'block_negative_balance', value: { value: true }, description: 'Bloquear operacoes com saldo negativo' },
    { key: 'block_overcapacity', value: { value: true }, description: 'Bloquear entradas que excedam capacidade' },
    { key: 'require_price_on_exit', value: { value: true }, description: 'Exigir preco em saidas' },
    { key: 'date_format', value: { value: 'DD/MM/YYYY' }, description: 'Formato de data' },
    { key: 'currency_format', value: { value: 'BRL' }, description: 'Formato de moeda' },
    { key: 'timezone', value: { value: 'America/Sao_Paulo' }, description: 'Fuso horario' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('settings');
}
