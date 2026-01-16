import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_site_timestamp
        BEFORE UPDATE ON sites
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_user_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_product_timestamp
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_tank_timestamp
        BEFORE UPDATE ON tanks
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_price_list_timestamp
        BEFORE UPDATE ON price_lists
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_settings_timestamp
        BEFORE UPDATE ON settings
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_tank_volume()
    RETURNS TRIGGER AS $$
    DECLARE
        current_vol DECIMAL(12, 2);
        tank_cap DECIMAL(12, 2);
    BEGIN
        SELECT current_volume_l, capacity_l INTO current_vol, tank_cap
        FROM tanks WHERE id = NEW.tank_id;

        IF NEW.type = 'entrada' THEN
            IF (current_vol + NEW.volume_l) > tank_cap THEN
                RAISE EXCEPTION 'Entrada excede capacidade do tanque. Disponivel: % L', (tank_cap - current_vol);
            END IF;
            UPDATE tanks SET current_volume_l = current_volume_l + NEW.volume_l WHERE id = NEW.tank_id;

        ELSIF NEW.type = 'saida' THEN
            IF current_vol < NEW.volume_l THEN
                RAISE EXCEPTION 'Saldo insuficiente. Disponivel: % L', current_vol;
            END IF;
            UPDATE tanks SET current_volume_l = current_volume_l - NEW.volume_l WHERE id = NEW.tank_id;

        ELSIF NEW.type = 'ajuste' THEN
            IF (current_vol + NEW.volume_l) < 0 THEN
                RAISE EXCEPTION 'Ajuste resultaria em volume negativo';
            END IF;
            IF (current_vol + NEW.volume_l) > tank_cap THEN
                RAISE EXCEPTION 'Ajuste excede capacidade do tanque';
            END IF;
            UPDATE tanks SET current_volume_l = current_volume_l + NEW.volume_l WHERE id = NEW.tank_id;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_movement_update_volume
        AFTER INSERT ON movements
        FOR EACH ROW EXECUTE FUNCTION update_tank_volume();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS trg_movement_update_volume ON movements');
  await knex.raw('DROP FUNCTION IF EXISTS update_tank_volume');
  await knex.raw('DROP TRIGGER IF EXISTS trg_settings_timestamp ON settings');
  await knex.raw('DROP TRIGGER IF EXISTS trg_price_list_timestamp ON price_lists');
  await knex.raw('DROP TRIGGER IF EXISTS trg_tank_timestamp ON tanks');
  await knex.raw('DROP TRIGGER IF EXISTS trg_product_timestamp ON products');
  await knex.raw('DROP TRIGGER IF EXISTS trg_user_timestamp ON users');
  await knex.raw('DROP TRIGGER IF EXISTS trg_site_timestamp ON sites');
  await knex.raw('DROP FUNCTION IF EXISTS update_timestamp');
}
