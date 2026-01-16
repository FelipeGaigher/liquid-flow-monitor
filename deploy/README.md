# Deploy - Liquid Flow Monitor

Guia completo para deploy do sistema em ambiente de producao.

## Indice

1. [Requisitos](#1-requisitos)
2. [Deploy com Docker Compose](#2-deploy-com-docker-compose)
3. [Deploy com Kubernetes](#3-deploy-com-kubernetes)
4. [Configuracao SSL](#4-configuracao-ssl)
5. [Backups](#5-backups)
6. [Monitoramento](#6-monitoramento)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Requisitos

### Hardware Minimo

| Componente | Desenvolvimento | Producao (Pequeno) | Producao (Medio) |
|------------|-----------------|---------------------|-------------------|
| CPU | 2 cores | 2 cores | 4 cores |
| RAM | 4 GB | 4 GB | 8 GB |
| Disco | 20 GB | 50 GB SSD | 100 GB SSD |

### Software

- Docker 24.0+
- Docker Compose 2.20+
- Node.js 20 LTS (para build local)
- PostgreSQL 16 (ou usar container)

---

## 2. Deploy com Docker Compose

### 2.1 Preparacao

```bash
# Clonar repositorio
git clone https://github.com/seu-org/liquid-flow-monitor.git
cd liquid-flow-monitor

# Copiar template de variaveis
cp .env.production.example .env.production

# Editar variaveis (OBRIGATORIO!)
nano .env.production
```

### 2.2 Variaveis Obrigatorias

```bash
# Gerar secrets seguros
openssl rand -hex 64  # Para JWT_SECRET
openssl rand -hex 64  # Para JWT_REFRESH_SECRET
openssl rand -hex 32  # Para DB_PASSWORD
```

Edite `.env.production` e substitua:
- `DOMAIN` - Seu dominio
- `DB_PASSWORD` - Senha forte do banco
- `JWT_SECRET` - Chave JWT gerada
- `JWT_REFRESH_SECRET` - Chave refresh gerada

### 2.3 Build e Deploy

```bash
# Build do frontend
npm ci
npm run build

# Build e start dos containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 2.4 Migracao do Banco

```bash
# Executar migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate

# (Opcional) Popular dados iniciais
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### 2.5 Verificar Deploy

```bash
# Health check
curl http://localhost/health

# Ou usar o script
./deploy/scripts/health-check.sh
```

---

## 3. Deploy com Kubernetes

### 3.1 Preparacao

```bash
# Criar namespace
kubectl apply -f deploy/k8s/namespace.yaml

# Criar secrets (substitua os valores!)
kubectl create secret generic lfm-secrets \
  --from-literal=DB_USER=lfm_prod_user \
  --from-literal=DB_PASSWORD=SUA_SENHA_AQUI \
  --from-literal=JWT_SECRET=SEU_JWT_SECRET \
  --from-literal=JWT_REFRESH_SECRET=SEU_REFRESH_SECRET \
  -n liquid-flow-monitor

# Ou usar arquivo
kubectl apply -f deploy/k8s/secret.yaml
```

### 3.2 Deploy

```bash
# Aplicar todos os manifests
kubectl apply -f deploy/k8s/

# Ou individualmente
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml
kubectl apply -f deploy/k8s/ingress.yaml

# Verificar status
kubectl get pods -n liquid-flow-monitor
kubectl get svc -n liquid-flow-monitor
```

### 3.3 Configurar Ingress

Edite `deploy/k8s/ingress.yaml` e substitua `YOUR_DOMAIN` pelo seu dominio.

```bash
# Instalar NGINX Ingress Controller (se necessario)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Aplicar ingress
kubectl apply -f deploy/k8s/ingress.yaml
```

---

## 4. Configuracao SSL

### 4.1 Let's Encrypt (Recomendado)

#### Com Certbot (Docker Compose)

```bash
# Criar diretorio para certificados
mkdir -p deploy/nginx/ssl

# Instalar certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem deploy/nginx/ssl/
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem deploy/nginx/ssl/

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### Com Cert-Manager (Kubernetes)

```bash
# Instalar cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Criar ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: seu-email@dominio.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Descomentar anotacao no ingress.yaml:
# cert-manager.io/cluster-issuer: "letsencrypt-prod"

kubectl apply -f deploy/k8s/ingress.yaml
```

### 4.2 Certificado Proprio

Copie seus certificados para `deploy/nginx/ssl/`:
- `fullchain.pem` - Certificado + intermediarios
- `privkey.pem` - Chave privada

---

## 5. Backups

### 5.1 Backup Manual

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml exec backup /backup.sh --manual

# Kubernetes
kubectl exec -it postgres-0 -n liquid-flow-monitor -- pg_dump -U lfm_prod_user liquid_flow_monitor > backup.sql
```

### 5.2 Backup Automatico

O servico de backup executa automaticamente as 2h da manha.

```bash
# Ativar servico de backup (Docker Compose)
docker-compose -f docker-compose.prod.yml --profile backup up -d

# Verificar backups
docker-compose -f docker-compose.prod.yml exec backup ls -la /backups/
```

### 5.3 Restore

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml exec backup /restore.sh /backups/lfm_backup_YYYYMMDD.sql.gz

# Kubernetes
kubectl exec -it postgres-0 -n liquid-flow-monitor -- psql -U lfm_prod_user -d liquid_flow_monitor < backup.sql
```

### 5.4 Retencao

Por padrao, backups sao mantidos por 30 dias. Configure `BACKUP_RETENTION_DAYS` para alterar.

---

## 6. Monitoramento

### 6.1 Health Check

```bash
# Script de health check
./deploy/scripts/health-check.sh

# Output JSON (para integracao)
./deploy/scripts/health-check.sh --json
```

### 6.2 Logs

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Kubernetes
kubectl logs -f deployment/lfm-backend -n liquid-flow-monitor
```

### 6.3 Metricas

Endpoints disponiveis:
- `/health` - Health check basico
- `/api/health` - Health check detalhado (autenticado)

---

## 7. Troubleshooting

### 7.1 Container nao inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend

# Verificar variaveis de ambiente
docker-compose -f docker-compose.prod.yml exec backend env

# Verificar conexao com banco
docker-compose -f docker-compose.prod.yml exec backend npm run db:test
```

### 7.2 Erro de conexao com banco

```bash
# Verificar se postgres esta rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Verificar logs do postgres
docker-compose -f docker-compose.prod.yml logs postgres

# Testar conexao
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### 7.3 SSL nao funciona

```bash
# Verificar certificados
ls -la deploy/nginx/ssl/

# Verificar configuracao nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Verificar logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### 7.4 Erro 502 Bad Gateway

```bash
# Verificar se backend esta rodando
docker-compose -f docker-compose.prod.yml ps backend

# Verificar logs do backend
docker-compose -f docker-compose.prod.yml logs backend

# Verificar conectividade
docker-compose -f docker-compose.prod.yml exec nginx curl http://backend:3000/health
```

---

## Comandos Uteis

```bash
# Reiniciar servicos
docker-compose -f docker-compose.prod.yml restart

# Atualizar para nova versao
git pull
npm ci && npm run build
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Remover volumes (CUIDADO: apaga dados!)
docker-compose -f docker-compose.prod.yml down -v

# Ver uso de recursos
docker stats
```

---

**Documento:** deploy/README.md
**Ultima Atualizacao:** Janeiro 2026
