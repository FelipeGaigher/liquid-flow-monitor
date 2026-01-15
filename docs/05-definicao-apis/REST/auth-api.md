# API REST: Autenticacao

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Recurso** | Authentication |
| **Base URL** | `/api/v1/auth` |
| **Versao** | 1.0 |
| **Autenticacao** | Publica (login) / Bearer Token (demais) |

## 1. Visao Geral

API para autenticacao e gerenciamento de sessoes de usuarios.

## 2. Endpoints

### 2.1 Login

Autentica usuario e retorna tokens de acesso.

```http
POST /api/v1/auth/login
```

#### Request Body

```json
{
  "email": "usuario@empresa.com",
  "password": "senha123"
}
```

#### Campos do Request

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| email | string | Sim | Formato email valido |
| password | string | Sim | Min 6 caracteres |

#### Exemplo de Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440050",
    "name": "Joao Silva",
    "email": "joao@empresa.com",
    "role": "admin"
  }
}
```

#### Response (401 Unauthorized)

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha invalidos"
  }
}
```

#### Response (403 Forbidden) - Usuario Inativo

```json
{
  "error": {
    "code": "USER_INACTIVE",
    "message": "Conta desativada. Contate o administrador"
  }
}
```

#### Response (429 Too Many Requests)

```json
{
  "error": {
    "code": "TOO_MANY_ATTEMPTS",
    "message": "Muitas tentativas de login. Tente novamente em 15 minutos",
    "retry_after": 900
  }
}
```

---

### 2.2 Refresh Token

Renova o access token usando refresh token.

```http
POST /api/v1/auth/refresh
```

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Exemplo de Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 28800
}
```

#### Response (401 Unauthorized)

```json
{
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token invalido ou expirado"
  }
}
```

---

### 2.3 Logout

Invalida a sessao do usuario.

```http
POST /api/v1/auth/logout
```

#### Headers

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### Exemplo de Response (200 OK)

```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### 2.4 Obter Usuario Atual

Retorna dados do usuario autenticado.

```http
GET /api/v1/auth/me
```

#### Headers

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

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
  "permissions": [
    "tanks:read",
    "tanks:write",
    "movements:read",
    "movements:write",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write"
  ]
}
```

---

### 2.5 Alterar Senha

Altera a senha do usuario autenticado.

```http
PUT /api/v1/auth/password
```

#### Headers

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### Request Body

```json
{
  "current_password": "senhaAtual123",
  "new_password": "novaSenha456"
}
```

#### Validacoes

| Campo | Validacao |
|-------|-----------|
| current_password | Deve ser a senha atual |
| new_password | Min 8 chars, diferente da atual |

#### Exemplo de Response (200 OK)

```json
{
  "message": "Senha alterada com sucesso"
}
```

#### Response (400 Bad Request)

```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Senha atual incorreta"
  }
}
```

---

### 2.6 Solicitar Reset de Senha

Envia email com link para redefinicao de senha.

```http
POST /api/v1/auth/password/reset
```

#### Request Body

```json
{
  "email": "usuario@empresa.com"
}
```

#### Exemplo de Response (200 OK)

```json
{
  "message": "Se o email existir, um link de recuperacao sera enviado"
}
```

> **Nota**: Sempre retorna sucesso para evitar enumeracao de usuarios.

---

### 2.7 Confirmar Reset de Senha

Define nova senha usando token de reset.

```http
POST /api/v1/auth/password/confirm
```

#### Request Body

```json
{
  "token": "abc123def456...",
  "new_password": "novaSenha789"
}
```

#### Exemplo de Response (200 OK)

```json
{
  "message": "Senha redefinida com sucesso"
}
```

#### Response (400 Bad Request)

```json
{
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Token invalido ou expirado"
  }
}
```

## 3. Estrutura do JWT

### 3.1 Header

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

### 3.2 Payload

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440050",
  "email": "joao@empresa.com",
  "role": "admin",
  "iat": 1704153600,
  "exp": 1704182400,
  "iss": "liquid-flow-monitor",
  "jti": "unique-token-id"
}
```

### 3.3 Configuracoes de Token

| Parametro | Access Token | Refresh Token |
|-----------|-------------|---------------|
| TTL | 8 horas | 7 dias |
| Algoritmo | RS256 | RS256 |
| Rotacao | - | Sim (a cada uso) |

## 4. Seguranca

### 4.1 Rate Limiting

| Endpoint | Limite |
|----------|--------|
| /login | 5 tentativas / 15 min |
| /refresh | 10 requests / min |
| /password/reset | 3 requests / hora |

### 4.2 Protecoes

- Senhas armazenadas com bcrypt (cost 12)
- Tokens assinados com RS256
- HTTPS obrigatorio
- Headers de seguranca (HSTS, CSP)

## 5. Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| INVALID_CREDENTIALS | Email ou senha invalidos |
| USER_INACTIVE | Usuario desativado |
| TOO_MANY_ATTEMPTS | Rate limit excedido |
| INVALID_TOKEN | Token JWT invalido |
| TOKEN_EXPIRED | Token expirado |
| INVALID_REFRESH_TOKEN | Refresh token invalido |
| INVALID_RESET_TOKEN | Token de reset invalido |
| INVALID_PASSWORD | Senha atual incorreta |
| WEAK_PASSWORD | Senha muito fraca |

---

**Documento:** auth-api.md
**Ultima Atualizacao:** Janeiro 2026
