# Script de conversão MD -> PDF para LeadSense
# Uso: .\convert.ps1 -InputFile "arquivo.md" [-OutputFile "saida.pdf"] [-WithToc] [-Type "technical"]

param(
    [Parameter(Mandatory=$true, HelpMessage="Caminho do arquivo Markdown de entrada")]
    [string]$InputFile,

    [Parameter(Mandatory=$false, HelpMessage="Caminho do arquivo PDF de saída (opcional)")]
    [string]$OutputFile,

    [Parameter(Mandatory=$false, HelpMessage="Incluir índice (Table of Contents)")]
    [switch]$WithToc,

    [Parameter(Mandatory=$false, HelpMessage="Tipo de documento: technical, commercial, report")]
    [ValidateSet("technical", "commercial", "report")]
    [string]$Type = "technical"
)

# Verificar se arquivo de entrada existe
if (-not (Test-Path $InputFile)) {
    Write-Host "❌ Erro: Arquivo não encontrado: $InputFile" -ForegroundColor Red
    exit 1
}

# Definir output se não fornecido
if ([string]::IsNullOrEmpty($OutputFile)) {
    $OutputFile = $InputFile -replace '\.md$', '.pdf'
}

# Verificar se pandoc está instalado
try {
    $pandocVersion = & pandoc --version 2>&1 | Select-Object -First 1
    Write-Host "✓ Pandoc encontrado: $pandocVersion" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro: Pandoc não está instalado" -ForegroundColor Red
    Write-Host "Instale com: winget install --id=JohnMacFarlane.Pandoc" -ForegroundColor Yellow
    exit 1
}

# Configurações por tipo
$font = ""
$fontSize = ""
$margins = ""
$highlightStyle = ""

switch ($Type) {
    "technical" {
        $font = "Segoe UI"
        $fontSize = "11pt"
        $margins = "2.5cm"
        $highlightStyle = "tango"
        Write-Host "📘 Tipo: Documentação Técnica" -ForegroundColor Cyan
    }
    "commercial" {
        $font = "Calibri"
        $fontSize = "12pt"
        $margins = "3cm"
        $highlightStyle = "breezedark"
        Write-Host "💼 Tipo: Documento Comercial" -ForegroundColor Cyan
    }
    "report" {
        $font = "Arial"
        $fontSize = "10pt"
        $margins = "2cm"
        $highlightStyle = "pygments"
        Write-Host "📊 Tipo: Relatório" -ForegroundColor Cyan
    }
}

# Construir comando pandoc
$pandocArgs = @(
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
    $pandocArgs += "--toc"
    $pandocArgs += "--toc-depth=2"
    $pandocArgs += "--number-sections"
    Write-Host "✓ Índice habilitado" -ForegroundColor Gray
}

# Adicionar metadados
$fileName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
$pandocArgs += "--metadata"
$pandocArgs += "title=`"$fileName`""
$pandocArgs += "--metadata"
$pandocArgs += "author=`"LeadSense - Equipe de Desenvolvimento`""
$pandocArgs += "--metadata"
$pandocArgs += "date=`"$(Get-Date -Format 'dd/MM/yyyy')`""

# Executar conversão
Write-Host ""
Write-Host "🔄 Convertendo: $InputFile" -ForegroundColor Yellow
Write-Host "📄 Destino: $OutputFile" -ForegroundColor Yellow
Write-Host ""

try {
    $process = Start-Process -FilePath "pandoc" -ArgumentList $pandocArgs -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host "✅ PDF gerado com sucesso!" -ForegroundColor Green
        Write-Host "📁 Localização: $OutputFile" -ForegroundColor Green

        # Mostrar tamanho do arquivo
        $fileInfo = Get-Item $OutputFile
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "📏 Tamanho: $sizeKB KB" -ForegroundColor Gray

        # Perguntar se quer abrir o arquivo
        Write-Host ""
        $openFile = Read-Host "Deseja abrir o PDF? (S/N)"
        if ($openFile -eq "S" -or $openFile -eq "s") {
            Start-Process $OutputFile
        }
    } else {
        Write-Host "❌ Erro ao gerar PDF (código de saída: $($process.ExitCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro durante a conversão: $_" -ForegroundColor Red
    exit 1
}
