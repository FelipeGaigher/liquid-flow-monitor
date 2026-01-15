# RB-002: Runbook - Monitoramento e Alertas

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **ID** | RB-002 |
| **Procedimento** | Monitoramento e Resposta a Alertas |
| **Versao** | 1.0 |
| **Criticidade** | Alta |

## 1. Objetivo

Documentar os procedimentos de monitoramento do sistema e resposta a alertas para garantir disponibilidade e performance do Liquid Flow Monitor.

## 2. Dashboards de Monitoramento

### 2.1 Metricas Principais

| Metrica | Normal | Warning | Critico |
|---------|--------|---------|---------|
| Error Rate | < 1% | 1-5% | > 5% |
| Response Time (P95) | < 1s | 1-3s | > 3s |
| CPU Usage | < 70% | 70-85% | > 85% |
| Memory Usage | < 75% | 75-90% | > 90% |
| Disk Usage | < 80% | 80-90% | > 90% |
| Active Connections | < 80% pool | 80-95% | > 95% |

### 2.2 Health Checks

```
Endpoint: GET /health

Response esperada:
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-14T10:00:00Z",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "storage": "ok"
  }
}

Frequencia: A cada 30 segundos
Timeout: 5 segundos
```

## 3. Alertas Configurados

### 3.1 Alertas de Aplicacao

| Alerta | Condicao | Severidade | Acao |
|--------|----------|------------|------|
| High Error Rate | errors > 5% por 5min | Critico | Investigar logs |
| Slow Response | P95 > 3s por 5min | Alto | Analisar performance |
| Health Check Fail | 3 falhas consecutivas | Critico | Verificar servico |
| High Memory | > 90% por 10min | Alto | Reiniciar/Escalar |

### 3.2 Alertas de Infraestrutura

| Alerta | Condicao | Severidade | Acao |
|--------|----------|------------|------|
| CPU High | > 85% por 15min | Alto | Escalar recursos |
| Disk Full | > 90% | Critico | Limpar/Expandir |
| DB Connections | > 95% pool | Critico | Investigar leaks |
| SSL Expiring | < 30 dias | Medio | Renovar certificado |

## 4. Procedimentos de Resposta

### 4.1 ALERTA: High Error Rate

```
Severidade: CRITICO
Impacto: Usuarios afetados

PASSO 1: Identificar o problema
- Acessar logs da aplicacao
- Filtrar por erros recentes (ultimos 15min)
- Identificar padrao de erros

PASSO 2: Triagem
- Erro de aplicacao? -> Ver logs de stack trace
- Erro de banco? -> Verificar conexoes
- Erro externo? -> Verificar integradores

PASSO 3: Mitigacao
- Se erro conhecido: aplicar fix conhecido
- Se novo erro: escalar para desenvolvimento
- Se impacto alto: considerar rollback

PASSO 4: Comunicacao
- Notificar equipe no canal
- Atualizar status page (se houver)
```

### 4.2 ALERTA: Slow Response Time

```
Severidade: ALTO
Impacto: Performance degradada

PASSO 1: Identificar gargalo
- Verificar tempo de resposta por endpoint
- Verificar queries lentas no banco
- Verificar uso de recursos

PASSO 2: Analise
- Queries N+1?
- Lock no banco?
- CPU/Memory alto?
- Pico de trafego?

PASSO 3: Acao
- Query lenta: adicionar indice (DBA)
- Recurso: escalar horizontalmente
- Trafego: verificar rate limiting
```

### 4.3 ALERTA: Health Check Failure

```
Severidade: CRITICO
Impacto: Servico potencialmente indisponivel

PASSO 1: Verificar status
curl -v https://app.exemplo.com/health

PASSO 2: Se falhar
- Verificar logs do container
- Verificar conexao com banco
- Verificar DNS/Rede

PASSO 3: Recuperacao
- Reiniciar container/servico
- Se persistir: rollback
- Escalar para equipe

PASSO 4: Pos-incidente
- Documentar causa raiz
- Criar acao preventiva
```

### 4.4 ALERTA: High Memory Usage

```
Severidade: ALTO
Impacto: Risco de OOM

PASSO 1: Identificar consumo
- Verificar processos
- Verificar heap/GC
- Verificar memory leaks

PASSO 2: Acao imediata
- Se > 95%: reiniciar servico
- Se crescendo: investigar leak
- Escalar recursos se necessario

PASSO 3: Investigacao
- Analisar dumps de memoria
- Verificar atualizacoes recentes
- Revisar codigo suspeito
```

## 5. Escalacao

### 5.1 Matriz de Escalacao

| Severidade | Tempo Resposta | Primeiro Contato | Escalacao |
|------------|----------------|------------------|-----------|
| Critico | 15 min | DevOps/SRE | Tech Lead -> CTO |
| Alto | 30 min | DevOps | Tech Lead |
| Medio | 2 horas | Dev de plantao | DevOps |
| Baixo | 24 horas | Fila de tickets | Dev |

### 5.2 Contatos de Emergencia

| Papel | Contato | Horario |
|-------|---------|---------|
| DevOps Plantao | [Telefone] | 24/7 |
| Tech Lead | [Telefone] | Comercial |
| DBA | [Telefone] | Comercial |

## 6. Ferramentas

| Ferramenta | Uso | Acesso |
|------------|-----|--------|
| Grafana | Dashboards | [URL] |
| Prometheus | Metricas | [URL] |
| Loki/ELK | Logs | [URL] |
| PagerDuty | Alertas | [URL] |

## 7. Manutencao Preventiva

### 7.1 Checklist Diario

- [ ] Verificar dashboards principais
- [ ] Revisar alertas das ultimas 24h
- [ ] Verificar uso de disco
- [ ] Verificar backups completados

### 7.2 Checklist Semanal

- [ ] Revisar metricas de tendencia
- [ ] Verificar certificados SSL
- [ ] Analisar logs de erro
- [ ] Atualizar documentacao se necessario

### 7.3 Checklist Mensal

- [ ] Revisar capacidade
- [ ] Testar procedimento de DR
- [ ] Atualizar dependencias de seguranca
- [ ] Revisar custos de infraestrutura

---

**Documento:** RB-002-monitoramento-alertas.md
**Ultima Atualizacao:** Janeiro 2026
