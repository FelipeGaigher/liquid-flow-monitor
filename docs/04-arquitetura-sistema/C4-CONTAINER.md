# Diagrama C4 - Nivel 2: Container

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Projeto** | Liquid Flow Monitor |
| **Nivel** | C4 Container (Nivel 2) |
| **Versao** | 1.0 |
| **Data** | Janeiro 2026 |

## 1. Visao de Containers

Este diagrama detalha os containers (aplicacoes, bancos de dados, etc.) que compoem o sistema Liquid Flow Monitor.

## 2. Diagrama de Containers

```mermaid
C4Container
    title Diagrama de Containers - Liquid Flow Monitor

    Person(user, "Usuario", "Admin, Operador ou Visualizador")

    System_Boundary(lfm, "Liquid Flow Monitor") {
        Container(spa, "Single Page Application", "React, TypeScript", "Interface web responsiva para interacao com o sistema")
        Container(api, "API Backend", "Node.js/Python/Go", "API REST para logica de negocio e acesso a dados")
        ContainerDb(db, "Banco de Dados", "PostgreSQL", "Armazena usuarios, tanques, movimentacoes e configuracoes")
        Container(cache, "Cache", "Redis", "Cache de sessoes e dados frequentes")
    }

    System_Ext(email, "Servico de Email", "SMTP")
    System_Ext(cdn, "CDN", "Assets estaticos")

    Rel(user, spa, "Acessa", "HTTPS")
    Rel(spa, api, "Consome", "HTTPS/JSON")
    Rel(spa, cdn, "Carrega assets", "HTTPS")
    Rel(api, db, "Le/Escreve", "TCP/SSL")
    Rel(api, cache, "Armazena sessoes", "TCP")
    Rel(api, email, "Envia alertas", "SMTP")
```

## 3. Descricao dos Containers

### 3.1 Single Page Application (SPA)

| Aspecto | Especificacao |
|---------|---------------|
| **Tecnologia** | React 18, TypeScript, Vite |
| **Responsabilidade** | Interface do usuario, roteamento client-side |
| **Hospedagem** | CDN / Static Hosting (Vercel, Netlify, S3) |
| **Build** | Bundle otimizado, code splitting |

**Funcionalidades:**
- Dashboard com KPIs e graficos
- Gestao de tanques
- Registro de movimentacoes
- Consulta de historico
- Exportacao de relatorios

### 3.2 API Backend

| Aspecto | Especificacao |
|---------|---------------|
| **Tecnologia** | Node.js (Express/Fastify) ou Go ou Python (FastAPI) |
| **Responsabilidade** | Logica de negocio, validacoes, autenticacao |
| **Hospedagem** | Container (Docker), Cloud Run, ECS |
| **API Style** | REST (JSON) |

**Endpoints Principais:**
- `/auth/*` - Autenticacao
- `/tanks/*` - CRUD de tanques
- `/movements/*` - Movimentacoes
- `/prices/*` - Tabela de precos
- `/users/*` - Gestao de usuarios
- `/reports/*` - Relatorios

### 3.3 Banco de Dados

| Aspecto | Especificacao |
|---------|---------------|
| **Tecnologia** | PostgreSQL 14+ |
| **Responsabilidade** | Persistencia de dados |
| **Hospedagem** | RDS, Cloud SQL, Managed PostgreSQL |
| **Backup** | Diario, retencao 30 dias |

**Tabelas Principais:**
- `users`, `sites`, `tanks`
- `movements`, `price_lists`
- `audit_logs`, `settings`

### 3.4 Cache (Opcional)

| Aspecto | Especificacao |
|---------|---------------|
| **Tecnologia** | Redis |
| **Responsabilidade** | Cache de sessoes, rate limiting |
| **Hospedagem** | ElastiCache, Memorystore |
| **TTL** | Configuravel por tipo de dado |

**Usos:**
- Sessoes de usuario
- Cache de consultas frequentes
- Rate limiting
- Filas de processamento

## 4. Comunicacao entre Containers

### 4.1 Frontend -> Backend

```mermaid
sequenceDiagram
    participant SPA as React SPA
    participant API as API Backend
    participant DB as PostgreSQL

    SPA->>API: GET /api/tanks
    Note over SPA,API: Authorization: Bearer JWT
    API->>API: Valida JWT
    API->>DB: SELECT * FROM tanks
    DB->>API: Resultados
    API->>SPA: JSON Response
```

### 4.2 Formatos de Dados

| Comunicacao | Formato | Encoding |
|-------------|---------|----------|
| SPA <-> API | JSON | UTF-8 |
| API <-> DB | SQL | PostgreSQL Protocol |
| API <-> Cache | Binary | Redis Protocol |
| API <-> Email | MIME | SMTP |

## 5. Infraestrutura

### 5.1 Opcao 1: Cloud Simples

```mermaid
flowchart TB
    subgraph Cloud
        subgraph Frontend
            CDN[CDN/Static Host]
        end

        subgraph Backend
            API[API Container]
        end

        subgraph Database
            DB[(PostgreSQL)]
        end
    end

    Users[Usuarios] --> CDN
    CDN --> API
    API --> DB
```

### 5.2 Opcao 2: Cloud Escalavel

```mermaid
flowchart TB
    subgraph Cloud
        LB[Load Balancer]

        subgraph Frontend
            CDN[CDN]
        end

        subgraph Backend Cluster
            API1[API 1]
            API2[API 2]
            API3[API N]
        end

        subgraph Data
            DB[(PostgreSQL Primary)]
            DBR[(PostgreSQL Replica)]
            Cache[(Redis)]
        end
    end

    Users[Usuarios] --> CDN
    Users --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    API1 --> DB
    API1 --> Cache
    API2 --> DB
    API2 --> Cache
    DB --> DBR
```

## 6. Escalabilidade

| Container | Estrategia | Trigger |
|-----------|------------|---------|
| SPA | CDN global | Automatico |
| API | Horizontal (replicas) | CPU > 70%, Requests > N |
| DB | Vertical + Read Replicas | Conexoes, CPU |
| Cache | Cluster Redis | Memoria |

## 7. Resiliencia

### 7.1 Failover

| Componente | Estrategia |
|------------|------------|
| API | Multiple instances + Health checks |
| DB | Failover automatico (managed) |
| Cache | Fallback para DB |

### 7.2 Circuit Breaker

```mermaid
flowchart LR
    API[API] --> CB{Circuit Breaker}
    CB -->|Closed| Service[Servico Externo]
    CB -->|Open| Fallback[Fallback/Cache]
```

## 8. Seguranca por Container

| Container | Medidas |
|-----------|---------|
| SPA | CSP, SRI, HTTPS only |
| API | JWT, Rate Limit, Input Validation |
| DB | SSL, Firewall, Least Privilege |
| Cache | Auth, Network Isolation |

## 9. Monitoramento

| Aspecto | Ferramenta |
|---------|------------|
| APM | Datadog, New Relic |
| Logs | CloudWatch, Loki |
| Metricas | Prometheus, Grafana |
| Alertas | PagerDuty, OpsGenie |

---

**Documento:** C4-CONTAINER.md
**Ultima Atualizacao:** Janeiro 2026
