# Tasks - Liquid Flow Monitor

## Visao Geral

Este documento lista todas as tarefas necessarias para implementar o projeto Liquid Flow Monitor (TankControl) em producao.

**Status do Projeto:** Frontend completo (mockado), Backend pendente

---

## Legenda

| Simbolo | Significado |
|---------|-------------|
| `[ ]` | Pendente |
| `[x]` | Concluido |
| `[~]` | Em progresso |
| `P0` | Critica (bloqueante) |
| `P1` | Alta prioridade |
| `P2` | Media prioridade |
| `P3` | Baixa prioridade |

---

## FASE 1: BACKEND E INFRAESTRUTURA

### TASK-INF-001: Setup do Ambiente de Desenvolvimento (P0)

- [x] Criar repositorio do backend
- [x] Configurar Docker e docker-compose
- [x] Configurar banco PostgreSQL local
- [x] Criar arquivo .env.example
- [x] Documentar setup no README

**Arquivos relacionados:**
- `docs/04-arquitetura-sistema/ADR-001-stack-tecnologica.md`

**Arquivos criados:**
- `backend/` - Estrutura do backend
- `backend/Dockerfile` - Container do backend
- `backend/package.json` - Dependencias
- `backend/tsconfig.json` - Configuracao TypeScript
- `backend/README.md` - Documentacao do backend
- `backend/src/server.ts` - Entrada da aplicacao
- `backend/src/config/env.ts` - Variaveis de ambiente
- `backend/src/config/database.ts` - Conexao PostgreSQL
- `docker-compose.yml` - Orquestracao de containers
- `docker-compose.override.yml` - Override para desenvolvimento
- `database/init/*.sql` - Scripts de inicializacao do banco
- `.env.example` - Template de variaveis de ambiente

**Status:** CONCLUIDO em Janeiro 2026

---

### TASK-INF-002: Configurar Banco de Dados (P0)

- [x] Executar script de criacao do schema
- [x] Criar migrations iniciais
- [x] Configurar seeds de dados de teste
- [x] Testar conexao e scripts

**Arquivos relacionados:**
- `docs/03-modelagem-dados/SCHEMA-postgresql.sql`
- `docs/03-modelagem-dados/DER-sistema-completo.md`
- `docs/03-modelagem-dados/DICIONARIO-DADOS.md`

**Arquivos criados:**
- `backend/knexfile.ts` - Configuracao do Knex para migrations
- `backend/src/database/migrations/` - 10 migrations para todas as tabelas
  - `20260114000001_create_sites.ts`
  - `20260114000002_create_products.ts`
  - `20260114000003_create_users.ts`
  - `20260114000004_create_tanks.ts`
  - `20260114000005_create_movements.ts`
  - `20260114000006_create_price_lists.ts`
  - `20260114000007_create_audit_logs.ts`
  - `20260114000008_create_settings.ts`
  - `20260114000009_create_triggers.ts`
  - `20260114000010_create_views.ts`
- `backend/src/database/seeds/` - 7 seeds de dados de teste
  - `01_products.ts` - Produtos (Alcool, Cachaca)
  - `02_settings.ts` - Configuracoes padrao
  - `03_sites.ts` - Sites de demonstracao
  - `04_users.ts` - Usuarios de teste
  - `05_tanks.ts` - Tanques de exemplo
  - `06_price_lists.ts` - Tabela de precos
  - `07_movements.ts` - Movimentacoes de exemplo
- `backend/src/database/test-connection.ts` - Script de teste de conexao
- `database/README.md` - Documentacao do banco de dados

**Comandos disponiveis:**
- `npm run db:migrate` - Executar migrations
- `npm run db:seed` - Popular com dados de teste
- `npm run db:reset` - Reset completo
- `npm run db:test` - Testar conexao

**Status:** CONCLUIDO em Janeiro 2026

---

### TASK-INF-003: Estrutura Base do Backend (P0)

- [x] Escolher framework (Node.js/Express, Python/FastAPI ou Go)
- [x] Criar estrutura de pastas
- [x] Configurar ORM/Query Builder
- [x] Configurar variáveis de ambiente
- [x] Configurar CORS
- [x] Criar health check endpoint

**Arquivos relacionados:**
- `docs/04-arquitetura-sistema/ADR-001-stack-tecnologica.md`
- `docs/04-arquitetura-sistema/C4-CONTAINER.md`

**Arquivos criados/modificados:**
- `backend/src/server.ts` - Servidor Express com middlewares
- `backend/src/config/env.ts` - Configuração de variáveis de ambiente
- `backend/src/config/database.ts` - Configuração do Knex (Query Builder)
- `backend/src/routes/index.ts` - Roteamento base da API
- `backend/src/middlewares/` - Middlewares (errorHandler, requestLogger)
- `backend/src/utils/logger.ts` - Logger com Winston

**Status:** CONCLUIDO em Janeiro 2026

---

## FASE 2: AUTENTICACAO E SEGURANCA

### TASK-AUTH-001: Implementar Sistema de Autenticacao (P0)

- [x] Criar tabela de sessoes (se necessario) - Nao necessario (JWT stateless)
- [x] Implementar endpoint POST /auth/login
- [x] Implementar geracao de JWT
- [x] Implementar refresh token
- [x] Implementar endpoint POST /auth/logout
- [x] Implementar endpoint GET /auth/me
- [x] Criar middleware de autenticacao
- [x] Testar fluxo completo

**Arquivos relacionados:**
- `docs/05-definicao-apis/REST/auth-api.md`
- `docs/04-arquitetura-sistema/ADR-004-autenticacao.md`
- `docs/02-requisitos-casos-uso/UC-001-autenticar-usuario.md`

**Arquivos criados:**
- `backend/src/validators/auth.validator.ts` - Schemas Zod para validacao
- `backend/src/services/auth.service.ts` - Logica de autenticacao com JWT
- `backend/src/controllers/auth.controller.ts` - Handlers dos endpoints
- `backend/src/routes/auth.routes.ts` - Rotas de autenticacao
- `backend/src/middlewares/auth.middleware.ts` - Middleware de autenticacao JWT

**Endpoints implementados:**
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/logout` - Invalidar sessao
- `GET /api/auth/me` - Dados do usuario autenticado
- `PUT /api/auth/password` - Alterar senha

**Status:** CONCLUIDO em Janeiro 2026

---

### TASK-AUTH-002: Implementar Reset de Senha (P1)

- [x] Criar endpoint POST /auth/password/reset
- [x] Criar endpoint POST /auth/password/confirm
- [x] Implementar geracao de token de reset
- [x] Implementar envio de email (ou mock)
- [x] Implementar endpoint PUT /auth/password (alterar senha)

**Arquivos relacionados:**
- `docs/05-definicao-apis/REST/auth-api.md`

**Arquivos criados:**
- `backend/src/database/migrations/20260115000001_create_password_reset_tokens.ts` - Migration para tabela de tokens

**Arquivos modificados:**
- `backend/src/services/auth.service.ts` - Adicionados métodos requestPasswordReset, confirmPasswordReset e mockSendPasswordResetEmail
- `backend/src/controllers/auth.controller.ts` - Adicionados controllers requestPasswordReset e confirmPasswordReset
- `backend/src/routes/auth.routes.ts` - Adicionadas rotas POST /password/reset e POST /password/confirm
- `backend/src/validators/auth.validator.ts` - Adicionados schemas requestPasswordResetSchema e confirmPasswordResetSchema

**Endpoints implementados:**
- `POST /api/auth/password/reset` - Solicita reset de senha (envia email com token)
- `POST /api/auth/password/confirm` - Confirma reset com token e nova senha

**Funcionalidades:**
- Token de 64 caracteres hexadecimais gerado com crypto.randomBytes
- Token expira em 1 hora
- Tokens anteriores são invalidados ao solicitar novo reset
- Mock de email para desenvolvimento (log no console)
- Resposta genérica para prevenir enumeração de emails

**Status:** CONCLUIDO em Janeiro 2026

---

### TASK-AUTH-003: Implementar Controle de Permissoes (P1)

- [x] Criar middleware de autorizacao por role
- [x] Proteger endpoints conforme matriz de permissoes
- [x] Testar acessos por perfil (admin, operador, viewer)

**Arquivos relacionados:**
- `docs/02-requisitos-casos-uso/UC-008-gerenciar-usuarios.md` (secao 14)

**Arquivos criados:**
- `backend/src/config/permissions.ts` - Constantes de permissoes e matriz RBAC

**Arquivos modificados:**
- `backend/src/controllers/auth.controller.ts` - Usa permissoes do arquivo centralizado
- `backend/src/middlewares/auth.middleware.ts` - Novos middlewares requirePermission e requireAnyPermission

**Permissoes por perfil:**
- Admin: Acesso total (15 permissoes)
- Operador: Leitura + movements:write (9 permissoes)
- Viewer: Apenas leitura + reports:export (8 permissoes)

**Status:** CONCLUIDO em Janeiro 2026

---

## FASE 3: APIs PRINCIPAIS

### TASK-API-001: Implementar API de Sites (P1)

- [x] GET /sites - Listar sites
- [x] GET /sites/:id - Obter site por ID
- [x] POST /sites - Criar site (admin)
- [x] PUT /sites/:id - Atualizar site (admin)
- [x] Criar validacoes
- [x] Criar testes

---

### TASK-API-002: Implementar API de Tanques (P0)

- [x] GET /tanks - Listar tanques com filtros
- [x] GET /tanks/:id - Obter tanque por ID
- [x] GET /tanks/summary - Resumo consolidado
- [x] POST /tanks - Criar tanque (admin)
- [x] PUT /tanks/:id - Atualizar tanque (admin)
- [x] Implementar calculo de status (verde/amarelo/vermelho)
- [x] Implementar calculo de valor estimado
- [x] Criar validacoes
- [x] Criar testes

**Arquivos relacionados:**
- `docs/05-definicao-apis/REST/tanks-api.md`
- `docs/02-requisitos-casos-uso/UC-003-gerenciar-tanques.md`

---

### TASK-API-003: Implementar API de Movimentacoes (P0)

- [x] GET /movements - Listar com filtros e paginacao
- [x] GET /movements/:id - Obter movimentacao por ID
- [x] GET /movements/kpis - KPIs do periodo
- [x] GET /movements/export - Exportar CSV
- [x] POST /movements - Registrar movimentacao
- [x] Implementar validacao de saldo (saida)
- [x] Implementar validacao de capacidade (entrada)
- [x] Implementar calculo de valor/custo/lucro
- [x] Implementar atualizacao automatica do volume do tanque
- [x] Criar trigger ou logica no backend
- [x] Criar validacoes
- [x] Criar testes

**Arquivos relacionados:**
- `docs/05-definicao-apis/REST/movements-api.md`
- `docs/02-requisitos-casos-uso/UC-004-registrar-movimentacao.md`
- `docs/02-requisitos-casos-uso/UC-005-consultar-movimentacoes.md`

---

### TASK-API-004: Implementar API de Produtos e Precos (P1)

- [x] GET /products - Listar produtos
- [x] GET /price-lists - Listar precos
- [x] GET /prices/current/:product - Preco vigente
- [x] POST /price-lists - Criar preco (admin)
- [x] Implementar logica de status (vigente/futuro/expirado)
- [x] Criar validacoes
- [x] Criar testes

**Arquivos relacionados:**
- `docs/02-requisitos-casos-uso/UC-006-gerenciar-precos.md`

---

### TASK-API-005: Implementar API de Usuarios (P1)

- [x] GET /users - Listar usuarios (admin)
- [x] GET /users/:id - Obter usuario
- [x] GET /users/operators - Lista simplificada
- [x] POST /users - Criar usuario (admin)
- [x] PUT /users/:id - Atualizar usuario
- [x] PATCH /users/:id/status - Ativar/desativar
- [x] POST /users/:id/reset-password - Resetar senha (admin)
- [x] Implementar validacao de ultimo admin
- [x] Criar validacoes
- [x] Criar testes

**Arquivos relacionados:**
- `docs/05-definicao-apis/REST/users-api.md`
- `docs/02-requisitos-casos-uso/UC-008-gerenciar-usuarios.md`

---

### TASK-API-006: Implementar API de Dashboard (P1)

- [x] GET /dashboard - Dados consolidados
- [x] Implementar calculo de KPIs
- [x] Implementar dados para graficos
- [x] Implementar filtros por periodo/produto/tanque
- [x] Otimizar queries para performance
- [x] Criar testes

**Arquivos relacionados:**
- `docs/02-requisitos-casos-uso/UC-002-visualizar-dashboard.md`

---

### TASK-API-007: Implementar API de Configuracoes (P2)

- [x] GET /settings - Obter configuracoes
- [x] PUT /settings - Atualizar configuracoes (admin)
- [x] Criar validacoes
- [x] Criar testes

**Arquivos relacionados:**
- `docs/02-requisitos-casos-uso/UC-009-configurar-sistema.md`

---

## FASE 4: INTEGRACAO FRONTEND-BACKEND

### TASK-INT-001: Atualizar Servico de API no Frontend (P0)

- [x] Remover mocks de `/src/services/api.ts`
- [x] Implementar chamadas reais para o backend
- [x] Configurar interceptors do axios/fetch
- [x] Implementar tratamento de erros
- [x] Implementar refresh token automatico
- [x] Configurar variavel de ambiente VITE_API_URL

**Arquivos relacionados:**
- `src/services/api.ts`

---

### TASK-INT-002: Implementar Autenticacao Real no Frontend (P0)

- [x] Atualizar tela de Login para usar API real
- [x] Implementar armazenamento seguro de tokens
- [x] Implementar logout
- [x] Implementar redirect para login quando token expira
- [x] Testar fluxo completo

**Arquivos relacionados:**
- `src/pages/Login.tsx`

---

### TASK-INT-003: Testar Integracao Completa (P0)

- [x] Testar login/logout
- [x] Testar CRUD de tanques
- [x] Testar registro de movimentacoes
- [x] Testar validacoes (saldo, capacidade)
- [x] Testar dashboard com dados reais
- [x] Testar filtros
- [x] Testar exportacao CSV
- [x] Testar gestao de usuarios
- [x] Testar configuracoes

**Status:** CONCLUIDO em Janeiro 2026

**Bug corrigido durante testes:**
- `backend/src/services/dashboard.service.ts` - Removido join duplicado na funcao getTop5Tanks

---

## FASE 5: FUNCIONALIDADES ADICIONAIS

### TASK-FEAT-001: Implementar Exportacao PDF (P2)

- [ ] Escolher biblioteca (pdfmake, puppeteer, etc)
- [ ] Implementar geracao de relatorio de vendas em PDF
- [ ] Implementar geracao de relatorio de estoque em PDF
- [ ] Implementar geracao de relatorio financeiro em PDF
- [ ] Testar formatacao e layout

**Arquivos relacionados:**
- `docs/02-requisitos-casos-uso/UC-007-exportar-relatorios.md`

---

### TASK-FEAT-002: Implementar Notificacoes por Email (P2)

- [ ] Configurar servico de email (SendGrid, SES, etc)
- [ ] Criar templates de email
- [ ] Implementar envio de alerta de estoque baixo
- [ ] Implementar envio de email de boas-vindas
- [ ] Implementar envio de email de reset de senha
- [ ] Testar envios

**Arquivos relacionados:**
- `docs/01-briefing-discovery/REQ-001-requisitos-negocio.md` (RN-24 a RN-26)

---

### TASK-FEAT-003: Implementar Logs de Auditoria (P2)

- [ ] Criar tabela audit_logs (ja existe no schema)
- [ ] Implementar registro de acoes (CREATE, UPDATE, DELETE)
- [ ] Implementar registro de login/logout
- [ ] Criar endpoint de consulta de logs (admin)
- [ ] Testar registros

**Arquivos relacionados:**
- `docs/03-modelagem-dados/SCHEMA-postgresql.sql`

---

## FASE 6: TESTES E QUALIDADE

### TASK-TEST-001: Implementar Testes Unitarios Backend (P1)

- [ ] Configurar framework de testes (Jest, pytest, etc)
- [ ] Criar testes para servicos de autenticacao
- [ ] Criar testes para servicos de tanques
- [ ] Criar testes para servicos de movimentacoes
- [ ] Criar testes para calculos de KPIs
- [ ] Atingir cobertura > 80%

**Arquivos relacionados:**
- `docs/07-plano-testes/TP-001-plano-testes-geral.md`

---

### TASK-TEST-002: Implementar Testes de Integracao (P1)

- [ ] Configurar ambiente de testes
- [ ] Criar testes para fluxo de autenticacao
- [ ] Criar testes para fluxo de movimentacoes
- [ ] Criar testes para validacoes de negocio

**Arquivos relacionados:**
- `docs/07-plano-testes/TC-001-movimentacoes.md`

---

### TASK-TEST-003: Implementar Testes E2E no Frontend (P2)

- [ ] Configurar Playwright ou Cypress
- [ ] Criar testes para fluxo de login
- [ ] Criar testes para fluxo de movimentacoes
- [ ] Criar testes para dashboard
- [ ] Criar testes para exportacao

---

## FASE 7: DEPLOY E OPERACOES

### TASK-OPS-001: Configurar CI/CD (P1)

- [ ] Configurar pipeline de build (GitHub Actions/GitLab CI)
- [ ] Configurar execucao de testes automaticos
- [ ] Configurar lint automatico
- [ ] Configurar deploy automatico para staging
- [ ] Configurar deploy manual para producao

**Arquivos relacionados:**
- `docs/08-operacoes/RB-001-deploy-producao.md`

---

### TASK-OPS-002: Configurar Ambiente de Producao (P1)

- [ ] Provisionar servidor/container para backend
- [ ] Provisionar banco de dados PostgreSQL
- [ ] Configurar CDN para frontend
- [ ] Configurar SSL/HTTPS
- [ ] Configurar variaveis de ambiente
- [ ] Configurar backups automaticos

**Arquivos relacionados:**
- `docs/04-arquitetura-sistema/C4-CONTAINER.md`

---

### TASK-OPS-003: Configurar Monitoramento (P2)

- [ ] Configurar logs centralizados
- [ ] Configurar metricas de aplicacao
- [ ] Configurar alertas
- [ ] Criar dashboards de monitoramento

**Arquivos relacionados:**
- `docs/08-operacoes/RB-002-monitoramento-alertas.md`

---

### TASK-OPS-004: Primeiro Deploy em Producao (P1)

- [ ] Executar checklist pre-deploy
- [ ] Realizar deploy do backend
- [ ] Realizar deploy do frontend
- [ ] Executar smoke tests
- [ ] Monitorar por 24h
- [ ] Documentar resultado

**Arquivos relacionados:**
- `docs/08-operacoes/RB-001-deploy-producao.md`

---

## FASE 8: MELHORIAS FUTURAS (ROADMAP)

### TASK-ROAD-001: Integracao com Sensores IoT (P3)

- [ ] Definir protocolo (REST/MQTT)
- [ ] Criar API para receber dados de sensores
- [ ] Implementar autenticacao de dispositivos
- [ ] Implementar atualizacao automatica de volume
- [ ] Criar dashboard de dispositivos

---

### TASK-ROAD-002: Aplicativo Mobile (P3)

- [ ] Avaliar tecnologia (React Native, Flutter)
- [ ] Implementar versao mobile
- [ ] Publicar nas lojas

---

### TASK-ROAD-003: Integracao com ERP (P3)

- [ ] Mapear APIs de ERP alvo
- [ ] Implementar sincronizacao de dados
- [ ] Implementar webhooks

---

## Resumo de Prioridades

| Prioridade | Quantidade | Descricao |
|------------|------------|-----------|
| P0 | 8 | Criticas - Bloqueiam uso em producao |
| P1 | 10 | Alta - Necessarias para v1.0 funcional |
| P2 | 6 | Media - Melhoram a experiencia |
| P3 | 3 | Baixa - Roadmap futuro |

---

## Ordem de Execucao Recomendada

```
FASE 1 (Infraestrutura)
    │
    ▼
FASE 2 (Autenticacao) ──────────────────────┐
    │                                        │
    ▼                                        │
FASE 3 (APIs) ◄─────────────────────────────┤
    │                                        │
    ▼                                        │ Paralelo
FASE 4 (Integracao Frontend) ◄──────────────┤
    │                                        │
    ▼                                        │
FASE 6 (Testes) ◄───────────────────────────┘
    │
    ▼
FASE 7 (Deploy)
    │
    ▼
FASE 5 (Funcionalidades Adicionais)
    │
    ▼
FASE 8 (Roadmap Futuro)
```

---

**Documento:** tasks.md
**Ultima Atualizacao:** Janeiro 2026
**Total de Tarefas:** 27
