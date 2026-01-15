---
name: review-task
description: "Revisa o arquivo de tarefas do projeto, detecta inconsistencias (tarefas feitas mas nao marcadas), atualiza status e gera relatorio de progresso; use quando o usuario pedir uma revisao do andamento." 
---

# Revisar status das tarefas

Analisar o arquivo de tarefas do projeto e gerar um relatorio de status.

## Passos

1. Detectar o tipo de projeto (documentacao, codigo, misto).
2. Localizar o arquivo de tarefas:
   - `docs/tasks.md`
   - `tasks.md`
   - `TODO.md`
   - `docs/TODO.md`
   - `.github/TODO.md`
3. Listar tarefas e subtarefas, com status marcado.
4. Verificar inconsistencias (feito mas nao marcado) e corrigir.
5. Calcular progresso por categoria e prioridade.
6. Sugerir top 3 proximas tarefas.

## Deteccao de inconsistencias

- Documentacao: se o arquivo pedido existe e esta completo, marcar tarefa como concluida.
- Codigo: se a feature existe e testes passam (quando houver), marcar como concluida.

## Formato do relatorio

```markdown
# Relatorio de Status das Tarefas

**Data:** [YYYY-MM-DD]
**Projeto:** [nome do projeto]
**Tipo:** [Documentacao/Codigo/Misto]
**Arquivo de Tarefas:** [caminho]

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Total de Tarefas | X |
| Concluidas | X (X%) |
| Finalizadas Nesta Sessao | X |
| Em Progresso | X (X%) |
| Pendentes | X (X%) |
| Bloqueadas | X (X%) |

## Tarefas Finalizadas Nesta Sessao

- [TASK-ID]: evidencias e atualizacao

## Tarefas Concluidas

| Prioridade | ID | Descricao |
|-----------|----|-----------|
| P0 | TASK-001 | ... |

## Tarefas Em Progresso

- [TASK-ID]: progresso e subtarefas

## Pendentes - Top 3 Recomendadas

1. [TASK-ID]: justificativa e comando sugerido
2. [TASK-ID]
3. [TASK-ID]

## Bloqueadas

- [TASK-ID]: bloqueio e como destravar

## Progresso por Categoria

| Categoria | Total | Concluidas | % |
|----------|-------|------------|---|

## Progresso por Prioridade

| Prioridade | Total | Concluidas | Pendentes | % |
|-----------|-------|------------|-----------|---|

## Recomendacoes

- Acoes imediatas
- Observacoes

## Conclusao

Resumo do status geral e proximos passos.
```
