# Script de conversao MD -> PDF para LeadSense
# Uso: .\convert.ps1 -InputFile "arquivo.md" [-OutputFile "saida.pdf"] [-WithToc] [-Type "technical"]

param(
    [Parameter(Mandatory=$true, HelpMessage="Caminho do arquivo Markdown de entrada")]
    [string]$InputFile,

    [Parameter(Mandatory=$false, HelpMessage="Caminho do arquivo PDF de saida (opcional)")]
    [string]$OutputFile,

    [Parameter(Mandatory=$false, HelpMessage="Incluir indice (Table of Contents)")]
    [switch]$WithToc,

    [Parameter(Mandatory=$false, HelpMessage="Tipo de documento: technical, commercial, report")]
    [ValidateSet("technical", "commercial", "report")]
    [string]$Type = "technical"
)

# Verificar se arquivo de entrada existe
if (-not (Test-Path $InputFile)) {
    Write-Host "[ERROR] Arquivo nao encontrado: $InputFile" -ForegroundColor Red
    exit 1
}

# Definir output se nao fornecido
if ([string]::IsNullOrEmpty($OutputFile)) {
    $OutputFile = $InputFile -replace '\.md$', '.pdf'
}

# Verificar se pandoc esta instalado
try {
    $pandocVersion = & pandoc --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Pandoc encontrado: $pandocVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Pandoc nao esta instalado" -ForegroundColor Red
    Write-Host "Instale com: winget install --id=JohnMacFarlane.Pandoc" -ForegroundColor Yellow
    exit 1
}

# Configuracoes por tipo
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
        Write-Host "[INFO] Tipo: Documentacao Tecnica" -ForegroundColor Cyan
    }
    "commercial" {
        $font = "Calibri"
        $fontSize = "12pt"
        $margins = "3cm"
        $highlightStyle = "breezedark"
        Write-Host "[INFO] Tipo: Documento Comercial" -ForegroundColor Cyan
    }
    "report" {
        $font = "Arial"
        $fontSize = "10pt"
        $margins = "2cm"
        $highlightStyle = "pygments"
        Write-Host "[INFO] Tipo: Relatorio" -ForegroundColor Cyan
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
    Write-Host "[OK] Indice habilitado" -ForegroundColor Gray
}

# Adicionar metadados
$fileName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
$pandocArgs += "--metadata"
$pandocArgs += "title=`"$fileName`""
$pandocArgs += "--metadata"
$pandocArgs += "author=`"LeadSense - Equipe de Desenvolvimento`""
$pandocArgs += "--metadata"
$pandocArgs += "date=`"$(Get-Date -Format 'dd/MM/yyyy')`""

# Executar conversao
Write-Host ""
Write-Host "[INFO] Convertendo: $InputFile" -ForegroundColor Yellow
Write-Host "[INFO] Destino: $OutputFile" -ForegroundColor Yellow
Write-Host ""

try {
    $process = Start-Process -FilePath "pandoc" -ArgumentList $pandocArgs -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host "[OK] PDF gerado com sucesso" -ForegroundColor Green
        Write-Host "[INFO] Localizacao: $OutputFile" -ForegroundColor Green

        # Mostrar tamanho do arquivo
        $fileInfo = Get-Item $OutputFile
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "[INFO] Tamanho: $sizeKB KB" -ForegroundColor Gray

        # Perguntar se quer abrir o arquivo
        Write-Host ""
        $openFile = Read-Host "Deseja abrir o PDF? (S/N)"
        if ($openFile -eq "S" -or $openFile -eq "s") {
            Start-Process $OutputFile
        }
    } else {
        Write-Host "[ERROR] Erro ao gerar PDF (codigo de saida: $($process.ExitCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Erro durante a conversao: $_" -ForegroundColor Red
    exit 1
}
