# Changelog

Todas as mudancas notaveis deste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### A Fazer
- Integracao com backend real
- Autenticacao JWT completa
- Notificacoes por email
- Integracao com sensores IoT

---

## [1.0.0] - 2026-01-14

### Adicionado
- **Dashboard** com KPIs de faturamento, volume, lucro e margem
- **Graficos** de vendas por produto, faturamento temporal e heatmap
- **Gestao de Tanques** com visualizacao de capacidade e alertas visuais
- **Sistema de Movimentacoes** com validacoes de saldo e capacidade
- **Tabela de Precos** com suporte a precos futuros
- **Exportacao de Relatorios** em formato CSV
- **Administracao de Usuarios** com perfis Admin, Operador e Viewer
- **Configuracoes do Sistema** para limites e alertas
- **Tema Dark/Light** com persistencia
- **Interface Responsiva** para desktop e mobile
- **Filtros Globais** por periodo, produto, tanque, site e operador

### Tecnico
- Frontend em React 18 + TypeScript
- Build com Vite 5
- Estilizacao com TailwindCSS + shadcn/ui
- Graficos com Recharts
- Gerenciamento de estado com React Query + Context API
- Dados mockados para demonstracao

### Documentacao
- Estrutura completa de documentacao em /docs
- Casos de uso detalhados (UC-001 a UC-009)
- Modelagem de dados com DER e schema SQL
- ADRs de arquitetura
- Diagramas C4 (Contexto e Container)
- APIs REST documentadas
- Guia de estilo e wireframes
- Plano de testes
- Runbooks operacionais

---

## [0.1.0] - 2026-01-01

### Adicionado
- Setup inicial do projeto
- Estrutura de pastas
- Configuracao do Vite + React
- Instalacao de dependencias base

---

## Legenda

- **Adicionado**: Novas funcionalidades
- **Modificado**: Alteracoes em funcionalidades existentes
- **Depreciado**: Funcionalidades que serao removidas
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correcoes de bugs
- **Seguranca**: Correcoes de vulnerabilidades

---

**Documento:** CHANGELOG.md
**Ultima Atualizacao:** Janeiro 2026
