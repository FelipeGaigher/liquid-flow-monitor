---
name: md-to-pdf
description: "Converte arquivos Markdown para PDF com formatacao profissional; use quando o usuario precisar gerar PDFs de documentacao, relatorios ou propostas." 
---

# Markdown para PDF

Converter arquivos Markdown (.md) para PDF com formatacao profissional.

## Quando usar

- Gerar PDFs de documentacao tecnica
- Criar propostas comerciais
- Exportar relatorios
- Distribuir documentos para stakeholders

## Opcao recomendada (Pandoc)

Verificar instalacao:

```bash
pandoc --version
```

Conversao basica:

```bash
pandoc input.md -o output.pdf
```

## Script do skill

Usar o script em `scripts/convert.ps1` para padronizar fontes e margens.

Exemplos:

```powershell
# Documentacao tecnica com indice
.\scripts\convert.ps1 -InputFile "docs/arquitetura-tecnica.md" -WithToc -Type technical

# Proposta comercial
.\scripts\convert.ps1 -InputFile "docs/proposta-cliente.md" -Type commercial

# Relatorio
.\scripts\convert.ps1 -InputFile "docs/status-semanal.md" -Type report
```

## Tipos suportados

- `technical`: Segoe UI, 11pt, margens 2.5cm
- `commercial`: Calibri, 12pt, margens 3cm
- `report`: Arial, 10pt, margens 2cm

## Troubleshooting

- `pandoc: command not found`: instalar Pandoc (winget ou choco)
- `xelatex not found`: instalar MiKTeX
- Fontes faltando: trocar para fontes instaladas no sistema
