# API REST: Movimentacoes

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Recurso** | Movements (Movimentacoes) |
| **Base URL** | `/api/v1/movements` |
| **Versao** | 1.0 |
| **Autenticacao** | Bearer Token (JWT) |

## 1. Visao Geral

API para registro e consulta de movimentacoes de liquidos nos tanques.

## 2. Endpoints

### 2.1 Listar Movimentacoes

Retorna historico de movimentacoes com filtros.

```http
GET /api/v1/movements
```

#### Parametros de Query

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| tank_id | UUID | Nao | Filtrar por tanque |
| product | string | Nao | Filtrar por produto |
| type | string | Nao | entrada, saida, ajuste |
| operator_id | UUID | Nao | Filtrar por operador |
| start_date | date | Nao | Data inicial (ISO) |
| end_date | date | Nao | Data final (ISO) |
| page | number | Nao | Pagina (default: 1) |
| limit | number | Nao | Itens por pagina (default: 20) |

#### Exemplo de Request

```http
GET /api/v1/movements?type=saida&start_date=2026-01-01&end_date=2026-01-14&page=1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### Exemplo de Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "tank_id": "550e8400-e29b-41d4-a716-446655440001",
      "tank_name": "TANQUE-01",
      "operator_id": "550e8400-e29b-41d4-a716-446655440050",
      "operator_name": "Joao Silva",
      "product": "Alcool",
      "type": "saida",
      "volume_l": 500.00,
      "price_per_l": 3.50,
      "cost_per_l": 2.10,
      "total_value": 1750.00,
      "total_cost": 1050.00,
      "profit": 700.00,
      "reference": "NF-123456",
      "notes": null,
      "created_at": "2026-01-14T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "summary": {
    "total_volume_l": 45230.00,
    "total_value": 125430.00,
    "total_profit": 36230.00
  }
}
```

---

### 2.2 Obter Movimentacao por ID

```http
GET /api/v1/movements/{id}
```

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "tank": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "TANQUE-01",
    "product": "Alcool"
  },
  "operator": {
    "id": "550e8400-e29b-41d4-a716-446655440050",
    "name": "Joao Silva",
    "email": "joao@empresa.com"
  },
  "product": "Alcool",
  "type": "saida",
  "volume_l": 500.00,
  "price_per_l": 3.50,
  "cost_per_l": 2.10,
  "total_value": 1750.00,
  "total_cost": 1050.00,
  "profit": 700.00,
  "margin_percent": 40.00,
  "reference": "NF-123456",
  "notes": "Venda para cliente X",
  "volume_before": 15500.00,
  "volume_after": 15000.00,
  "created_at": "2026-01-14T10:30:00Z"
}
```

---

### 2.3 Criar Movimentacao

Registra nova movimentacao. Requer perfil Admin ou Operador.

```http
POST /api/v1/movements
```

#### Request Body - Entrada

```json
{
  "tank_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "entrada",
  "volume_l": 1000.00,
  "cost_per_l": 2.00,
  "reference": "NF-789012",
  "notes": "Recebimento lote 45"
}
```

#### Request Body - Saida

```json
{
  "tank_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "saida",
  "volume_l": 500.00,
  "price_per_l": 3.50,
  "cost_per_l": 2.10,
  "reference": "NF-123456",
  "notes": "Venda para cliente X"
}
```

#### Request Body - Ajuste

```json
{
  "tank_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "ajuste",
  "volume_l": -50.00,
  "notes": "Correcao de inventario"
}
```

#### Campos do Request

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| tank_id | UUID | Sim | Deve existir e estar ativo |
| type | string | Sim | entrada, saida, ajuste |
| volume_l | number | Sim | != 0 |
| price_per_l | number | Sim (saida) | > 0 |
| cost_per_l | number | Nao | >= 0 |
| reference | string | Nao | Max 100 chars |
| notes | string | Nao | Max 500 chars |

#### Validacoes de Negocio

| Tipo | Validacao |
|------|-----------|
| entrada | volume_l <= capacidade_disponivel |
| saida | volume_l <= volume_atual |
| ajuste | resultado >= 0 e <= capacidade |
| saida | price_per_l obrigatorio |

#### Exemplo de Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440101",
  "tank_id": "550e8400-e29b-41d4-a716-446655440001",
  "product": "Alcool",
  "type": "saida",
  "volume_l": 500.00,
  "price_per_l": 3.50,
  "cost_per_l": 2.10,
  "total_value": 1750.00,
  "total_cost": 1050.00,
  "profit": 700.00,
  "reference": "NF-123456",
  "operator_id": "550e8400-e29b-41d4-a716-446655440050",
  "volume_before": 15500.00,
  "volume_after": 15000.00,
  "created_at": "2026-01-14T10:30:00Z"
}
```

#### Response (400 Bad Request) - Saldo Insuficiente

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Saldo insuficiente no tanque",
    "details": {
      "current_volume": 15000.00,
      "requested_volume": 20000.00,
      "available": 15000.00
    }
  }
}
```

#### Response (400 Bad Request) - Capacidade Excedida

```json
{
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "Entrada excede capacidade do tanque",
    "details": {
      "capacity": 20000.00,
      "current_volume": 15000.00,
      "available": 5000.00,
      "requested": 10000.00
    }
  }
}
```

---

### 2.4 Obter KPIs do Periodo

```http
GET /api/v1/movements/kpis
```

#### Parametros de Query

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| start_date | date | Nao | Data inicial |
| end_date | date | Nao | Data final |
| product | string | Nao | Filtrar por produto |

#### Exemplo de Response (200 OK)

```json
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-14"
  },
  "kpis": {
    "revenue": 125430.00,
    "volume_sold": 45230.00,
    "cogs": 89200.00,
    "profit": 36230.00,
    "margin_percent": 28.9,
    "avg_ticket": 1254.30,
    "operations_count": 100
  },
  "growth": {
    "revenue_percent": 12.5,
    "volume_percent": 8.3,
    "profit_percent": 18.2
  },
  "by_product": {
    "Alcool": {
      "revenue": 75000.00,
      "volume": 25000.00,
      "profit": 22000.00
    },
    "Cachaca": {
      "revenue": 50430.00,
      "volume": 20230.00,
      "profit": 14230.00
    }
  }
}
```

---

### 2.5 Exportar Movimentacoes

```http
GET /api/v1/movements/export
```

#### Parametros de Query

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| format | string | Sim | csv ou json |
| start_date | date | Nao | Data inicial |
| end_date | date | Nao | Data final |
| type | string | Nao | Filtrar por tipo |

#### Response (200 OK) - CSV

```
Content-Type: text/csv
Content-Disposition: attachment; filename="movimentacoes_2026-01-14.csv"

Data;Hora;Tanque;Produto;Tipo;Volume_L;Preco_L;Valor_Total;Lucro;Operador;Referencia
14/01/2026;10:30;TANQUE-01;Alcool;saida;500;3.50;1750.00;700.00;Joao Silva;NF-123456
```

## 3. Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| MOVEMENT_NOT_FOUND | Movimentacao nao encontrada |
| TANK_NOT_FOUND | Tanque nao encontrado |
| TANK_INACTIVE | Tanque inativo |
| INSUFFICIENT_BALANCE | Saldo insuficiente |
| CAPACITY_EXCEEDED | Capacidade excedida |
| PRICE_REQUIRED | Preco obrigatorio para saida |
| VALIDATION_ERROR | Erro de validacao |

---

**Documento:** movements-api.md
**Ultima Atualizacao:** Janeiro 2026
