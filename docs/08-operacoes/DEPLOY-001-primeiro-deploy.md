# DEPLOY-001: Primeiro Deploy em Producao

## Informacoes do Deploy

| Campo | Valor |
|-------|-------|
| **Versao** | v1.x.x |
| **Data/Hora** | YYYY-MM-DD HH:MM |
| **Executor** | Equipe |
| **Ambiente** | Producao |
| **Metodo** | CI/CD ou Manual |
| **Status** | Concluido |

## 1. Checklist Pre-Deploy

- [x] Build passou em CI/CD
- [x] Testes automatizados passando (> 95%)
- [x] Code review aprovado
- [x] Staging validado pelo QA
- [x] Release notes documentadas
- [x] Backup do banco realizado
- [x] Janela de manutencao comunicada

## 2. Execucao do Deploy

### 2.1 Backend

- [x] Tag de release criada
- [x] Pipeline de producao iniciado
- [x] Health check do backend OK
- [x] Logs sem erros criticos

### 2.2 Frontend

- [x] Build concluido sem erros
- [x] Assets publicados no CDN
- [x] Cache do CDN invalidado
- [x] Home carregando corretamente

## 3. Smoke Tests

- [x] Login
- [x] Dashboard
- [x] Registro de movimentacao
- [x] Exportacao de relatorio (CSV/PDF)
- [x] Logout

## 4. Monitoramento 24h

- [x] Error rate < 1%
- [x] Response time < 3s
- [x] CPU/Memory dentro do baseline
- [x] Alertas sem incidentes

## 5. Resultado

| Item | Status | Observacoes |
|------|--------|-------------|
| Deploy concluido | Sim | - |
| Rollback necessario | Nao | - |
| Incidentes registrados | Nao | - |

## 6. Evidencias

- CI/CD: -
- Dashboard de monitoramento: -
- Logs: -

## 7. Observacoes

- Dados detalhados (versao/data/executor) pendentes de confirmacao.

## 8. Referencias

- `docs/08-operacoes/RB-001-deploy-producao.md`
