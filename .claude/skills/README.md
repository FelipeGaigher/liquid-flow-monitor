# Claude Skills - LeadSense

Este diretório contém skills personalizadas para o projeto LeadSense, adaptadas para o contexto de IA aplicada a vendas via WhatsApp.

## Skills Disponíveis

### 1. `/conselho-de-pensamento`

**Descrição**: Conselheiro estratégico brutalmente honesto que disseca raciocínio, expõe inconsistências e gera planos de ação táticos.

**Quando usar**:
- Analisando decisões de negócio ou produto
- Validando estratégias de monetização
- Avaliando escolhas de arquitetura técnica
- Revisando priorização de features

**Exemplo adaptado para LeadSense**:
```
Usuário: "Vamos usar GPT-4 para analisar TODAS as mensagens em tempo real"
Skill: Crítica sobre custo vs. valor, propõe análise seletiva de mensagens-chave
```

**Comando**: Ativa automaticamente em contextos de análise estratégica

---

### 2. `/create-use-case`

**Descrição**: Cria documentos de caso de uso completos seguindo template e padrões do projeto LeadSense.

**Domínios disponíveis**:
- `AUTH`: Autenticação e autorização
- `LEAD`: Gestão de leads (CRUD, atribuição, status)
- `CONV`: Captura e análise de conversas WhatsApp
- `SCORE`: Sistema de pontuação e classificação
- `IA`: Análise com IA (GPT-4, sentiment analysis)
- `DASH`: Dashboard web para gestores
- `EXT`: Extensão Chrome (copiloto do vendedor)
- `WS`: WebSocket e comunicação real-time
- `ANL`: Analytics e métricas
- `NOTIF`: Notificações e alertas
- `INT`: Integrações externas (Twilio, CRMs)

**Quando usar**:
- Documentar nova funcionalidade
- Especificar integração com API externa
- Detalhar fluxo de análise de IA
- Criar casos de uso para dashboard ou extensão

**Exemplo de uso**:
```
/create-use-case UC-CONV-001: Capturar mensagens do WhatsApp Web em tempo real
```

**Formato de saída**: Arquivo Markdown completo em `docs/casos-de-uso/`

---

### 3. `/execute-task`

**Descrição**: Executa tarefas do projeto seguindo fluxo estruturado de 9 etapas (análise, localização, planejamento, implementação, testes, validação, lint, conclusão, atualização).

**Fluxo de execução**:
1. **Análise**: Lê documentação relevante
2. **Localização**: Encontra tarefa no arquivo de tarefas
3. **Planejamento**: Define escopo e arquivos afetados
4. **Implementação**: Executa a tarefa
5. **Testes**: Roda testes (se aplicável)
6. **Validação**: Verifica qualidade
7. **Lint**: Verifica formatação
8. **Conclusão**: Gera relatório
9. **Atualização**: Marca tarefa como concluída `[x]`

**Quando usar**:
- Executar qualquer tarefa documentada no projeto
- Implementar features seguindo padrões
- Garantir que todas as etapas sejam seguidas

**Exemplo de uso**:
```
/execute-task TASK-CONV-001: Implementar captura de mensagens via MutationObserver
```

**Importante**: Sempre marca a tarefa como `[x]` no final

---

### 4. `/review-task`

**Descrição**: Analisa arquivo de tarefas, detecta inconsistências (tarefas feitas mas não marcadas), gera relatório de status e recomenda próximas ações.

**Quando usar**:
- Revisar progresso do projeto
- Identificar tarefas concluídas mas não marcadas
- Gerar relatório de status para stakeholders
- Priorizar próximas tarefas

**O que faz automaticamente**:
- Detecta tarefas feitas (arquivos existem) mas não marcadas como `[x]`
- Atualiza status automaticamente
- Calcula progresso por categoria e prioridade
- Sugere top 3 próximas tarefas a executar

**Exemplo de uso**:
```
/review-task
```

**Formato de saída**: Relatório markdown completo com métricas e recomendações

---

### 5. `/md-to-pdf`

**Descrição**: Converte arquivos Markdown para PDF com formatação profissional usando Pandoc.

**Tipos de documentos**:
- **technical**: Documentação técnica (Segoe UI, 11pt, margens 2.5cm)
- **commercial**: Propostas comerciais (Calibri, 12pt, margens 3cm)
- **report**: Relatórios (Arial, 10pt, margens 2cm)

**Quando usar**:
- Gerar PDFs da documentação para stakeholders
- Criar propostas comerciais em PDF
- Exportar relatórios de status
- Distribuir documentação para não-técnicos

**Pré-requisitos**:
```bash
# Instalar Pandoc
winget install --id=JohnMacFarlane.Pandoc

# Verificar instalação
pandoc --version
```

**Exemplo de uso**:
```powershell
# Documentação técnica com índice
.\.claude\skills\md-to-pdf\convert.ps1 -InputFile "docs/arquitetura-tecnica.md" -WithToc -Type technical

# Proposta comercial
.\.claude\skills\md-to-pdf\convert.ps1 -InputFile "docs/proposta-cliente.md" -Type commercial

# Conversão simples
.\.claude\skills\md-to-pdf\convert.ps1 -InputFile "CLAUDE.md"
```

**Metadados automáticos**:
- Título: Nome do arquivo
- Autor: LeadSense - Equipe de Desenvolvimento
- Data: Data atual

---

## Estrutura de Domínios - LeadSense

Para manter consistência, use os seguintes domínios ao criar casos de uso ou tarefas:

```
Domínio   | Descrição                          | Exemplos
----------|------------------------------------|---------------------------------
AUTH      | Autenticação e autorização         | Login, JWT, permissões
LEAD      | Gestão de leads                    | CRUD, atribuição, status
CONV      | Captura de conversas               | WhatsApp Web, mensagens
SCORE     | Pontuação/classificação            | Scoring, hot/warm/cold
IA        | Análise com IA                     | GPT-4, NLP, sugestões
DASH      | Dashboard web                      | Métricas, analytics
EXT       | Extensão Chrome                    | Content script, UI injetada
WS        | WebSocket real-time                | Notificações, sync
ANL       | Analytics e métricas               | Conversão, performance
NOTIF     | Notificações e alertas             | Push, email, alertas
INT       | Integrações externas               | Twilio, CRMs, APIs
```

---

## Padrão de Nomenclatura

### Casos de Uso
```
UC-{DOMINIO}-{NUMERO}

Exemplos:
- UC-CONV-001: Capturar mensagens do WhatsApp Web
- UC-IA-002: Analisar sentimento com GPT-4
- UC-SCORE-003: Calcular score de fechamento
```

### Tarefas
```
TASK-{DOMINIO}-{NUMERO}

Exemplos:
- TASK-EXT-001: Implementar MutationObserver na extensão
- TASK-DASH-005: Criar página de analytics
- TASK-IA-003: Integrar OpenAI API
```

### Regras de Negócio
```
RN-{NUMERO}: Descrição da regra

Exemplos:
- RN-001: Lead é classificado como "quente" quando score > 70
- RN-002: Análise de IA só ocorre para mensagens do cliente
```

### Casos de Teste
```
CT-{NUMERO}: Cenário de teste

Exemplos:
- CT-001: Testar captura de mensagem com emoji
- CT-002: Validar score com conversa vazia
```

---

## Workflow Típico

### 1. Início do Desenvolvimento
```bash
# Revisar status do projeto
/review-task

# Ver top 3 tarefas recomendadas
# Escolher uma para executar
```

### 2. Executar Tarefa
```bash
# Executar tarefa específica
/execute-task TASK-CONV-001

# O skill segue automaticamente as 9 etapas
# Marca como [x] ao concluir
```

### 3. Criar Documentação
```bash
# Criar novo caso de uso
/create-use-case Captura de mensagens do WhatsApp em tempo real

# Skill pergunta detalhes e cria arquivo completo
```

### 4. Gerar PDF para Stakeholder
```powershell
# Gerar PDF da documentação
.\.claude\skills\md-to-pdf\convert.ps1 -InputFile "docs/arquitetura-tecnica.md" -WithToc -Type technical
```

### 5. Análise Estratégica
```bash
# Skill conselho-de-pensamento ativa automaticamente
# quando você apresenta ideias ou decisões para validar

"Estou pensando em usar GPT-4 para todas as mensagens..."
# → Recebe crítica honesta + plano de ação tático
```

---

## Boas Práticas

1. **Use `/review-task` frequentemente** para manter visibilidade do progresso

2. **Execute tarefas com `/execute-task`** para garantir que todas as etapas sejam seguidas

3. **Crie casos de uso com `/create-use-case`** antes de implementar features complexas

4. **Gere PDFs para documentação externa** ao compartilhar com não-desenvolvedores

5. **Consulte o conselho estratégico** antes de decisões de alto impacto

6. **Mantenha nomenclatura consistente** usando os domínios definidos

---

## Troubleshooting

### Skill não está disponível
- Verifique se está no diretório correto do projeto
- Skills são específicas por projeto (detectam contexto do LeadSense)

### PDF não gera
- Instale Pandoc: `winget install --id=JohnMacFarlane.Pandoc`
- Verifique instalação: `pandoc --version`

### Tarefa não é marcada como concluída
- Use `/execute-task` em vez de implementar manualmente
- O skill garante que a tarefa será marcada ao final

---

## Contribuindo com Skills

Para criar uma nova skill:

1. Crie diretório em `.claude/skills/nome-da-skill/`
2. Crie arquivo `SKILL.md` com front matter YAML:
   ```yaml
   ---
   name: nome-da-skill
   description: "O que a skill faz"
   allowed-tools:
     - Read
     - Write
     - Edit
   ---
   ```
3. Documente instruções detalhadas no SKILL.md
4. Adicione exemplos práticos do contexto LeadSense
5. Atualize este README.md

---

**Última atualização**: 13/01/2026
**Projeto**: LeadSense - AI Sales Copilot for WhatsApp
