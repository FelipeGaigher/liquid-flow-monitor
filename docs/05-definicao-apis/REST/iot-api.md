# API REST: Sensores IoT

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Recurso** | IoT Devices & Measurements |
| **Base URL** | `/api/iot` |
| **Versao** | 1.0 |
| **Autenticacao** | API Key (sensores) + Bearer Token (admin) |

## 1. Visao Geral

API para integracao com sensores IoT de nivel, permitindo envio de medicoes e gestao basica de dispositivos.

## 2. Autenticacao

### 2.1 Sensores (API Key)

O envio de medicoes exige o header:

```http
X-API-Key: <device_api_key>
```

### 2.2 Administrador (JWT)

Endpoints de gestao de dispositivos exigem:

```http
Authorization: Bearer <jwt_token>
```

## 3. Endpoints

### 3.1 Registrar Medicao

```http
POST /api/iot/measurements
```

#### Body (JSON)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| device_id | UUID | Sim | ID do dispositivo |
| volume_l | number | Sim | Volume medido (litros) |
| measured_at | string | Nao | Data/hora ISO da medicao |
| raw_payload | object | Nao | Payload bruto do sensor |

#### Exemplo de Request

```http
POST /api/iot/measurements
X-API-Key: 9f7c...c2
Content-Type: application/json

{
  "device_id": "550e8400-e29b-41d4-a716-446655440200",
  "volume_l": 1250.5,
  "measured_at": "2026-01-14T12:30:00Z",
  "raw_payload": {
    "battery": 92,
    "signal": -71
  }
}
```

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440201",
  "device_id": "550e8400-e29b-41d4-a716-446655440200",
  "tank_id": "550e8400-e29b-41d4-a716-446655440010",
  "volume_l": 1250.5,
  "measured_at": "2026-01-14T12:30:00.000Z",
  "received_at": "2026-01-14T12:30:02.000Z",
  "raw_payload": {
    "battery": 92,
    "signal": -71
  }
}
```

#### Erros Comuns

| Codigo | Motivo |
|--------|--------|
| 400 | Dados invalidos (volume_l, device_id) |
| 401 | API key ausente/invalida |
| 403 | Dispositivo inativo |
| 404 | Dispositivo ou tanque nao encontrado |
| 422 | Dispositivo sem tanque associado |

### 3.2 Criar Dispositivo (Admin)

```http
POST /api/iot/devices
```

#### Body (JSON)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| name | string | Sim | Nome do dispositivo |
| tank_id | UUID | Nao | Tanque associado |

#### Response (201 Created)

```json
{
  "device": {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "name": "Sensor Tanque 01",
    "tank_id": "550e8400-e29b-41d4-a716-446655440010",
    "status": "active",
    "api_key_hash": "c6f5...",
    "created_at": "2026-01-14T12:00:00.000Z",
    "updated_at": "2026-01-14T12:00:00.000Z"
  },
  "apiKey": "9f7c...c2"
}
```

### 3.3 Listar Dispositivos (Admin)

```http
GET /api/iot/devices
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440200",
      "name": "Sensor Tanque 01",
      "tank_id": "550e8400-e29b-41d4-a716-446655440010",
      "tank_name": "TANQUE-01",
      "status": "active",
      "last_seen_at": "2026-01-14T12:30:02.000Z",
      "last_volume_l": 1250.5
    }
  ]
}
```

### 3.4 Dashboard de Dispositivos (Admin)

```http
GET /api/iot/devices/summary
```

#### Response (200 OK)

```json
{
  "total": 3,
  "online": 2,
  "offline": 1,
  "latestMeasurements": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440201",
      "device_id": "550e8400-e29b-41d4-a716-446655440200",
      "tank_id": "550e8400-e29b-41d4-a716-446655440010",
      "volume_l": 1250.5,
      "measured_at": "2026-01-14T12:30:00.000Z",
      "received_at": "2026-01-14T12:30:02.000Z"
    }
  ]
}
```

## 4. Observacoes

- O dispositivo e considerado online quando a ultima medicao ocorreu nos ultimos 10 minutos.
- O volume recebido atualiza diretamente o volume atual do tanque associado.
