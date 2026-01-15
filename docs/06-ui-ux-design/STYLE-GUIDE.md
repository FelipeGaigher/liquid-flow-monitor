# Guia de Estilo - Liquid Flow Monitor

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Projeto** | Liquid Flow Monitor (TankControl) |
| **Documento** | Guia de Estilo |
| **Versao** | 1.0 |
| **Data** | Janeiro 2026 |

## 1. Identidade Visual

### 1.1 Nome do Produto

- **Nome Completo**: Liquid Flow Monitor
- **Nome UI**: TankControl
- **Abreviacao**: LFM

### 1.2 Logo

O logo utiliza tipografia simples com icone de gota/tanque estilizado.

## 2. Cores

### 2.1 Paleta Principal

| Nome | Light Mode | Dark Mode | Uso |
|------|------------|-----------|-----|
| Primary | `#0f172a` | `#f8fafc` | Texto principal, CTAs |
| Secondary | `#64748b` | `#94a3b8` | Texto secundario |
| Background | `#ffffff` | `#0f172a` | Fundo da pagina |
| Card | `#ffffff` | `#1e293b` | Fundo de cards |
| Border | `#e2e8f0` | `#334155` | Bordas e divisores |

### 2.2 Cores de Status

| Status | Cor | Hex | Uso |
|--------|-----|-----|-----|
| Success | Verde | `#22c55e` | Operacao bem-sucedida |
| Warning | Amarelo | `#eab308` | Alertas de atencao |
| Danger | Vermelho | `#ef4444` | Erros, critico |
| Info | Azul | `#3b82f6` | Informativo |

### 2.3 Cores de Graficos

```css
--chart-1: #3b82f6;  /* Azul - Alcool */
--chart-2: #f97316;  /* Laranja - Cachaca */
--chart-3: #22c55e;  /* Verde - Lucro */
--chart-4: #a855f7;  /* Roxo - Margem */
--chart-5: #06b6d4;  /* Ciano - Auxiliar */
```

### 2.4 Cores de Tanque (Status)

| Status | Cor | Condicao |
|--------|-----|----------|
| Normal | `#22c55e` (Verde) | Volume >= 1.5x minimo |
| Warning | `#eab308` (Amarelo) | Minimo <= Volume < 1.5x minimo |
| Critical | `#ef4444` (Vermelho) | Volume < minimo |

## 3. Tipografia

### 3.1 Familia de Fontes

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### 3.2 Escala Tipografica

| Elemento | Tamanho | Peso | Line Height |
|----------|---------|------|-------------|
| H1 | 30px | 700 | 36px |
| H2 | 24px | 600 | 32px |
| H3 | 20px | 600 | 28px |
| H4 | 16px | 600 | 24px |
| Body | 14px | 400 | 20px |
| Small | 12px | 400 | 16px |
| Caption | 11px | 400 | 14px |

### 3.3 Uso

- **Titulos (H1-H4)**: Cabecalhos de secoes, paginas
- **Body**: Texto geral, paragrafos
- **Small**: Labels, legendas
- **Caption**: Notas, rodapes

## 4. Espacamento

### 4.1 Escala de Espacamento

```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
```

### 4.2 Uso de Espacamento

| Contexto | Espacamento |
|----------|-------------|
| Entre icone e texto | 8px |
| Entre campos de form | 16px |
| Padding de card | 16px-24px |
| Gap entre cards | 16px-24px |
| Margin de secoes | 24px-32px |

## 5. Componentes

### 5.1 Botoes

#### Variantes

| Variante | Uso | Estilo |
|----------|-----|--------|
| Primary | Acao principal | Fundo solido, cor primaria |
| Secondary | Acao secundaria | Fundo transparente, borda |
| Destructive | Acoes perigosas | Fundo vermelho |
| Ghost | Acoes sutis | Sem fundo, hover destacado |

#### Tamanhos

| Tamanho | Height | Padding | Font |
|---------|--------|---------|------|
| sm | 32px | 12px | 12px |
| default | 40px | 16px | 14px |
| lg | 48px | 24px | 16px |

#### Estados

```
Normal -> Hover (+brilho) -> Focus (ring) -> Active (pressed) -> Disabled (opacity 0.5)
```

### 5.2 Cards

```
+------------------------+
|  Card                  |
|  - border-radius: 8px  |
|  - padding: 16-24px    |
|  - shadow: sm          |
|  - bg: card            |
+------------------------+
```

### 5.3 Inputs

| Estado | Estilo |
|--------|--------|
| Default | Borda cinza |
| Focus | Borda primaria + ring |
| Error | Borda vermelha |
| Disabled | Fundo cinza, opacity |

### 5.4 Badges

| Tipo | Cor | Uso |
|------|-----|-----|
| Default | Cinza | Status neutro |
| Primary | Azul | Destaque |
| Success | Verde | Positivo, ativo |
| Warning | Amarelo | Atencao |
| Destructive | Vermelho | Erro, inativo |

### 5.5 Tabelas

```
+------------------+------------------+------------------+
| Header           | Header           | Header           |  <- bg: muted
+------------------+------------------+------------------+
| Cell             | Cell             | Cell             |
+------------------+------------------+------------------+  <- border-bottom
| Cell             | Cell             | Cell             |
+------------------+------------------+------------------+
```

## 6. Icones

### 6.1 Biblioteca

- **Lucide React**: Biblioteca principal de icones
- Tamanho padrao: 20x20px
- Stroke width: 2px

### 6.2 Icones por Contexto

| Contexto | Icone | Nome |
|----------|-------|------|
| Dashboard | LayoutDashboard | LayoutDashboard |
| Tanques | Container | Container |
| Movimentacoes | ArrowLeftRight | ArrowLeftRight |
| Precos | DollarSign | DollarSign |
| Relatorios | FileText | FileText |
| Admin | Users | Users |
| Config | Settings | Settings |
| Entrada | ArrowDown | ArrowDownCircle |
| Saida | ArrowUp | ArrowUpCircle |
| Alerta | AlertTriangle | AlertTriangle |
| Sucesso | Check | CheckCircle |
| Erro | X | XCircle |

## 7. Layout

### 7.1 Estrutura Geral

```
+------+------------------------------------------+
|      |           Topbar (64px)                  |
|      +------------------------------------------+
|      |                                          |
| Side |           Content Area                   |
| bar  |           (padding: 24px)                |
| 240px|                                          |
|      |                                          |
|      |                                          |
+------+------------------------------------------+
```

### 7.2 Breakpoints

| Nome | Min Width | Colunas |
|------|-----------|---------|
| sm | 640px | 1-2 |
| md | 768px | 2-3 |
| lg | 1024px | 3-4 |
| xl | 1280px | 4-6 |
| 2xl | 1536px | 6+ |

### 7.3 Grid de Cards

```css
/* Cards de KPI */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 16px;

/* Cards de Tanques */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 24px;
```

## 8. Animacoes

### 8.1 Transicoes

| Elemento | Duracao | Easing |
|----------|---------|--------|
| Hover | 150ms | ease-out |
| Focus | 200ms | ease-in-out |
| Modal | 200ms | ease-out |
| Toast | 300ms | ease-out |

### 8.2 Animacoes

```css
/* Entrada de modal */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Accordion */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
```

## 9. Acessibilidade

### 9.1 Contraste

- Texto normal: minimo 4.5:1
- Texto grande: minimo 3:1
- Componentes interativos: minimo 3:1

### 9.2 Focus

- Todos os elementos interativos devem ter indicador de focus visivel
- Ring de focus: 2px, offset 2px, cor primaria

### 9.3 Teclado

- Tab: navegacao entre elementos
- Enter/Space: ativacao
- Escape: fechar modais/dropdowns
- Arrow keys: navegacao em menus

## 10. Dark Mode

### 10.1 Implementacao

- Classe `dark` no elemento `<html>`
- Variantes Tailwind: `dark:bg-slate-900`
- Persistencia em localStorage

### 10.2 Cores Invertidas

| Elemento | Light | Dark |
|----------|-------|------|
| Background | white | slate-950 |
| Card | white | slate-900 |
| Text | slate-900 | slate-50 |
| Border | slate-200 | slate-800 |

## 11. Responsividade

### 11.1 Mobile First

```css
/* Base: mobile */
.container { padding: 16px; }

/* md: tablet */
@media (min-width: 768px) {
  .container { padding: 24px; }
}

/* lg: desktop */
@media (min-width: 1024px) {
  .container { padding: 32px; }
}
```

### 11.2 Adaptacoes Mobile

- Sidebar colapsavel
- Tabelas com scroll horizontal
- Graficos redimensionaveis
- Touch targets: minimo 44x44px

---

**Documento:** STYLE-GUIDE.md
**Ultima Atualizacao:** Janeiro 2026
