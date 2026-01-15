---
name: execute-task
description: "Executa tarefa do projeto seguindo fluxo estruturado de 9 etapas (analise, localizacao, planejamento, implementacao, testes, validacao, lint, conclusao, atualizacao); use quando o usuario pedir para implementar uma tarefa documentada e marcar como concluida." 
---

# Executar tarefa

Executar uma tarefa especifica do projeto seguindo o fluxo obrigatorio.

## Tarefa solicitada

$ARGUMENTS

## Fluxo obrigatorio de execucao

1. Analise
2. Localizacao
3. Planejamento
4. Implementacao
5. Testes
6. Validacao
7. Lint
8. Conclusao
9. Atualizacao

## Etapa 1: Analise

### 1.1 Detectar contexto

Identificar o tipo de projeto:
- **Documentacao**: `docs/` com `.md`, UC-*, ADRs, ausencia de `src/`
- **Codigo**: `src/`, `app/`, `package.json`, `composer.json`
- **Misto**: `docs/` + codigo-fonte

### 1.2 Leitura obrigatoria

Ler, se existirem:
- `README.md`
- `CLAUDE.md`
- `docs/` relevantes (tasks, casos de uso, arquitetura)

### 1.3 Checklist

- [ ] Tipo de projeto identificado
- [ ] README.md lido
- [ ] CLAUDE.md lido (se existir)
- [ ] Docs relevantes lidos
- [ ] Contexto compreendido

## Etapa 2: Localizacao

### 2.1 Encontrar arquivo de tarefas

Procurar nesta ordem:
1. `docs/tasks.md`
2. `tasks.md`
3. `TODO.md`
4. `docs/TODO.md`
5. `.github/TODO.md`

### 2.2 Identificar a tarefa

Extrair:
- ID da tarefa
- Descricao
- Subtarefas
- Prioridade
- Dependencias
- Dominio

### 2.3 Checklist

- [ ] Arquivo de tarefas encontrado
- [ ] Tarefa localizada
- [ ] Subtarefas identificadas
- [ ] Dependencias verificadas

## Etapa 3: Planejamento

### 3.1 Classificar tipo

- Documentacao
- Codigo
- Testes
- Infraestrutura

### 3.2 Definir escopo

Listar:
1. Arquivos a criar
2. Arquivos a modificar
3. Arquivos a consultar
4. Validacoes necessarias

### 3.3 Identificar padroes

- Nomenclatura
- Estrutura de arquivos
- Padroes de codigo/docs
- Templates existentes

### 3.4 Checklist

- [ ] Tipo de tarefa classificado
- [ ] Escopo definido
- [ ] Padroes identificados

## Etapa 4: Implementacao

### Para documentacao
- Usar templates do projeto
- Incluir Mermaid quando apropriado
- Manter links relativos

### Para codigo
- Seguir arquitetura existente
- Tratar erros com mensagens claras
- Adicionar comentarios apenas quando necessario

### Checklist

- [ ] Padroes seguidos
- [ ] Arquivos criados/modificados
- [ ] Sem TODOs pendentes

## Etapa 5: Testes

- Rodar testes existentes (se aplicavel)
- Criar novos testes se necessario
- Validar markdown/mermaid para docs

## Etapa 6: Validacao

- Qualidade verificada
- Consistencia com docs/codigo
- Nomenclatura correta

## Etapa 7: Lint

- Rodar linters/formatadores (se aplicavel)
- Corrigir problemas

## Etapa 8: Conclusao

Gerar relatorio com:
- Tarefa executada
- Arquivos criados
- Arquivos modificados
- Testes executados
- Observacoes

## Etapa 9: Atualizacao

Marcar tarefa e subtarefas como `[x]` no arquivo de tarefas.

## Checklist final

- [ ] Tarefa marcada como concluida
- [ ] Subtarefas marcadas (se existirem)
- [ ] Arquivo de tarefas salvo
