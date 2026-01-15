# RB-001: Runbook - Deploy em Producao

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **ID** | RB-001 |
| **Procedimento** | Deploy em Producao |
| **Versao** | 1.0 |
| **Criticidade** | Alta |
| **Tempo Estimado** | 30-60 minutos |

## 1. Objetivo

Este runbook descreve o procedimento padrao para deploy de novas versoes do Liquid Flow Monitor em ambiente de producao.

## 2. Pre-requisitos

### 2.1 Checklist Pre-Deploy

- [ ] Build passou em CI/CD
- [ ] Testes automatizados passando (> 95%)
- [ ] Code review aprovado
- [ ] Staging validado pelo QA
- [ ] Release notes documentadas
- [ ] Backup do banco realizado
- [ ] Janela de manutencao comunicada

### 2.2 Acessos Necessarios

| Recurso | Tipo de Acesso |
|---------|----------------|
| Repositorio Git | Push para main |
| CI/CD (GitHub Actions/GitLab) | Trigger deploy |
| Cloud Provider | Console acesso |
| Banco de Dados | Read-only (verificacao) |
| Monitoramento | Dashboard view |

### 2.3 Contatos

| Papel | Contato |
|-------|---------|
| Tech Lead | [Nome] |
| DevOps | [Nome] |
| DBA | [Nome] |
| Suporte N2 | [Email/Telefone] |

## 3. Procedimento

### 3.1 Preparacao (T-30min)

```bash
# 1. Verificar status atual
git fetch origin
git status

# 2. Verificar builds recentes
# Acessar CI/CD e confirmar que ultimo build passou

# 3. Verificar metricas atuais
# Acessar dashboard de monitoramento
# Anotar valores de baseline:
# - Requests/min
# - Error rate
# - Response time
```

### 3.2 Backup (T-15min)

```bash
# Backup do banco de dados (se aplicavel)
pg_dump -h $DB_HOST -U $DB_USER -d liquid_flow_monitor \
  -f backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -la backup_*.sql
```

### 3.3 Deploy (T-0)

#### Opcao A: Deploy Automatico (CI/CD)

```bash
# 1. Criar tag de release
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x

# 2. CI/CD executa automaticamente:
# - Build da aplicacao
# - Push para registry
# - Deploy no ambiente
```

#### Opcao B: Deploy Manual

```bash
# 1. Build da aplicacao
npm run build

# 2. Upload dos assets
# Para S3/CDN:
aws s3 sync dist/ s3://bucket-name/app/ --delete

# 3. Invalidar cache CDN
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

### 3.4 Verificacao (T+5min)

```bash
# 1. Verificar health check
curl -s https://app.exemplo.com/health | jq

# 2. Verificar versao
curl -s https://app.exemplo.com/version

# 3. Teste de smoke manual
# - Acessar login
# - Verificar dashboard
# - Testar uma movimentacao

# 4. Verificar logs
# Acessar ferramenta de logs e verificar erros
```

### 3.5 Monitoramento (T+15min)

```
Metricas a observar:
- Error rate: deve permanecer < 1%
- Response time: deve permanecer < 3s
- CPU/Memory: nao deve ter picos anormais
- Active users: comportamento normal
```

## 4. Rollback

### 4.1 Criterios para Rollback

- Error rate > 5% por mais de 5 minutos
- Funcionalidade critica quebrada
- Performance degradada significativamente
- Perda de dados detectada

### 4.2 Procedimento de Rollback

```bash
# 1. Identificar versao anterior
git tag -l | tail -5

# 2. Deploy da versao anterior
# Via CI/CD: re-executar deploy da tag anterior
# Via manual: repetir deploy com build anterior

# 3. Verificar rollback
curl -s https://app.exemplo.com/version

# 4. Notificar equipe
# Enviar mensagem no canal de comunicacao
```

### 4.3 Rollback de Banco (se necessario)

```bash
# ATENCAO: Apenas em caso extremo
# Requer aprovacao do DBA

# 1. Parar aplicacao
# 2. Restaurar backup
psql -h $DB_HOST -U $DB_USER -d liquid_flow_monitor \
  < backup_YYYYMMDD_HHMMSS.sql

# 3. Reiniciar aplicacao
```

## 5. Troubleshooting

### 5.1 Build falhou

```
Problema: Pipeline de build falhou
Verificar:
- Logs do CI/CD
- Testes que falharam
- Dependencias corrompidas

Acao:
- Corrigir codigo
- Re-executar pipeline
```

### 5.2 Deploy nao reflete mudancas

```
Problema: Versao antiga ainda visivel
Verificar:
- Cache do CDN
- Cache do navegador
- Container antigo ainda rodando

Acao:
- Invalidar cache CDN
- Limpar cache navegador (Ctrl+Shift+R)
- Verificar rolling update completou
```

### 5.3 Erro 502/503 apos deploy

```
Problema: Aplicacao inacessivel
Verificar:
- Logs do container/servico
- Health check falhando
- Configuracao de ambiente

Acao:
- Verificar variaveis de ambiente
- Checar conexao com banco
- Iniciar rollback se necessario
```

### 5.4 Performance degradada

```
Problema: Resposta lenta apos deploy
Verificar:
- Novas queries pesadas
- Memory leaks
- CPU alto

Acao:
- Analisar profiling
- Verificar N+1 queries
- Considerar rollback
```

## 6. Pos-Deploy

### 6.1 Checklist Pos-Deploy

- [ ] Versao correta em producao
- [ ] Health checks passando
- [ ] Metricas estaveis (30 min)
- [ ] Smoke tests manuais OK
- [ ] Release notes publicadas
- [ ] Stakeholders notificados

### 6.2 Comunicacao

```
Assunto: [Deploy] Liquid Flow Monitor v1.x.x em Producao

Deploy realizado com sucesso.

Versao: v1.x.x
Data/Hora: DD/MM/YYYY HH:mm
Status: OK

Principais mudancas:
- [Lista de features/fixes]

Monitoramento: [Link para dashboard]
```

## 7. Historico de Execucoes

| Data | Versao | Executor | Status | Observacoes |
|------|--------|----------|--------|-------------|
| - | - | - | - | - |

---

**Documento:** RB-001-deploy-producao.md
**Ultima Atualizacao:** Janeiro 2026
