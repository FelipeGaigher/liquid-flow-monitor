# Dicionario de Dados

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Projeto** | Liquid Flow Monitor (TankControl) |
| **Documento** | Dicionario de Dados |
| **Versao** | 1.0 |
| **Data** | Janeiro 2026 |

## 1. Introducao

Este documento descreve detalhadamente todos os elementos de dados utilizados no sistema Liquid Flow Monitor, incluindo tabelas, campos, tipos, restricoes e regras de validacao.

## 2. Convencoes de Nomenclatura

### 2.1 Tabelas

| Convencao | Exemplo |
|-----------|---------|
| Nome em ingles | `users`, `tanks`, `movements` |
| Plural | `users` (nao `user`) |
| Snake_case | `price_lists` (nao `priceLists`) |
| Lowercase | `audit_logs` (nao `Audit_Logs`) |

### 2.2 Colunas

| Convencao | Exemplo |
|-----------|---------|
| Snake_case | `created_at`, `tank_id` |
| Sufixo `_id` para FKs | `site_id`, `operator_id` |
| Sufixo `_at` para timestamps | `created_at`, `updated_at` |
| Sufixo `_l` para litros | `volume_l`, `capacity_l` |
| Prefixo `is_` para booleanos | `is_active` (quando aplicavel) |

### 2.3 Indices

| Convencao | Exemplo |
|-----------|---------|
| Prefixo `idx_` | `idx_movement_tank` |
| Prefixo `pk_` para PKs | `pk_tanks` |
| Prefixo `uk_` para unicos | `uk_user_email` |
| Prefixo `fk_` para FKs | `fk_tank_site` |

## 3. Tipos de Dados

### 3.1 Tipos Utilizados

| Tipo | Uso | Exemplo |
|------|-----|---------|
| UUID | Identificadores unicos | `id` de todas as tabelas |
| VARCHAR(n) | Textos com limite | `name VARCHAR(100)` |
| TEXT | Textos longos | `notes TEXT` |
| DECIMAL(p,s) | Valores numericos precisos | `volume_l DECIMAL(12,2)` |
| TIMESTAMP | Data e hora | `created_at TIMESTAMP` |
| DATE | Apenas data | `valid_from DATE` |
| JSONB | Dados estruturados | `settings.value JSONB` |

### 3.2 Precisao de Decimais

| Campo | Precisao | Justificativa |
|-------|----------|---------------|
| Volume (L) | DECIMAL(12,2) | Ate 9.999.999.999,99 litros |
| Preco (R$/L) | DECIMAL(10,4) | Ate 999.999,9999 por litro |
| Valor Total | DECIMAL(14,2) | Ate 999.999.999.999,99 reais |

## 4. Entidades Detalhadas

### 4.1 sites (Unidades)

**Descricao:** Unidades/filiais onde os tanques estao localizados.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| name | VARCHAR(100) | N | - | Nome da unidade |
| location | VARCHAR(255) | S | - | Endereco completo |
| status | VARCHAR(20) | N | 'active' | Status: active, inactive |
| created_at | TIMESTAMP | N | NOW() | Data de criacao |
| updated_at | TIMESTAMP | N | NOW() | Ultima atualizacao |

**Restricoes:**
- PK: `id`
- CHECK: `status IN ('active', 'inactive')`

---

### 4.2 products (Produtos)

**Descricao:** Catalogo de tipos de liquidos armazenados.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| name | VARCHAR(100) | N | - | Nome do produto |
| description | VARCHAR(255) | S | - | Descricao detalhada |
| unit | VARCHAR(10) | N | 'L' | Unidade de medida |
| status | VARCHAR(20) | N | 'active' | Status do produto |
| created_at | TIMESTAMP | N | NOW() | Data de criacao |

**Restricoes:**
- PK: `id`
- UNIQUE: `name`
- CHECK: `status IN ('active', 'inactive')`

**Valores Padrao:**
- Alcool
- Cachaca

---

### 4.3 users (Usuarios)

**Descricao:** Usuarios do sistema com credenciais e permissoes.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| name | VARCHAR(150) | N | - | Nome completo |
| email | VARCHAR(255) | N | - | Email (login) |
| password_hash | VARCHAR(255) | N | - | Hash bcrypt da senha |
| phone | VARCHAR(20) | S | - | Telefone de contato |
| role | VARCHAR(20) | N | 'operador' | Perfil de acesso |
| status | VARCHAR(20) | N | 'active' | Status da conta |
| last_login | TIMESTAMP | S | - | Data do ultimo acesso |
| created_at | TIMESTAMP | N | NOW() | Data de criacao |
| updated_at | TIMESTAMP | N | NOW() | Ultima atualizacao |

**Restricoes:**
- PK: `id`
- UNIQUE: `email`
- CHECK: `role IN ('admin', 'operador', 'viewer')`
- CHECK: `status IN ('active', 'inactive')`

**Valores de Role:**

| Role | Descricao | Permissoes |
|------|-----------|------------|
| admin | Administrador | Acesso total |
| operador | Operador | Registrar movimentacoes |
| viewer | Visualizador | Somente leitura |

---

### 4.4 tanks (Tanques)

**Descricao:** Tanques de armazenamento de liquidos.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| name | VARCHAR(100) | N | - | Nome/codigo do tanque |
| site_id | UUID | N | - | FK para sites |
| product | VARCHAR(50) | N | - | Tipo de produto |
| capacity_l | DECIMAL(12,2) | N | - | Capacidade em litros |
| current_volume_l | DECIMAL(12,2) | N | 0 | Volume atual |
| min_alert_l | DECIMAL(12,2) | N | 0 | Volume minimo alerta |
| status | VARCHAR(20) | N | 'active' | Status do tanque |
| created_at | TIMESTAMP | N | NOW() | Data de criacao |
| updated_at | TIMESTAMP | N | NOW() | Ultima atualizacao |

**Restricoes:**
- PK: `id`
- FK: `site_id` -> `sites(id)`
- CHECK: `capacity_l > 0`
- CHECK: `current_volume_l >= 0 AND current_volume_l <= capacity_l`
- CHECK: `min_alert_l >= 0 AND min_alert_l <= capacity_l`
- CHECK: `status IN ('active', 'inactive', 'maintenance')`
- CHECK: `product IN ('Alcool', 'Cachaca', 'Ambos')`

**Valores de Status:**

| Status | Descricao | Permite Operacoes |
|--------|-----------|-------------------|
| active | Operacional | Sim |
| inactive | Desativado | Nao |
| maintenance | Em manutencao | Nao |

---

### 4.5 movements (Movimentacoes)

**Descricao:** Registro de todas as movimentacoes de liquidos.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| tank_id | UUID | N | - | FK para tanks |
| operator_id | UUID | N | - | FK para users |
| product | VARCHAR(50) | N | - | Produto movimentado |
| type | VARCHAR(20) | N | - | Tipo de movimentacao |
| volume_l | DECIMAL(12,2) | N | - | Volume em litros |
| price_per_l | DECIMAL(10,4) | S | - | Preco por litro |
| cost_per_l | DECIMAL(10,4) | S | - | Custo por litro |
| total_value | DECIMAL(14,2) | S | - | Valor total |
| total_cost | DECIMAL(14,2) | S | - | Custo total |
| profit | DECIMAL(14,2) | S | - | Lucro |
| reference | VARCHAR(100) | S | - | Referencia (NF) |
| notes | TEXT | S | - | Observacoes |
| created_at | TIMESTAMP | N | NOW() | Data/hora da operacao |

**Restricoes:**
- PK: `id`
- FK: `tank_id` -> `tanks(id)`
- FK: `operator_id` -> `users(id)`
- CHECK: `volume_l != 0`
- CHECK: `type IN ('entrada', 'saida', 'ajuste')`
- CHECK: `product IN ('Alcool', 'Cachaca')`

**Tipos de Movimentacao:**

| Tipo | Descricao | Afeta Volume | Campos Obrigatorios |
|------|-----------|--------------|---------------------|
| entrada | Recebimento | + | volume_l |
| saida | Venda | - | volume_l, price_per_l |
| ajuste | Correcao | +/- | volume_l |

---

### 4.6 price_lists (Tabela de Precos)

**Descricao:** Historico de precos por produto.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| product_id | UUID | N | - | FK para products |
| price_per_l | DECIMAL(10,4) | N | - | Preco por litro |
| valid_from | DATE | N | - | Inicio da vigencia |
| status | VARCHAR(20) | N | 'futuro' | Status do preco |
| created_by | UUID | N | - | FK para users |
| created_at | TIMESTAMP | N | NOW() | Data de criacao |

**Restricoes:**
- PK: `id`
- FK: `product_id` -> `products(id)`
- FK: `created_by` -> `users(id)`
- CHECK: `price_per_l > 0`
- CHECK: `status IN ('vigente', 'futuro', 'expirado')`

**Logica de Status:**

```
SE valid_from > HOJE ENTAO status = 'futuro'
SE valid_from <= HOJE E eh_mais_recente ENTAO status = 'vigente'
SE valid_from <= HOJE E NOT eh_mais_recente ENTAO status = 'expirado'
```

---

### 4.7 audit_logs (Logs de Auditoria)

**Descricao:** Registro de todas as acoes no sistema.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| user_id | UUID | S | - | FK para users |
| action | VARCHAR(50) | N | - | Tipo de acao |
| entity | VARCHAR(50) | N | - | Entidade afetada |
| entity_id | UUID | S | - | ID da entidade |
| old_values | JSONB | S | - | Valores anteriores |
| new_values | JSONB | S | - | Novos valores |
| ip_address | VARCHAR(45) | S | - | IP do usuario |
| created_at | TIMESTAMP | N | NOW() | Data/hora da acao |

**Valores de Action:**

| Action | Descricao |
|--------|-----------|
| CREATE | Criacao de registro |
| UPDATE | Atualizacao |
| DELETE | Exclusao |
| LOGIN | Acesso ao sistema |
| LOGOUT | Saida do sistema |
| EXPORT | Exportacao de dados |

---

### 4.8 settings (Configuracoes)

**Descricao:** Parametros de configuracao do sistema.

| Coluna | Tipo | Nulo | Default | Descricao |
|--------|------|------|---------|-----------|
| id | UUID | N | uuid_generate_v4() | Identificador unico |
| key | VARCHAR(100) | N | - | Chave da configuracao |
| value | JSONB | N | - | Valor (JSON) |
| description | VARCHAR(255) | S | - | Descricao |
| updated_at | TIMESTAMP | N | NOW() | Ultima atualizacao |
| updated_by | UUID | S | - | FK para users |

**Configuracoes Padrao:**

| Key | Valor Default | Descricao |
|-----|---------------|-----------|
| min_alert_percent | {"value": 10} | % minimo para alerta |
| safety_margin | {"value": 5} | Margem de seguranca % |
| block_negative_balance | {"value": true} | Bloquear saldo negativo |
| block_overcapacity | {"value": true} | Bloquear sobrecapacidade |
| require_price_on_exit | {"value": true} | Exigir preco em saida |
| date_format | {"value": "DD/MM/YYYY"} | Formato de data |
| currency_format | {"value": "BRL"} | Formato de moeda |
| timezone | {"value": "America/Sao_Paulo"} | Fuso horario |

## 5. Regras de Validacao

### 5.1 Validacoes de Campo

| Entidade | Campo | Validacao |
|----------|-------|-----------|
| users | email | Formato email valido |
| users | password | Minimo 8 caracteres |
| tanks | capacity_l | Maior que 0 |
| tanks | current_volume_l | Entre 0 e capacity_l |
| movements | volume_l | Diferente de 0 |
| movements | price_per_l | Maior que 0 (se saida) |
| price_lists | price_per_l | Maior que 0 |
| price_lists | valid_from | Data valida |

### 5.2 Validacoes de Negocio

| Regra | Descricao |
|-------|-----------|
| RV-01 | Saida nao pode exceder volume atual |
| RV-02 | Entrada nao pode exceder capacidade |
| RV-03 | Usuario nao pode desativar a si mesmo |
| RV-04 | Deve existir ao menos 1 admin |
| RV-05 | Tanque inativo nao recebe movimentacoes |
| RV-06 | Preco duplicado na mesma data nao permitido |

## 6. Formatos de Dados

### 6.1 Datas e Horas

| Formato | Exemplo | Uso |
|---------|---------|-----|
| ISO 8601 | 2026-01-14T10:30:00Z | API e banco |
| DD/MM/YYYY | 14/01/2026 | Interface usuario |
| DD/MM/YYYY HH:mm | 14/01/2026 10:30 | Interface com hora |

### 6.2 Valores Monetarios

| Formato | Exemplo | Uso |
|---------|---------|-----|
| Decimal | 1234.56 | API e banco |
| BRL | R$ 1.234,56 | Interface usuario |

### 6.3 Volumes

| Formato | Exemplo | Uso |
|---------|---------|-----|
| Decimal | 1000.00 | API e banco |
| Formatado | 1.000,00 L | Interface usuario |

## 7. Historico de Alteracoes

| Versao | Data | Autor | Alteracao |
|--------|------|-------|-----------|
| 1.0 | Janeiro 2026 | Equipe | Criacao inicial |

---

**Documento:** DICIONARIO-DADOS.md
**Ultima Atualizacao:** Janeiro 2026
