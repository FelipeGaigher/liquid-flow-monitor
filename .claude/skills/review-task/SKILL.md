---
name: review-task
description: Analisa arquivo de tarefas do projeto, detecta inconsistências (tarefas feitas mas não marcadas), gera relatório de status e recomenda próximas ações. Use para revisar progresso do projeto.
allowed-tools: Read, Edit, Glob, Grep
---

# Revisar Status das Tarefas

Analise o arquivo de tarefas do projeto e gere um relatório de status.

---

## Instruções de Revisão

### 1. Detecção de Contexto do Projeto

Identifique o tipo de projeto para contextualizar a análise:

| Tipo | Indicadores |
|------|-------------|
| **Documentação** | `docs/` com `.md`, ausência de `src/`, casos de uso (UC-*) |
| **Código** | `src/`, `app/`, `lib/`, `package.json`, `composer.json` |
| **Misto** | Contém tanto `docs/` quanto código-fonte |

### 2. Localização do Arquivo de Tarefas

Procure na seguinte ordem:
1. `docs/tasks.md`
2. `tasks.md`
3. `TODO.md`
4. `docs/TODO.md`
5. `.github/TODO.md`
6. Issues do repositório (se aplicável)

### 3. Análise das Tarefas

Para cada tarefa identificada, verifique:

#### Status Possíveis
- 🔴 **Pendente**: Não iniciada
- 🟡 **Em Andamento**: Parcialmente concluída
- 🟢 **Concluída**: Finalizada
- ⏸️ **Bloqueada**: Aguardando dependência
- ❌ **Cancelada**: Não será feita

#### Checklist de Análise
- [ ] Identificar todas as tarefas e subtarefas
- [ ] Verificar status marcado vs status real
- [ ] Detectar inconsistências (feito mas não marcado)
- [ ] Identificar dependências entre tarefas
- [ ] Calcular progresso por categoria/prioridade

### 4. Detecção de Inconsistências

**CRÍTICO**: Procure por tarefas que foram executadas mas não marcadas:

#### Para Projetos de Documentação:
```
SE tarefa pede "Criar UC-XXX-NNN"
E arquivo UC-XXX-NNN.md existe em Docs/
E arquivo está completo (não tem TODOs)
ENTÃO tarefa deve ser marcada como concluída
```

#### Para Projetos de Código:
```
SE tarefa pede "Implementar feature X"
E código da feature existe
E testes passam (se existirem)
ENTÃO tarefa deve ser marcada como concluída
```

### 5. Ações Automáticas

Ao identificar inconsistências:

1. **Liste as evidências** de que a tarefa foi concluída
2. **Atualize o arquivo de tarefas** marcando como [x]
3. **Documente no relatório** as tarefas finalizadas nesta sessão

### 6. Priorização de Próximas Tarefas

Ordene tarefas pendentes por:
1. **Prioridade** (P0 > P1 > P2 > P3)
2. **Dependências** (sem bloqueios primeiro)
3. **Impacto** (maior valor de negócio)

---

## Formato do Relatório

```markdown
# 📊 Relatório de Status das Tarefas

**Data:** [YYYY-MM-DD]
**Projeto:** [nome do projeto]
**Tipo:** [Documentação/Código/Misto]
**Arquivo de Tarefas:** [caminho]

---

## 📈 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de Tarefas | X |
| ✅ Concluídas | X (X%) |
| 🔄 Finalizadas Nesta Sessão | X |
| 🟡 Em Progresso | X (X%) |
| 🔴 Pendentes | X (X%) |
| ⏸️ Bloqueadas | X (X%) |

---

## 🔄 Tarefas Finalizadas Nesta Sessão

> Tarefas identificadas como completas e marcadas automaticamente

### [TASK-ID]: [Nome]
- **Evidências:**
  - ✓ Arquivo criado: `path/to/file`
  - ✓ Conteúdo completo
- **Ação:** Status atualizado para 🟢

---

## ✅ Tarefas Concluídas

| Prioridade | ID | Descrição |
|------------|-----|-----------|
| P0 | TASK-001 | Descrição... |

---

## 🟡 Tarefas Em Progresso

### [TASK-ID]: [Nome]
- **Progresso:** ~X%
- **Concluído:**
  - [x] Subtarefa 1
  - [x] Subtarefa 2
- **Pendente:**
  - [ ] Subtarefa 3

---

## 🔴 Tarefas Pendentes - Prontas para Iniciar

### Top 3 Recomendadas

#### 1️⃣ [TASK-ID]: [Nome]
- **Prioridade:** P0
- **Dependências:** ✅ Nenhuma
- **Justificativa:** [por que começar agora]
- **Comando:** `/execute-task [TASK-ID]`

#### 2️⃣ [TASK-ID]: [Nome]
[mesmo formato]

#### 3️⃣ [TASK-ID]: [Nome]
[mesmo formato]

---

## ⏸️ Tarefas Bloqueadas

### [TASK-ID]: [Nome]
- **Bloqueada por:** [TASK-ID da dependência]
- **Para desbloquear:** Concluir [descrição]

---

## 📊 Progresso por Categoria

| Categoria | Total | Concluídas | % |
|-----------|-------|------------|---|
| Documentação | X | X | X% |
| Código | X | X | X% |
| Testes | X | X | X% |
| Infraestrutura | X | X | X% |

---

## 📊 Progresso por Prioridade

| Prioridade | Total | Concluídas | Pendentes | % |
|------------|-------|------------|-----------|---|
| P0 - Crítica | X | X | X | X% |
| P1 - Alta | X | X | X | X% |
| P2 - Média | X | X | X | X% |
| P3 - Baixa | X | X | X | X% |

---

## 🎯 Recomendações

### Ações Imediatas
1. **[Ação]** - `/execute-task [ID]`
2. **[Ação]** - `/execute-task [ID]`

### Observações
- [Ponto positivo ou de atenção]
- [Sugestão de melhoria]

---

## 💡 Conclusão

[Resumo do status geral e próximos passos recomendados]

---

**Comandos Úteis:**
- `/execute-task [TASK-ID]` - Executar tarefa específica
- `/review-task` - Atualizar este relatório
```

---

## Checklist de Revisão

Antes de finalizar o relatório:

- [ ] Li completamente o arquivo de tarefas
- [ ] Identifiquei TODAS as tarefas e status
- [ ] Verifiquei evidências de trabalho concluído
- [ ] Marquei tarefas finalizadas mas não registradas
- [ ] Analisei dependências entre tarefas
- [ ] Priorizei tarefas pendentes
- [ ] Forneci top 3 recomendações acionáveis
- [ ] Relatório está claro e objetivo

---

**EXECUTE AGORA A REVISÃO**

1. Detecte o contexto do projeto
2. Localize o arquivo de tarefas
3. Analise todas as tarefas
4. Identifique e corrija inconsistências
5. Gere relatório completo
6. Sugira próximos passos