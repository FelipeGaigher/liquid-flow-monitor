# TC-001: Casos de Teste - Movimentacoes

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **ID** | TC-001 |
| **Funcionalidade** | Registro de Movimentacoes |
| **Versao** | 1.0 |
| **Prioridade** | Critica |

## 1. Casos de Teste

### TC-001-01: Registrar entrada valida

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar registro de entrada de produto |
| **Pre-condicoes** | Usuario autenticado, tanque ativo com capacidade disponivel |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Acessar Dashboard ou pagina Tanques | Pagina carregada |
| 2 | Clicar em "Entrada" no card do tanque | Modal de movimentacao abre |
| 3 | Verificar tanque pre-selecionado | Tanque correto selecionado |
| 4 | Informar volume: 1000 L | Preview atualiza corretamente |
| 5 | Informar custo por litro: R$ 2,00 (opcional) | Custo total calculado |
| 6 | Clicar em "Confirmar" | Movimentacao registrada |
| 7 | Verificar toast de sucesso | "Movimentacao registrada" |
| 8 | Verificar volume do tanque | Volume aumentou 1000 L |

**Dados de Teste:**

```json
{
  "tank_id": "TANK-01",
  "type": "entrada",
  "volume_l": 1000,
  "cost_per_l": 2.00
}
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-02: Registrar saida valida

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar registro de saida com calculo de valor |
| **Pre-condicoes** | Usuario autenticado, tanque com saldo suficiente |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Clicar em "Saida" no card do tanque | Modal abre com tipo "saida" |
| 2 | Verificar preco sugerido | Preco vigente carregado |
| 3 | Informar volume: 500 L | Preview mostra volume apos |
| 4 | Confirmar ou ajustar preco | Valor total calculado |
| 5 | Clicar em "Confirmar" | Movimentacao registrada |
| 6 | Verificar valores calculados | Valor, custo e lucro corretos |

**Calculos Esperados:**

```
Volume: 500 L
Preco: R$ 3,50/L
Custo: R$ 2,10/L (se informado)

Valor Total: 500 * 3,50 = R$ 1.750,00
Custo Total: 500 * 2,10 = R$ 1.050,00
Lucro: 1.750 - 1.050 = R$ 700,00
```

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-03: Bloquear saida com saldo insuficiente

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar bloqueio de saida maior que saldo |
| **Pre-condicoes** | Tanque com 1000 L de saldo |
| **Prioridade** | Critica |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Selecionar tanque com 1000 L | Tanque selecionado |
| 2 | Selecionar tipo "Saida" | Formulario de saida |
| 3 | Informar volume: 2000 L | Preview mostra saldo negativo |
| 4 | Clicar em "Confirmar" | Botao desabilitado OU erro |
| 5 | Verificar mensagem | "Saldo insuficiente. Disponivel: 1000 L" |
| 6 | Verificar volume do tanque | Permanece 1000 L |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-04: Bloquear entrada que excede capacidade

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar bloqueio de entrada acima da capacidade |
| **Pre-condicoes** | Tanque com 15000/20000 L |
| **Prioridade** | Critica |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Selecionar tanque (15000/20000 L) | Disponivel: 5000 L |
| 2 | Selecionar tipo "Entrada" | Formulario de entrada |
| 3 | Informar volume: 10000 L | Preview mostra excesso |
| 4 | Clicar em "Confirmar" | Erro exibido |
| 5 | Verificar mensagem | "Capacidade excedida. Disponivel: 5000 L" |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-05: Saida sem preco deve ser bloqueada

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar obrigatoriedade de preco em saida |
| **Pre-condicoes** | Tanque com saldo |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Selecionar tipo "Saida" | Campo preco exibido |
| 2 | Informar volume: 500 L | Volume preenchido |
| 3 | Deixar preco vazio ou zero | - |
| 4 | Clicar em "Confirmar" | Erro de validacao |
| 5 | Verificar mensagem | "Preco obrigatorio para saida" |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-06: Registrar ajuste positivo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar ajuste que aumenta volume |
| **Pre-condicoes** | Tanque com saldo |
| **Prioridade** | Media |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Selecionar tipo "Ajuste" | Campos financeiros ocultos |
| 2 | Informar volume: +500 L | Preview mostra aumento |
| 3 | Adicionar nota: "Inventario" | Nota registrada |
| 4 | Clicar em "Confirmar" | Ajuste registrado |
| 5 | Verificar volume | Aumentou 500 L |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-07: Registrar ajuste negativo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar ajuste que reduz volume |
| **Pre-condicoes** | Tanque com saldo suficiente |
| **Prioridade** | Media |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Selecionar tipo "Ajuste" | Formulario de ajuste |
| 2 | Informar volume: -200 L | Preview mostra reducao |
| 3 | Adicionar nota: "Correcao" | Nota registrada |
| 4 | Clicar em "Confirmar" | Ajuste registrado |
| 5 | Verificar volume | Reduziu 200 L |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-08: Movimentacao em tanque inativo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar bloqueio de operacao em tanque inativo |
| **Pre-condicoes** | Tanque com status "inactive" ou "maintenance" |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Tentar selecionar tanque inativo | Tanque nao listado OU desabilitado |
| 2 | Verificar mensagem (se exibida) | "Tanque indisponivel" |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-09: Calculo correto de KPIs apos movimentacao

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar atualizacao de KPIs apos saida |
| **Pre-condicoes** | Dashboard visivel, KPIs carregados |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Anotar valores atuais dos KPIs | Valores registrados |
| 2 | Registrar saida de 500L a R$3,50 | Saida registrada |
| 3 | Verificar Faturamento | Aumentou R$ 1.750 |
| 4 | Verificar Volume | Aumentou 500 L |
| 5 | Verificar Lucro | Aumentou conforme calculo |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

---

### TC-001-10: Registro de operador correto

| Campo | Valor |
|-------|-------|
| **Objetivo** | Validar que operador logado e registrado |
| **Pre-condicoes** | Usuario "operador@test.com" logado |
| **Prioridade** | Alta |

**Passos:**

| # | Acao | Resultado Esperado |
|---|------|-------------------|
| 1 | Registrar movimentacao | Movimentacao criada |
| 2 | Consultar historico | Movimentacao listada |
| 3 | Verificar campo "Operador" | Nome do usuario logado |

**Status:** [ ] Passou [ ] Falhou [ ] Bloqueado

## 2. Resumo

| Total | Passou | Falhou | Bloqueado | Nao Executado |
|-------|--------|--------|-----------|---------------|
| 10 | - | - | - | 10 |

---

**Documento:** TC-001-movimentacoes.md
**Ultima Atualizacao:** Janeiro 2026
