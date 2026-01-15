# API REST: Usuarios

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Recurso** | Users (Usuarios) |
| **Base URL** | `/api/v1/users` |
| **Versao** | 1.0 |
| **Autenticacao** | Bearer Token (JWT) |
| **Permissao** | Admin (escrita), Todos (leitura proprio) |

## 1. Visao Geral

API para gerenciamento de usuarios do sistema.

## 2. Endpoints

### 2.1 Listar Usuarios

Retorna lista de usuarios. Requer perfil Admin.

```http
GET /api/v1/users
```

#### Parametros de Query

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| role | string | Nao | admin, operador, viewer |
| status | string | Nao | active, inactive |
| search | string | Nao | Busca por nome ou email |
| page | number | Nao | Pagina (default: 1) |
| limit | number | Nao | Itens por pagina (default: 20) |

#### Exemplo de Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440050",
      "name": "Joao Silva",
      "email": "joao@empresa.com",
      "phone": "(11) 99999-9999",
      "role": "admin",
      "status": "active",
      "last_login": "2026-01-14T10:30:00Z",
      "created_at": "2026-01-01T08:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440051",
      "name": "Maria Santos",
      "email": "maria@empresa.com",
      "phone": "(11) 98888-8888",
      "role": "operador",
      "status": "active",
      "last_login": "2026-01-14T09:00:00Z",
      "created_at": "2026-01-02T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "total_pages": 1
  }
}
```

---

### 2.2 Obter Usuario por ID

```http
GET /api/v1/users/{id}
```

#### Permissoes

- **Admin**: pode ver qualquer usuario
- **Operador/Viewer**: apenas proprio usuario

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440050",
  "name": "Joao Silva",
  "email": "joao@empresa.com",
  "phone": "(11) 99999-9999",
  "role": "admin",
  "status": "active",
  "last_login": "2026-01-14T10:30:00Z",
  "created_at": "2026-01-01T08:00:00Z",
  "updated_at": "2026-01-10T15:00:00Z",
  "stats": {
    "total_movements": 150,
    "last_movement": "2026-01-14T09:30:00Z"
  }
}
```

---

### 2.3 Criar Usuario

Cria novo usuario. Requer perfil Admin.

```http
POST /api/v1/users
```

#### Request Body

```json
{
  "name": "Pedro Lima",
  "email": "pedro@empresa.com",
  "phone": "(11) 97777-7777",
  "role": "operador"
}
```

#### Campos do Request

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| name | string | Sim | 3-150 caracteres |
| email | string | Sim | Formato email, unico |
| phone | string | Nao | Formato telefone |
| role | string | Sim | admin, operador, viewer |

#### Exemplo de Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440055",
  "name": "Pedro Lima",
  "email": "pedro@empresa.com",
  "phone": "(11) 97777-7777",
  "role": "operador",
  "status": "active",
  "created_at": "2026-01-14T11:00:00Z",
  "temporary_password": "Temp@123456"
}
```

> **Nota**: Senha temporaria gerada automaticamente. Usuario deve alterar no primeiro login.

#### Response (400 Bad Request) - Email Duplicado

```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email ja cadastrado no sistema"
  }
}
```

---

### 2.4 Atualizar Usuario

Atualiza dados de usuario. Admin pode editar qualquer usuario.

```http
PUT /api/v1/users/{id}
```

#### Request Body

```json
{
  "name": "Pedro Lima Junior",
  "phone": "(11) 96666-6666",
  "role": "admin"
}
```

#### Campos Atualizaveis

| Campo | Admin | Proprio Usuario |
|-------|-------|-----------------|
| name | Sim | Sim |
| phone | Sim | Sim |
| role | Sim | Nao |
| status | Sim | Nao |

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440055",
  "name": "Pedro Lima Junior",
  "email": "pedro@empresa.com",
  "phone": "(11) 96666-6666",
  "role": "admin",
  "status": "active",
  "updated_at": "2026-01-14T12:00:00Z"
}
```

---

### 2.5 Ativar/Desativar Usuario

```http
PATCH /api/v1/users/{id}/status
```

#### Request Body

```json
{
  "status": "inactive"
}
```

#### Validacoes

- Nao pode desativar a si mesmo
- Deve existir ao menos 1 admin ativo

#### Exemplo de Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440055",
  "status": "inactive",
  "updated_at": "2026-01-14T13:00:00Z"
}
```

#### Response (400 Bad Request) - Ultimo Admin

```json
{
  "error": {
    "code": "LAST_ADMIN",
    "message": "Nao e possivel desativar o ultimo administrador"
  }
}
```

---

### 2.6 Resetar Senha de Usuario

Admin pode resetar senha de qualquer usuario.

```http
POST /api/v1/users/{id}/reset-password
```

#### Exemplo de Response (200 OK)

```json
{
  "message": "Senha resetada com sucesso",
  "temporary_password": "Reset@789012"
}
```

---

### 2.7 Listar Operadores

Retorna lista simplificada de usuarios ativos (para selects).

```http
GET /api/v1/users/operators
```

#### Exemplo de Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440050",
      "name": "Joao Silva"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440051",
      "name": "Maria Santos"
    }
  ]
}
```

## 3. Perfis e Permissoes

### 3.1 Matriz de Permissoes

| Recurso | Admin | Operador | Viewer |
|---------|-------|----------|--------|
| Listar usuarios | Sim | Nao | Nao |
| Ver proprio perfil | Sim | Sim | Sim |
| Criar usuario | Sim | Nao | Nao |
| Editar usuario | Sim | Proprio | Proprio |
| Ativar/Desativar | Sim | Nao | Nao |
| Resetar senha | Sim | Nao | Nao |

### 3.2 Permissoes Detalhadas

| Permissao | Descricao |
|-----------|-----------|
| users:read | Listar e visualizar usuarios |
| users:write | Criar e editar usuarios |
| users:delete | Desativar usuarios |

## 4. Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| USER_NOT_FOUND | Usuario nao encontrado |
| EMAIL_EXISTS | Email ja cadastrado |
| INVALID_ROLE | Perfil invalido |
| CANNOT_DEACTIVATE_SELF | Nao pode desativar a si mesmo |
| LAST_ADMIN | Nao pode desativar ultimo admin |
| FORBIDDEN | Sem permissao para a acao |

---

**Documento:** users-api.md
**Ultima Atualizacao:** Janeiro 2026
