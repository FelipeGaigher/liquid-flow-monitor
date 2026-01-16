# Monitoring Stack - Liquid Flow Monitor

Stack completa de monitoramento com Prometheus, Loki, Grafana e Alertmanager.

## Componentes

| Componente | Funcao | Porta | URL |
|------------|--------|-------|-----|
| Prometheus | Coleta de metricas | 9090 | http://localhost:9090 |
| Grafana | Dashboards | 3001 | http://localhost:3001 |
| Loki | Agregacao de logs | 3100 | http://localhost:3100 |
| Alertmanager | Gestao de alertas | 9093 | http://localhost:9093 |
| Node Exporter | Metricas do host | 9100 | http://localhost:9100 |
| Postgres Exporter | Metricas do banco | 9187 | http://localhost:9187 |
| cAdvisor | Metricas de containers | 8080 | http://localhost:8080 |
| Promtail | Coleta de logs | 9080 | - |

## Quick Start

### 1. Pre-requisitos

Certifique-se que a aplicacao principal esta rodando:

```bash
# Na raiz do projeto
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Iniciar Stack de Monitoramento

```bash
cd deploy/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Acessar Grafana

- URL: http://localhost:3001
- Usuario: admin
- Senha: admin (alterar no primeiro acesso)

## Dashboards Disponiveis

### LFM - Overview

Dashboard principal com:
- Status dos servicos (Backend, PostgreSQL)
- Error Rate e Response Time
- CPU e Memory Usage
- Request Rate por status HTTP
- Latencia (P50, P95, P99)
- Conexoes e operacoes do banco

## Alertas Configurados

### Aplicacao

| Alerta | Condicao | Severidade |
|--------|----------|------------|
| HighErrorRate | Error rate > 5% por 5min | Critical |
| SlowResponseTime | P95 > 3s por 5min | Warning |
| HealthCheckFailure | Backend down por 2min | Critical |

### Infraestrutura

| Alerta | Condicao | Severidade |
|--------|----------|------------|
| HighCPUUsage | CPU > 85% por 15min | Warning |
| HighMemoryUsage | Memory > 90% por 10min | Warning |
| CriticalMemoryUsage | Memory > 95% por 5min | Critical |
| DiskSpaceLow | Disk > 80% | Warning |
| DiskSpaceCritical | Disk > 90% | Critical |

### Database

| Alerta | Condicao | Severidade |
|--------|----------|------------|
| PostgreSQLDown | Banco down | Critical |
| PostgreSQLHighConnections | Conexoes > 80% | Warning |
| PostgreSQLCriticalConnections | Conexoes > 95% | Critical |
| PostgreSQLSlowQueries | Queries > 60s | Warning |

### Containers

| Alerta | Condicao | Severidade |
|--------|----------|------------|
| ContainerDown | Container lfm-* down | Critical |
| ContainerHighCPU | CPU > 80% por 10min | Warning |
| ContainerHighMemory | Memory > 80% por 10min | Warning |
| ContainerRestarting | > 3 restarts/hora | Warning |

## Configurar Notificacoes

### Email (SMTP)

Edite `alertmanager/alertmanager.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alertmanager@seudominio.com'
  smtp_auth_username: 'seu-email@gmail.com'
  smtp_auth_password: 'sua-app-password'
```

### Slack

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'

receivers:
  - name: 'slack-receiver'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
```

### PagerDuty

```yaml
receivers:
  - name: 'pagerduty-receiver'
    pagerduty_configs:
      - service_key: 'your-service-key'
        send_resolved: true
```

## Comandos Uteis

```bash
# Ver logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Reiniciar servico especifico
docker-compose -f docker-compose.monitoring.yml restart prometheus

# Verificar alertas ativos
curl http://localhost:9093/api/v2/alerts

# Reload configuracao do Prometheus
curl -X POST http://localhost:9090/-/reload

# Status dos targets do Prometheus
curl http://localhost:9090/api/v1/targets

# Verificar saude do Loki
curl http://localhost:3100/ready
```

## Adicionar Metricas na Aplicacao

Para expor metricas do backend, adicione o endpoint `/metrics`:

```typescript
// backend/src/routes/metrics.routes.ts
import { Router } from 'express';
import client from 'prom-client';

const router = Router();

// Metricas padrao
client.collectDefaultMetrics({ prefix: 'lfm_' });

// Metricas customizadas
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export { router as metricsRouter, httpRequestsTotal, httpRequestDuration };
```

## Retencao de Dados

| Componente | Retencao | Configuracao |
|------------|----------|--------------|
| Prometheus | 15 dias | `--storage.tsdb.retention.time=15d` |
| Loki | 14 dias | `retention_period: 336h` |
| Grafana | Ilimitado | Volume persistente |

## Troubleshooting

### Prometheus nao coleta metricas

1. Verificar se o target esta UP: http://localhost:9090/targets
2. Verificar conectividade de rede
3. Verificar se o endpoint /metrics existe

### Grafana nao mostra dados

1. Verificar datasource: Settings > Data Sources
2. Testar query no Prometheus diretamente
3. Verificar intervalo de tempo no dashboard

### Alertas nao disparam

1. Verificar regras: http://localhost:9090/rules
2. Verificar Alertmanager: http://localhost:9093
3. Verificar logs do Alertmanager

---

**Documento:** deploy/monitoring/README.md
**Ultima Atualizacao:** Janeiro 2026
