-- ============================================================
-- LIQUID FLOW MONITOR - SCHEMA DO BANCO DE DADOS
-- Versao: 1.0
-- Banco: PostgreSQL 14+
-- Data: Janeiro 2026
-- ============================================================

-- Habilitar extensao UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: sites
-- Descricao: Unidades/filiais onde os tanques estao localizados
-- ============================================================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_site_status CHECK (status IN ('active', 'inactive'))
);

COMMENT ON TABLE sites IS 'Unidades/filiais onde os tanques estao localizados';
COMMENT ON COLUMN sites.name IS 'Nome da unidade';
COMMENT ON COLUMN sites.location IS 'Endereco ou localizacao fisica';

-- ============================================================
-- TABELA: products
-- Descricao: Catalogo de produtos (tipos de liquidos)
-- ============================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    unit VARCHAR(10) NOT NULL DEFAULT 'L',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_product_status CHECK (status IN ('active', 'inactive'))
);

COMMENT ON TABLE products IS 'Catalogo de produtos/tipos de liquidos';
COMMENT ON COLUMN products.unit IS 'Unidade de medida (L = litros)';

-- ============================================================
-- TABELA: users
-- Descricao: Usuarios do sistema
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'operador',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_user_role CHECK (role IN ('admin', 'operador', 'viewer')),
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'inactive'))
);

COMMENT ON TABLE users IS 'Usuarios do sistema';
COMMENT ON COLUMN users.role IS 'Perfil: admin, operador, viewer';
COMMENT ON COLUMN users.password_hash IS 'Hash da senha (bcrypt)';

-- Indice para busca por email (login)
CREATE INDEX idx_user_email_lower ON users(LOWER(email));

-- ============================================================
-- TABELA: tanks
-- Descricao: Tanques de armazenamento de liquidos
-- ============================================================
CREATE TABLE tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    site_id UUID NOT NULL,
    product VARCHAR(50) NOT NULL,
    capacity_l DECIMAL(12, 2) NOT NULL,
    current_volume_l DECIMAL(12, 2) NOT NULL DEFAULT 0,
    min_alert_l DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tank_site FOREIGN KEY (site_id) REFERENCES sites(id),
    CONSTRAINT chk_tank_capacity CHECK (capacity_l > 0),
    CONSTRAINT chk_tank_volume CHECK (current_volume_l >= 0 AND current_volume_l <= capacity_l),
    CONSTRAINT chk_tank_min_alert CHECK (min_alert_l >= 0 AND min_alert_l <= capacity_l),
    CONSTRAINT chk_tank_status CHECK (status IN ('active', 'inactive', 'maintenance')),
    CONSTRAINT chk_tank_product CHECK (product IN ('Alcool', 'Cachaca', 'Ambos'))
);

COMMENT ON TABLE tanks IS 'Tanques de armazenamento de liquidos';
COMMENT ON COLUMN tanks.capacity_l IS 'Capacidade maxima em litros';
COMMENT ON COLUMN tanks.current_volume_l IS 'Volume atual em litros';
COMMENT ON COLUMN tanks.min_alert_l IS 'Volume minimo para alerta';

-- Indices para consultas frequentes
CREATE INDEX idx_tank_site ON tanks(site_id);
CREATE INDEX idx_tank_product ON tanks(product);
CREATE INDEX idx_tank_status ON tanks(status);

-- ============================================================
-- TABELA: movements
-- Descricao: Movimentacoes de liquidos nos tanques
-- ============================================================
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tank_id UUID NOT NULL,
    operator_id UUID NOT NULL,
    product VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    volume_l DECIMAL(12, 2) NOT NULL,
    price_per_l DECIMAL(10, 4),
    cost_per_l DECIMAL(10, 4),
    total_value DECIMAL(14, 2),
    total_cost DECIMAL(14, 2),
    profit DECIMAL(14, 2),
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_movement_tank FOREIGN KEY (tank_id) REFERENCES tanks(id),
    CONSTRAINT fk_movement_operator FOREIGN KEY (operator_id) REFERENCES users(id),
    CONSTRAINT chk_movement_volume CHECK (volume_l != 0),
    CONSTRAINT chk_movement_type CHECK (type IN ('entrada', 'saida', 'ajuste')),
    CONSTRAINT chk_movement_product CHECK (product IN ('Alcool', 'Cachaca'))
);

COMMENT ON TABLE movements IS 'Registro de movimentacoes de liquidos';
COMMENT ON COLUMN movements.type IS 'Tipo: entrada, saida, ajuste';
COMMENT ON COLUMN movements.volume_l IS 'Volume em litros (negativo para ajustes de reducao)';
COMMENT ON COLUMN movements.price_per_l IS 'Preco de venda por litro (apenas saidas)';
COMMENT ON COLUMN movements.profit IS 'Lucro calculado (valor - custo)';

-- Indices para consultas e relatorios
CREATE INDEX idx_movement_tank ON movements(tank_id);
CREATE INDEX idx_movement_date ON movements(created_at DESC);
CREATE INDEX idx_movement_type ON movements(type);
CREATE INDEX idx_movement_operator ON movements(operator_id);
CREATE INDEX idx_movement_product ON movements(product);

-- Indice composto para filtros comuns
CREATE INDEX idx_movement_filter ON movements(created_at DESC, product, type);

-- ============================================================
-- TABELA: price_lists
-- Descricao: Historico de precos por produto
-- ============================================================
CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    price_per_l DECIMAL(10, 4) NOT NULL,
    valid_from DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'futuro',
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_price_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_price_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_price_positive CHECK (price_per_l > 0),
    CONSTRAINT chk_price_status CHECK (status IN ('vigente', 'futuro', 'expirado'))
);

COMMENT ON TABLE price_lists IS 'Tabela de precos com historico';
COMMENT ON COLUMN price_lists.valid_from IS 'Data de inicio da vigencia';
COMMENT ON COLUMN price_lists.status IS 'Status calculado: vigente, futuro, expirado';

-- Indices para consultas de preco
CREATE INDEX idx_price_product ON price_lists(product_id);
CREATE INDEX idx_price_valid ON price_lists(valid_from DESC);
CREATE INDEX idx_price_status ON price_lists(status);

-- ============================================================
-- TABELA: audit_logs
-- Descricao: Log de auditoria de acoes no sistema
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as acoes';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de acao: CREATE, UPDATE, DELETE, LOGIN, LOGOUT';
COMMENT ON COLUMN audit_logs.entity IS 'Nome da entidade afetada';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores anteriores (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'Novos valores (JSON)';

-- Indices para consultas de auditoria
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================
-- TABELA: settings
-- Descricao: Configuracoes do sistema
-- ============================================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID,

    CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users(id)
);

COMMENT ON TABLE settings IS 'Configuracoes globais do sistema';
COMMENT ON COLUMN settings.key IS 'Chave unica da configuracao';
COMMENT ON COLUMN settings.value IS 'Valor em formato JSON';

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_timestamp
    BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_user_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_tank_timestamp
    BEFORE UPDATE ON tanks
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_settings_timestamp
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger para atualizar volume do tanque apos movimentacao
CREATE OR REPLACE FUNCTION update_tank_volume()
RETURNS TRIGGER AS $$
DECLARE
    current_vol DECIMAL(12, 2);
    tank_cap DECIMAL(12, 2);
BEGIN
    -- Buscar volume atual e capacidade do tanque
    SELECT current_volume_l, capacity_l INTO current_vol, tank_cap
    FROM tanks WHERE id = NEW.tank_id;

    -- Calcular novo volume baseado no tipo
    IF NEW.type = 'entrada' THEN
        -- Verificar se nao excede capacidade
        IF (current_vol + NEW.volume_l) > tank_cap THEN
            RAISE EXCEPTION 'Entrada excede capacidade do tanque. Disponivel: % L', (tank_cap - current_vol);
        END IF;
        UPDATE tanks SET current_volume_l = current_volume_l + NEW.volume_l WHERE id = NEW.tank_id;

    ELSIF NEW.type = 'saida' THEN
        -- Verificar se tem saldo suficiente
        IF current_vol < NEW.volume_l THEN
            RAISE EXCEPTION 'Saldo insuficiente. Disponivel: % L', current_vol;
        END IF;
        UPDATE tanks SET current_volume_l = current_volume_l - NEW.volume_l WHERE id = NEW.tank_id;

    ELSIF NEW.type = 'ajuste' THEN
        -- Ajuste pode ser positivo ou negativo
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

CREATE TRIGGER trg_movement_update_volume
    AFTER INSERT ON movements
    FOR EACH ROW EXECUTE FUNCTION update_tank_volume();

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Resumo de tanques com status
CREATE OR REPLACE VIEW vw_tank_summary AS
SELECT
    t.id,
    t.name,
    t.product,
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
WHERE t.status = 'active';

COMMENT ON VIEW vw_tank_summary IS 'Resumo de tanques com calculo de status';

-- View: Movimentacoes com detalhes
CREATE OR REPLACE VIEW vw_movements_detail AS
SELECT
    m.id,
    m.created_at,
    m.type,
    m.product,
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
ORDER BY m.created_at DESC;

COMMENT ON VIEW vw_movements_detail IS 'Movimentacoes com detalhes de tanque e operador';

-- View: KPIs por periodo (ultimo mes)
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

COMMENT ON VIEW vw_kpis_month IS 'KPIs consolidados do mes atual';

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Inserir produtos padrao
INSERT INTO products (name, description, unit) VALUES
    ('Alcool', 'Alcool etilico 96%', 'L'),
    ('Cachaca', 'Cachaca artesanal', 'L');

-- Inserir configuracoes padrao
INSERT INTO settings (key, value, description) VALUES
    ('min_alert_percent', '{"value": 10}', 'Percentual minimo para alerta de estoque'),
    ('safety_margin', '{"value": 5}', 'Margem de seguranca (%)'),
    ('block_negative_balance', '{"value": true}', 'Bloquear operacoes com saldo negativo'),
    ('block_overcapacity', '{"value": true}', 'Bloquear entradas que excedam capacidade'),
    ('require_price_on_exit', '{"value": true}', 'Exigir preco em saidas'),
    ('date_format', '{"value": "DD/MM/YYYY"}', 'Formato de data'),
    ('currency_format', '{"value": "BRL"}', 'Formato de moeda'),
    ('timezone', '{"value": "America/Sao_Paulo"}', 'Fuso horario');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
