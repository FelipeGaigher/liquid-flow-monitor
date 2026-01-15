# Fluxos de Navegacao - Liquid Flow Monitor

## Informacoes Gerais

| Campo | Valor |
|-------|-------|
| **Projeto** | Liquid Flow Monitor (TankControl) |
| **Documento** | Fluxos de Navegacao |
| **Versao** | 1.0 |
| **Data** | Janeiro 2026 |

## 1. Mapa do Site

```mermaid
flowchart TB
    Login[/Login/]

    subgraph App[Aplicacao]
        Dashboard[Dashboard]
        Tanks[Tanques]
        Movements[Movimentacoes]
        Prices[Produtos e Precos]
        Reports[Relatorios]
        Admin[Administracao]
        Settings[Configuracoes]
    end

    Login --> Dashboard
    Dashboard --> Tanks
    Dashboard --> Movements
    Dashboard --> Prices
    Dashboard --> Reports
    Dashboard --> Admin
    Dashboard --> Settings
```

## 2. Estrutura de Navegacao

### 2.1 Menu Principal (Sidebar)

| Ordem | Item | Icone | Rota | Perfis |
|-------|------|-------|------|--------|
| 1 | Dashboard | LayoutDashboard | / | Todos |
| 2 | Tanques | Container | /tanks | Todos |
| 3 | Movimentacoes | ArrowLeftRight | /movements | Todos |
| 4 | Produtos e Precos | DollarSign | /products-prices | Todos |
| 5 | Relatorios | FileText | /reports | Todos |
| 6 | Administracao | Users | /admin | Admin |
| 7 | Configuracoes | Settings | /settings | Admin |

### 2.2 Acoes Rapidas (Topbar)

- Toggle de Tema (Dark/Light)
- Filtros Globais
- Perfil do Usuario
- Logout

## 3. Fluxo de Autenticacao

```mermaid
flowchart TD
    Start([Inicio]) --> CheckAuth{Autenticado?}
    CheckAuth -->|Nao| Login[Tela de Login]
    CheckAuth -->|Sim| Dashboard[Dashboard]

    Login --> InputCred[Inserir Credenciais]
    InputCred --> Validate{Valido?}
    Validate -->|Nao| Error[Exibir Erro]
    Error --> Login
    Validate -->|Sim| StoreToken[Armazenar Token]
    StoreToken --> Dashboard

    Dashboard --> Actions{Acao}
    Actions -->|Logout| ClearToken[Limpar Token]
    ClearToken --> Login
    Actions -->|Token Expirado| Refresh{Refresh Token}
    Refresh -->|Sucesso| Dashboard
    Refresh -->|Falha| Login
```

## 4. Fluxo de Movimentacao

### 4.1 Fluxo Completo

```mermaid
flowchart TD
    Start([Usuario quer registrar movimentacao])

    Start --> Method{Como acessar?}
    Method -->|Dashboard| TankCard[Card do Tanque]
    Method -->|Pagina Tanques| TankPage[Lista de Tanques]
    Method -->|Pagina Movimentacoes| MovPage[Botao Nova]

    TankCard --> QuickAction[Botao Entrada/Saida]
    TankPage --> QuickAction
    MovPage --> OpenModal[Abrir Modal]
    QuickAction --> OpenModal

    OpenModal --> Modal[Modal de Movimentacao]
    Modal --> SelectTank{Tanque pre-selecionado?}
    SelectTank -->|Sim| PreFilled[Campos Preenchidos]
    SelectTank -->|Nao| SelectManual[Selecionar Tanque]
    SelectManual --> PreFilled

    PreFilled --> SelectType[Selecionar Tipo]
    SelectType --> InputVolume[Informar Volume]
    InputVolume --> Preview[Preview Antes/Depois]

    Preview --> TypeCheck{Tipo?}
    TypeCheck -->|Saida| InputPrice[Informar Preco]
    TypeCheck -->|Entrada/Ajuste| Optional[Campos Opcionais]
    InputPrice --> Calculate[Calcular Valor/Lucro]
    Calculate --> Optional

    Optional --> Submit[Clicar Confirmar]
    Submit --> Validate{Validacoes}
    Validate -->|Erro| ShowError[Exibir Erro]
    ShowError --> Modal
    Validate -->|OK| Save[Salvar]
    Save --> UpdateTank[Atualizar Volume Tanque]
    UpdateTank --> Toast[Toast Sucesso]
    Toast --> Close[Fechar Modal]
    Close --> Refresh[Atualizar Dados]
```

### 4.2 Validacoes do Fluxo

```mermaid
flowchart LR
    subgraph Entrada
        E1{Volume <= Capacidade Disponivel}
    end

    subgraph Saida
        S1{Volume <= Saldo Atual}
        S2{Preco > 0}
    end

    subgraph Ajuste
        A1{Resultado >= 0}
        A2{Resultado <= Capacidade}
    end
```

## 5. Fluxo de Dashboard

```mermaid
flowchart TD
    Start([Acessar Dashboard])

    Start --> Load[Carregar Dados]
    Load --> RenderKPIs[Renderizar KPIs]
    RenderKPIs --> RenderCharts[Renderizar Graficos]
    RenderCharts --> RenderTanks[Renderizar Cards Tanques]
    RenderTanks --> Ready[Dashboard Pronto]

    Ready --> Actions{Acao do Usuario}

    Actions -->|Aplicar Filtro| Filter[Selecionar Filtro]
    Filter --> UpdateFilters[Atualizar Context]
    UpdateFilters --> Reload[Recarregar Dados]
    Reload --> RenderKPIs

    Actions -->|Clicar Tanque| TankAction[Acao no Tanque]
    TankAction --> OpenModal[Abrir Modal Movimentacao]

    Actions -->|Navegar| Navigate[Ir para Pagina]
```

## 6. Fluxo de Relatorios

```mermaid
flowchart TD
    Start([Acessar Relatorios])

    Start --> SelectType[Selecionar Tipo]
    SelectType --> Types{Tipo de Relatorio}

    Types -->|Vendas| Vendas[Relatorio de Vendas]
    Types -->|Estoque| Estoque[Relatorio de Estoque]
    Types -->|Financeiro| Financeiro[Relatorio Financeiro]
    Types -->|Movimentacoes| Movimentacoes[Relatorio Movimentacoes]

    Vendas --> ApplyFilters[Aplicar Filtros]
    Estoque --> ApplyFilters
    Financeiro --> ApplyFilters
    Movimentacoes --> ApplyFilters

    ApplyFilters --> SelectFormat[Selecionar Formato]
    SelectFormat --> Formats{Formato}

    Formats -->|CSV| GenerateCSV[Gerar CSV]
    Formats -->|PDF| GeneratePDF[Gerar PDF]

    GenerateCSV --> Download[Download Arquivo]
    GeneratePDF --> Download

    Download --> End([Fim])
```

## 7. Fluxo de Administracao

### 7.1 Gestao de Usuarios

```mermaid
flowchart TD
    Start([Acessar Admin])

    Start --> CheckRole{E Admin?}
    CheckRole -->|Nao| Forbidden[Acesso Negado]
    CheckRole -->|Sim| LoadUsers[Carregar Usuarios]

    LoadUsers --> List[Exibir Lista]
    List --> Actions{Acao}

    Actions -->|Novo| CreateModal[Modal Criar]
    Actions -->|Editar| EditModal[Modal Editar]
    Actions -->|Status| ToggleStatus[Ativar/Desativar]
    Actions -->|Reset| ResetPwd[Resetar Senha]

    CreateModal --> FillForm[Preencher Dados]
    EditModal --> FillForm
    FillForm --> Validate{Validar}
    Validate -->|Erro| ShowError[Exibir Erro]
    Validate -->|OK| Save[Salvar]
    Save --> RefreshList[Atualizar Lista]

    ToggleStatus --> Confirm{Confirmar?}
    Confirm -->|Sim| UpdateStatus[Atualizar]
    UpdateStatus --> RefreshList
    Confirm -->|Nao| List

    ResetPwd --> SendReset[Gerar Nova Senha]
    SendReset --> ShowTemp[Exibir Senha Temp]
```

## 8. Fluxo de Configuracoes

```mermaid
flowchart TD
    Start([Acessar Config])

    Start --> CheckRole{E Admin?}
    CheckRole -->|Nao| Forbidden[Acesso Negado]
    CheckRole -->|Sim| LoadSettings[Carregar Config]

    LoadSettings --> Display[Exibir Formularios]

    subgraph Sections
        S1[Limites e Alertas]
        S2[Politica de Bloqueio]
        S3[Interface]
        S4[Notificacoes]
    end

    Display --> Edit[Editar Valores]
    Edit --> Save[Clicar Salvar]
    Save --> Validate{Validar}
    Validate -->|Erro| ShowError[Exibir Erro]
    Validate -->|OK| Apply[Aplicar Config]
    Apply --> Toast[Toast Sucesso]
```

## 9. Estados de Tela

### 9.1 Estados Comuns

```mermaid
stateDiagram-v2
    [*] --> Loading: Acessar pagina
    Loading --> Empty: Sem dados
    Loading --> Loaded: Com dados
    Loading --> Error: Falha

    Empty --> Loaded: Criar primeiro registro
    Error --> Loading: Retry

    Loaded --> Loading: Refresh
    Loaded --> Filtered: Aplicar filtro
    Filtered --> Loaded: Limpar filtro
```

### 9.2 Estados do Modal

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: Clicar botao
    Open --> Filling: Usuario preenche
    Filling --> Validating: Submit
    Validating --> Error: Falha validacao
    Validating --> Submitting: Validacao OK
    Error --> Filling: Corrigir
    Submitting --> Success: API OK
    Submitting --> Error: API Erro
    Success --> Closed: Auto-fechar
```

## 10. Navegacao por Teclado

| Tecla | Acao |
|-------|------|
| Tab | Proximo elemento focavel |
| Shift+Tab | Elemento anterior |
| Enter | Ativar botao/link |
| Space | Toggle checkbox/botao |
| Escape | Fechar modal/dropdown |
| Arrow Up/Down | Navegar em listas |

---

**Documento:** FLOW-navegacao.md
**Ultima Atualizacao:** Janeiro 2026
