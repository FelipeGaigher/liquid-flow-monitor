# API REST: Tanques

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Recurso** | Tanks (Tanques) |
| **Base URL** | `/api/v1/tanks` |
| **Versao** | 1.0 |
| **Autenticacao** | Bearer Token (JWT) |

## 1. Visao Geral

API para gerenciamento de tanques de armazenamento de liquidos.

## 2. Autenticacao

Todas as requisicoes devem incluir o header de autorizacao:

```http
Authorization: Bearer <jwt_token>
```

## 3. Endpoints

### 3.1 Listar Tanques

Retorna lista de tanques com opcoes de filtro.

```http
GET /api/v1/tanks
```

#### Parametros de Query

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| site_id | UUID | Nao | Filtrar por site |
| product | string | Nao | Filtrar por produto |
| status | string | Nao | Filtrar por status |
| page | number | Nao | Pagina (default: 1) |
| limit | number | Nao | Itens por pagina (default: 20) |

#### Exemplo de Request

```http
GET /api/v1/tanks?product=Alcool&status=active&page=1&limit=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### Exemplo de Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "TANQUE-01",
      "site_id": "550e8400-e29b-41d4-a716-446655440010",
      "site_name": "Sao Paulo",
      "product": "Alcool",
      "capacity_l": 20000.00,
      "current_volume_l": 15000.00,
      "min_alert_l": 2000.00,
      "status": "active",
      "fill_percentage": 75.00,
      "alert_status": "normal",
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-01-14T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 6,
    "total_pages": 1
  }
}
```

---

### 3.2 Obter Tanque por ID

Retorna detalhes de um tanque especifico.

```http
GET /api/v1/tanks/{id}
```

#### Parametros de Path

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| id | UUID | Sim | ID do tanque |

#### Exemplo de Request

```http
GET /api/v1/tanks/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "TANQUE-01",
  "site_id": "550e8400-e29b-41d4-a716-446655440010",
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Sao Paulo",
    "location": "Av. Paulista, 1000"
  },
  "product": "Alcool",
  "capacity_l": 20000.00,
  "current_volume_l": 15000.00,
  "available_capacity_l": 5000.00,
  "min_alert_l": 2000.00,
  "status": "active",
  "fill_percentage": 75.00,
  "alert_status": "normal",
  "estimated_value": 52500.00,
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-01-14T08:30:00Z"
}
```

#### Response (404 Not Found)

```json
{
  "error": {
    "code": "TANK_NOT_FOUND",
    "message": "Tanque nao encontrado"
  }
}
```

---

### 3.3 Criar Tanque

Cria um novo tanque. Requer perfil Admin.

```http
POST /api/v1/tanks
```

#### Request Body

```json
{
  "name": "TANQUE-07",
  "site_id": "550e8400-e29b-41d4-a716-446655440010",
  "product": "Cachaca",
  "capacity_l": 15000.00,
  "min_alert_l": 1500.00,
  "current_volume_l": 0.00
}
```

#### Campos do Request

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| name | string | Sim | Max 100 chars |
| site_id | UUID | Sim | Deve existir |
| product | string | Sim | Alcool, Cachaca, Ambos |
| capacity_l | number | Sim | > 0 |
| min_alert_l | number | Sim | >= 0, <= capacity_l |
| current_volume_l | number | Nao | >= 0, <= capacity_l |

#### Exemplo de Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440007",
  "name": "TANQUE-07",
  "site_id": "550e8400-e29b-41d4-a716-446655440010",
  "product": "Cachaca",
  "capacity_l": 15000.00,
  "current_volume_l": 0.00,
  "min_alert_l": 1500.00,
  "status": "active",
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

#### Response (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erro de validacao",
    "details": [
      {
        "field": "capacity_l",
        "message": "Capacidade deve ser maior que zero"
      }
    ]
  }
}
```

---

### 3.4 Atualizar Tanque

Atualiza dados de um tanque. Requer perfil Admin.

```http
PUT /api/v1/tanks/{id}
```

#### Request Body

```json
{
  "name": "TANQUE-01-A",
  "min_alert_l": 2500.00,
  "status": "maintenance"
}
```

#### Campos Atualizaveis

| Campo | Tipo | Validacao |
|-------|------|-----------|
| name | string | Max 100 chars |
| min_alert_l | number | >= 0, <= capacity_l |
| status | string | active, inactive, maintenance |

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "TANQUE-01-A",
  "min_alert_l": 2500.00,
  "status": "maintenance",
  "updated_at": "2026-01-14T11:00:00Z"
}
```

---

### 3.5 Obter Resumo dos Tanques

Retorna estatisticas consolidadas.

```http
GET /api/v1/tanks/summary
```

#### Exemplo de Response (200 OK)

```json
{
  "total_tanks": 6,
  "active_tanks": 5,
  "total_capacity_l": 120000.00,
  "total_volume_l": 75000.00,
  "total_estimated_value": 262500.00,
  "by_product": {
    "Alcool": {
      "tanks": 3,
      "volume_l": 45000.00,
      "capacity_l": 60000.00
    },
    "Cachaca": {
      "tanks": 2,
      "volume_l": 25000.00,
      "capacity_l": 40000.00
    }
  },
  "alerts": {
    "critical": 1,
    "warning": 2,
    "normal": 3
  }
}
```

## 4. Codigos de Status

| Codigo | Descricao |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Erro de validacao |
| 401 | Nao autenticado |
| 403 | Sem permissao |
| 404 | Nao encontrado |
| 500 | Erro interno |

## 5. Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| TANK_NOT_FOUND | Tanque nao encontrado |
| SITE_NOT_FOUND | Site nao encontrado |
| VALIDATION_ERROR | Erro de validacao |
| INVALID_PRODUCT | Produto invalido |
| CAPACITY_EXCEEDED | Capacidade excedida |

---

**Documento:** tanks-api.md
**Ultima Atualizacao:** Janeiro 2026
