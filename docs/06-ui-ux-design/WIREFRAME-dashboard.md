# Wireframe - Dashboard

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Tela** | Dashboard |
| **Rota** | /dashboard, / |
| **Documento** | Wireframe |
| **Versao** | 1.0 |

## 1. Visao Geral

O Dashboard e a tela principal do sistema, apresentando uma visao consolidada de KPIs, graficos de analise e status dos tanques.

## 2. Wireframe - Desktop

```
+------------------------------------------------------------------+
|  [Logo] TankControl                    [Filtros] [Tema] [Usuario] |
+--------+---------------------------------------------------------+
|        |                                                          |
| MENU   |  DASHBOARD                                               |
|        |                                                          |
| > Dash |  +------------+ +------------+ +------------+            |
|   Tank |  | Faturamento| |   Volume   | |    COGS    |            |
|   Mov  |  | R$ 125.430 | |  45.230 L  | | R$ 89.200  |            |
|   Prec |  |   +12.5%   | |   +8.3%    | |   +5.2%    |            |
|   Rel  |  +------------+ +------------+ +------------+            |
|   Adm  |                                                          |
|   Conf |  +------------+ +------------+ +------------+            |
|        |  |   Lucro    | |   Margem   | |Ticket Medio|            |
|        |  | R$ 36.230  | |   28.9%    | | R$ 1.254   |            |
|        |  |   +18.2%   | |  +2.1 pp   | |   +3.4%    |            |
|        |  +------------+ +------------+ +------------+            |
|        |                                                          |
|        |  +------------------------+ +-------------------------+  |
|        |  |  VENDAS POR PRODUTO    | |  FATURAMENTO TEMPORAL   |  |
|        |  |                        | |                         |  |
|        |  |      [PIE CHART]       | |      [LINE CHART]       |  |
|        |  |                        | |                         |  |
|        |  |  O Alcool   O Cachaca  | |  Jan  Fev  Mar  Abr     |  |
|        |  +------------------------+ +-------------------------+  |
|        |                                                          |
|        |  +------------------------+ +-------------------------+  |
|        |  |  TOP 5 TANQUES         | |   LUCRO VS MARGEM       |  |
|        |  |                        | |                         |  |
|        |  |      [BAR CHART]       | |   [BAR + LINE CHART]    |  |
|        |  |                        | |                         |  |
|        |  +------------------------+ +-------------------------+  |
|        |                                                          |
|        |  TANQUES                                                 |
|        |  +----------+ +----------+ +----------+ +----------+     |
|        |  | TANK-01  | | TANK-02  | | TANK-03  | | TANK-04  |     |
|        |  | Alcool   | | Cachaca  | | Cachaca  | | Alcool   |     |
|        |  | [======] | | [====  ] | | [==    ] | | [=======]|     |
|        |  |   85%    | |   55%    | |   22%    | |   95%    |     |
|        |  | [+] [-]  | | [+] [-]  | | [+] [-]  | | [+] [-]  |     |
|        |  +----------+ +----------+ +----------+ +----------+     |
|        |                                                          |
+--------+----------------------------------------------------------+
```

## 3. Wireframe - Mobile

```
+---------------------------+
| [=] TankControl   [O] [@] |
+---------------------------+
|                           |
|  DASHBOARD                |
|                           |
|  +---------------------+  |
|  | Faturamento         |  |
|  | R$ 125.430  +12.5%  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Volume Vendido      |  |
|  | 45.230 L    +8.3%   |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | Lucro               |  |
|  | R$ 36.230   +18.2%  |  |
|  +---------------------+  |
|                           |
|  [Ver mais KPIs v]        |
|                           |
|  +---------------------+  |
|  |  VENDAS/PRODUTO     |  |
|  |    [PIE CHART]      |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  |  FATURAMENTO        |  |
|  |   [LINE CHART]      |  |
|  +---------------------+  |
|                           |
|  TANQUES                  |
|                           |
|  +---------------------+  |
|  | TANK-01    Alcool   |  |
|  | [================]  |  |
|  | 85%      R$ 51.000  |  |
|  | [Entrada]  [Saida]  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | TANK-02    Cachaca  |  |
|  | [===========     ]  |  |
|  | 55%      R$ 44.000  |  |
|  | [Entrada]  [Saida]  |  |
|  +---------------------+  |
|                           |
+---------------------------+
```

## 4. Componentes

### 4.1 KPI Card

```
+------------------------+
|  [icon]  Titulo        |
|                        |
|  R$ 125.430,00         |  <- Valor principal (24px, bold)
|                        |
|  [^] +12.5%            |  <- Variacao (verde/vermelho)
|  vs periodo anterior   |  <- Label (12px, muted)
+------------------------+
```

### 4.2 Tank Card

```
+------------------------+
|  TANQUE-01             |  <- Nome
|  Alcool | Sao Paulo    |  <- Produto | Site
|                        |
|  [================  ]  |  <- Barra de progresso
|  85% (17.000 L)        |  <- Percentual e volume
|  Cap: 20.000 L         |  <- Capacidade
|                        |
|  Valor: R$ 59.500      |  <- Valor estimado
|                        |
|  [+ Entrada] [- Saida] |  <- Acoes rapidas
+------------------------+
```

### 4.3 Filtros Globais

```
+--------------------------------------------------+
| Periodo: [Ultimo Mes v]  Produto: [Todos v]      |
| Tanque: [Todos v]  Site: [Todos v]               |
| Operador: [Todos v]  Tipo: [Todos v]             |
+--------------------------------------------------+
```

## 5. Interacoes

### 5.1 KPI Cards

- Hover: Destaque sutil
- Click: Navega para pagina relacionada (opcional)

### 5.2 Graficos

- Hover: Tooltip com valores
- Click: Drill-down (opcional)
- Responsivo: Redimensiona com container

### 5.3 Tank Cards

- Click em Entrada: Abre modal pre-configurado
- Click em Saida: Abre modal pre-configurado
- Click no card: Detalhes do tanque (opcional)

### 5.4 Filtros

- Mudanca: Recarrega todos os dados
- Persistencia: Mantido durante sessao

## 6. Estados

### 6.1 Loading

```
+------------------------+
|  [Skeleton]            |
|  [Skeleton]            |
|  [Skeleton]            |
+------------------------+
```

### 6.2 Sem Dados

```
+------------------------+
|                        |
|  [Icone vazio]         |
|                        |
|  Nenhum dado           |
|  encontrado            |
|                        |
|  Ajuste os filtros     |
|  ou registre operacoes |
|                        |
+------------------------+
```

### 6.3 Erro

```
+------------------------+
|                        |
|  [Icone erro]          |
|                        |
|  Erro ao carregar      |
|                        |
|  [Tentar novamente]    |
|                        |
+------------------------+
```

## 7. Responsividade

| Breakpoint | Layout |
|------------|--------|
| < 640px | 1 coluna, KPIs empilhados |
| 640-1024px | 2 colunas |
| > 1024px | 3 colunas KPIs, 2 graficos |

---

**Documento:** WIREFRAME-dashboard.md
**Ultima Atualizacao:** Janeiro 2026
