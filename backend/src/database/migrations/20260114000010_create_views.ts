import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE VIEW vw_tank_summary AS
    SELECT
        t.id,
        t.name,
        p.name AS product_name,
        t.capacity_l,
        t.current_volume_l,
        t.min_alert_l,
        t.status,
        s.name AS site_name,
        ROUND((t.current_volume_l / t.capacity_l) * 100, 2) AS fill_percentage,
        CASE
            WHEN t.current_volume_l < t.min_alert_l THEN 'critical'
            WHEN t.current_volume_l < (t.min_alert_l * 1.5) THEN 'warning'
            ELSE 'normal'
        END AS alert_status
    FROM tanks t
    JOIN sites s ON t.site_id = s.id
    JOIN products p ON t.product_id = p.id
    WHERE t.status = 'active';
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW vw_movements_detail AS
    SELECT
        m.id,
        m.created_at,
        m.type,
        p.name AS product_name,
        m.volume_l,
        m.price_per_l,
        m.total_value,
        m.total_cost,
        m.profit,
        m.reference,
        m.notes,
        t.name AS tank_name,
        s.name AS site_name,
        u.name AS operator_name
    FROM movements m
    JOIN tanks t ON m.tank_id = t.id
    JOIN sites s ON t.site_id = s.id
    JOIN users u ON m.operator_id = u.id
    JOIN products p ON m.product_id = p.id
    ORDER BY m.created_at DESC;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW vw_kpis_month AS
    SELECT
        COALESCE(SUM(CASE WHEN type = 'saida' THEN total_value ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN type = 'saida' THEN volume_l ELSE 0 END), 0) AS volume_sold,
        COALESCE(SUM(CASE WHEN type = 'saida' THEN total_cost ELSE 0 END), 0) AS cogs,
        COALESCE(SUM(CASE WHEN type = 'saida' THEN profit ELSE 0 END), 0) AS gross_profit,
        CASE
            WHEN SUM(CASE WHEN type = 'saida' THEN total_value ELSE 0 END) > 0
            THEN ROUND(
                (SUM(CASE WHEN type = 'saida' THEN profit ELSE 0 END) /
                 SUM(CASE WHEN type = 'saida' THEN total_value ELSE 0 END)) * 100, 2
            )
            ELSE 0
        END AS margin_percent,
        COUNT(CASE WHEN type = 'saida' THEN 1 END) AS sales_count
    FROM movements
    WHERE type = 'saida'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS vw_kpis_month');
  await knex.raw('DROP VIEW IF EXISTS vw_movements_detail');
  await knex.raw('DROP VIEW IF EXISTS vw_tank_summary');
}
