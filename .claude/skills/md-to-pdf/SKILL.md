---
name: md-to-pdf
description: Converte arquivos Markdown (.md) para PDF com formatação profissional. Use quando precisar gerar PDFs de documentação, relatórios, propostas ou qualquer arquivo Markdown do projeto.
---

# Markdown to PDF Converter

Esta skill converte arquivos Markdown para PDF com formatação profissional, ideal para documentação, relatórios técnicos, propostas comerciais e apresentações.

## Quando Usar

- Gerar PDFs da documentação técnica (Docs/\*.md)
- Criar propostas comerciais em PDF
- Exportar relatórios de projeto
- Distribuir documentação para stakeholders não-técnicos
- Gerar apresentações de ADRs (Architecture Decision Records)

## Ferramentas Disponíveis

### Opção 1: Pandoc (Recomendado)

**Vantagens:**

- Mais poderoso e flexível
- Suporta templates personalizados
- Melhor renderização de tabelas
- Suporte a LaTeX para fórmulas

**Instalação:**

```bash
# Windows (com Chocolatey)
choco install pandoc

# Windows (com winget)
winget install --id=JohnMacFarlane.Pandoc

# Verificar instalação
pandoc --version
```

**Uso Básico:**

```bash
pandoc input.md -o output.pdf
```

**Uso Avançado (com estilo):**

```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable mainfont="Arial" \
  --variable fontsize=11pt \
  --variable geometry:margin=2cm \
  --toc \
  --toc-depth=3 \
  --highlight-style=tango
```

### Opção 2: markdown-pdf (Node.js)

**Vantagens:**

- Fácil instalação via npm
- Bom para projetos Node.js
- Configuração via JSON

**Instalação:**

```bash
npm install -g markdown-pdf
```

**Uso:**

```bash
markdown-pdf input.md -o output.pdf
```

### Opção 3: Grip + wkhtmltopdf

**Vantagens:**

- Renderiza exatamente como GitHub
- Bom para READMEs

**Instalação:**

```bash
pip install grip
# Baixar wkhtmltopdf de: https://wkhtmltopdf.org/downloads.html
```

**Uso:**

```bash
grip input.md --export output.html
wkhtmltopdf output.html output.pdf
```

## Conversão Padrão do Projeto

### Para Documentação Técnica (Docs/\*.md)

Use este comando padrão:

```bash
pandoc "Docs/Architecture.md" -o "Docs/Architecture.pdf" \
  --pdf-engine=xelatex \
  --variable mainfont="Segoe UI" \
  --variable fontsize=11pt \
  --variable geometry:margin=2.5cm \
  --variable documentclass=report \
  --toc \
  --toc-depth=2 \
  --number-sections \
  --highlight-style=tango \
  --metadata title="LeadSense - Documentação Técnica" \
  --metadata author="Equipe de Desenvolvimento" \
  --metadata date="$(date +'%d/%m/%Y')"
```

**Opções explicadas:**

- `--pdf-engine=xelatex`: Melhor suporte a Unicode e fontes
- `--toc`: Gera índice automático
- `--number-sections`: Numera seções automaticamente
- `--highlight-style=tango`: Syntax highlighting para código
- `--metadata`: Informações do documento

### Para Propostas Comerciais

```bash
pandoc "Proposta-Cliente.md" -o "Proposta-Cliente.pdf" \
  --pdf-engine=xelatex \
  --variable mainfont="Calibri" \
  --variable fontsize=12pt \
  --variable geometry:margin=3cm \
  --variable colorlinks=true \
  --variable linkcolor=blue \
  --highlight-style=breezedark
```

### Conversão em Lote

Para converter todos os arquivos Markdown de uma pasta:

```bash
# PowerShell
Get-ChildItem -Path "Docs" -Filter *.md | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = $inputFile -replace '\.md$', '.pdf'
    pandoc $inputFile -o $outputFile --pdf-engine=xelatex --toc
}
```

```bash
# Bash
for file in Docs/*.md; do
    pandoc "$file" -o "${file%.md}.pdf" --pdf-engine=xelatex --toc
done
```

## Template Personalizado

### Criar Template LaTeX Customizado

Salve como `.claude/skills/md-to-pdf/template.tex`:

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[portuguese]{babel}
\usepackage{geometry}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{fancyhdr}
\usepackage{listings}
\usepackage{xcolor}

% Configurações de página
\geometry{margin=2.5cm}

% Cabeçalho e rodapé
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{LeadSense}
\fancyhead[R]{\thepage}
\fancyfoot[C]{Confidencial - Uso Interno}

% Cores para código
\definecolor{codegreen}{rgb}{0,0.6,0}
\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\definecolor{codepurple}{rgb}{0.58,0,0.82}
\definecolor{backcolour}{rgb}{0.95,0.95,0.92}

% Estilo de código
\lstdefinestyle{mystyle}{
    backgroundcolor=\color{backcolour},
    commentstyle=\color{codegreen},
    keywordstyle=\color{magenta},
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\footnotesize,
    breakatwhitespace=false,
    breaklines=true,
    captionpos=b,
    keepspaces=true,
    numbers=left,
    numbersep=5pt,
    showspaces=false,
    showstringspaces=false,
    showtabs=false,
    tabsize=2
}
\lstset{style=mystyle}

\begin{document}

$body$

\end{document}
```

**Usar o template:**

```bash
pandoc input.md -o output.pdf --template=.claude/skills/md-to-pdf/template.tex
```

## Configuração para o Projeto

### Criar Script de Conversão

Salve como `.claude/skills/md-to-pdf/convert.ps1`:

```powershell
# Script de conversão MD -> PDF para LeadSense
param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile,

    [Parameter(Mandatory=$false)]
    [switch]$WithToc,

    [Parameter(Mandatory=$false)]
    [string]$Type = "technical" # technical, commercial, report
)

# Definir output se não fornecido
if ([string]::IsNullOrEmpty($OutputFile)) {
    $OutputFile = $InputFile -replace '\.md$', '.pdf'
}

# Configurações por tipo
switch ($Type) {
    "technical" {
        $font = "Segoe UI"
        $fontSize = "11pt"
        $margins = "2.5cm"
        $highlightStyle = "tango"
    }
    "commercial" {
        $font = "Calibri"
        $fontSize = "12pt"
        $margins = "3cm"
        $highlightStyle = "breezedark"
    }
    "report" {
        $font = "Arial"
        $fontSize = "10pt"
        $margins = "2cm"
        $highlightStyle = "pygments"
    }
}

# Comando base
$cmd = @(
    "pandoc",
    "`"$InputFile`"",
    "-o", "`"$OutputFile`"",
    "--pdf-engine=xelatex",
    "--variable", "mainfont=`"$font`"",
    "--variable", "fontsize=$fontSize",
    "--variable", "geometry:margin=$margins",
    "--highlight-style=$highlightStyle"
)

# Adicionar TOC se solicitado
if ($WithToc) {
    $cmd += "--toc", "--toc-depth=2", "--number-sections"
}

# Executar
Write-Host "Convertendo $InputFile -> $OutputFile"
& $cmd[0] $cmd[1..($cmd.Length-1)]

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PDF gerado com sucesso: $OutputFile" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao gerar PDF" -ForegroundColor Red
}
```

**Uso do script:**

```powershell
# Documentação técnica com índice
.\convert.ps1 -InputFile "Docs/Architecture.md" -WithToc -Type technical

# Proposta comercial
.\convert.ps1 -InputFile "Proposta.md" -Type commercial

# Relatório
.\convert.ps1 -InputFile "Status-Semanal.md" -Type report
```

## Melhorias de Formatação

### Adicionar Capa ao PDF

Crie `cover.md`:

```markdown
---
title: "Sistema de Gestão para Clínicas Médicas"
subtitle: "Documentação Técnica - Arquitetura do Sistema"
author: "Equipe de Desenvolvimento"
date: "Novembro 2025"
---

\newpage
```

Concatene com documento principal:

```bash
pandoc cover.md Docs/Architecture.md -o Architecture-Complete.pdf --toc
```

### Adicionar Logo/Imagem

No Markdown, adicione:

```markdown
![Logo LeadSense](assets/logo.png){ width=200px }

# Título do Documento
```

### Quebras de Página

```markdown
# Seção 1

Conteúdo...

\newpage

# Seção 2

Novo conteúdo em nova página...
```

## Verificação de Dependências

Antes de executar conversão, verificar se pandoc está instalado:

```bash
# Verificar pandoc
pandoc --version

# Se não instalado no Windows
winget install --id=JohnMacFarlane.Pandoc

# Verificar LaTeX (necessário para PDFs complexos)
xelatex --version

# Se não instalado, instalar MiKTeX (Windows)
winget install --id=MiKTeX.MiKTeX
```

## Processo de Conversão

1. **Verificar dependências**: Garantir que pandoc está instalado
2. **Preparar Markdown**: Revisar formatação, links, imagens
3. **Escolher template**: Técnico, comercial ou padrão
4. **Executar conversão**: Usar comando apropriado
5. **Revisar PDF**: Verificar formatação, índice, imagens
6. **Ajustar se necessário**: Refinar opções do pandoc

## Troubleshooting

### Problema: "pandoc: command not found"

**Solução:** Instalar pandoc:

```bash
winget install --id=JohnMacFarlane.Pandoc
```

### Problema: "xelatex not found"

**Solução:** Instalar MiKTeX ou TeX Live:

```bash
winget install --id=MiKTeX.MiKTeX
```

### Problema: Fontes não encontradas

**Solução:** Usar fontes do sistema ou instalar:

```bash
# Listar fontes disponíveis (PowerShell)
[System.Drawing.Text.InstalledFontCollection]::new().Families | Select-Object Name
```

### Problema: Imagens não aparecem

**Solução:** Usar caminhos relativos ou absolutos corretos:

```markdown
![Diagrama](./images/diagram.png)
```

### Problema: Tabelas quebradas

**Solução:** Usar opção --columns ou simplificar tabela:

```bash
pandoc input.md -o output.pdf --columns=50
```

## Exemplos Práticos

### Converter documentação do projeto

```bash
# Architecture.md
pandoc "Docs/Architecture.md" -o "Docs/Architecture.pdf" \
  --pdf-engine=xelatex \
  --toc \
  --number-sections \
  --metadata title="LeadSense - Arquitetura"

# Todos os docs de uma vez
cd Docs
for file in *.md; do
    pandoc "$file" -o "${file%.md}.pdf" --toc --pdf-engine=xelatex
done
```

### Gerar apresentação de ADR

```bash
pandoc "Docs/ADR-001-Clean-Architecture.md" -o "ADR-001.pdf" \
  --pdf-engine=xelatex \
  --variable fontsize=14pt \
  --metadata title="ADR 001: Clean Architecture"
```

### Criar proposta para cliente

```bash
pandoc "Propostas/Clinica-ABC.md" -o "Propostas/Clinica-ABC.pdf" \
  --pdf-engine=xelatex \
  --variable mainfont="Calibri" \
  --variable fontsize=12pt \
  --variable geometry:margin=3cm \
  --variable colorlinks=true \
  --metadata title="Proposta Comercial - Clínica ABC" \
  --metadata author="LeadSense - Equipe Comercial"
```

## Integração com Git

Adicione ao `.gitignore` se quiser versionar apenas MDs:

```gitignore
# Ignorar PDFs gerados
*.pdf

# Ou manter PDFs importantes
!Docs/Architecture.pdf
!Propostas/*.pdf
```

## Automação

### GitHub Actions (CI/CD)

Crie `.github/workflows/docs-to-pdf.yml`:

```yaml
name: Generate Documentation PDFs

on:
  push:
    paths:
      - "Docs/*.md"

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Pandoc
        run: |
          sudo apt-get update
          sudo apt-get install -y pandoc texlive-xetex

      - name: Convert to PDF
        run: |
          cd Docs
          for file in *.md; do
            pandoc "$file" -o "${file%.md}.pdf" --pdf-engine=xelatex --toc
          done

      - name: Upload PDFs
        uses: actions/upload-artifact@v2
        with:
          name: documentation-pdfs
          path: Docs/*.pdf
```

## Melhores Práticas

1. **Versionamento**: Manter MDs no git, PDFs como artifacts
2. **Nomenclatura**: Manter mesmo nome base (Architecture.md → Architecture.pdf)
3. **Templates**: Usar templates consistentes por tipo de documento
4. **Automação**: Criar scripts para conversões frequentes
5. **Revisão**: Sempre revisar PDF antes de distribuir
6. **Metadados**: Incluir título, autor, data nos PDFs

## Referências

- [Pandoc Manual](https://pandoc.org/MANUAL.html)
- [Pandoc Filters](https://pandoc.org/filters.html)
- [LaTeX Templates](https://www.latextemplates.com/)
- Docs do projeto em `Docs/`
