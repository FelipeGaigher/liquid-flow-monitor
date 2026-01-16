#!/bin/bash
# ============================================================
# LIQUID FLOW MONITOR - DATABASE BACKUP SCRIPT
# ============================================================
#
# Executa backup do PostgreSQL com compressao e rotacao
#
# VARIAVEIS DE AMBIENTE NECESSARIAS:
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_RETENTION_DAYS (opcional, default: 30)
#
# USO:
#   ./backup-db.sh
#   ./backup-db.sh --manual  # Backup manual com sufixo
#
# ============================================================

set -e

# Configuracoes
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/lfm_backup_${DATE}.sql.gz"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Verificar variaveis de ambiente
check_env() {
    local missing=0
    for var in PGHOST PGUSER PGPASSWORD PGDATABASE; do
        if [ -z "${!var}" ]; then
            log_error "Variavel $var nao definida"
            missing=1
        fi
    done

    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Criar diretorio de backup se nao existir
ensure_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Criando diretorio de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Executar backup
do_backup() {
    log_info "Iniciando backup do banco de dados: $PGDATABASE"
    log_info "Host: $PGHOST"
    log_info "Arquivo de destino: $BACKUP_FILE"

    # Backup com pg_dump e compressao
    if pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        2>/dev/null | gzip > "$BACKUP_FILE"; then

        # Verificar tamanho do arquivo
        FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        log_info "Backup concluido com sucesso!"
        log_info "Tamanho do arquivo: $FILESIZE"

        # Criar link simbolico para o backup mais recente
        ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/latest.sql.gz"

        return 0
    else
        log_error "Falha ao criar backup!"
        rm -f "$BACKUP_FILE"
        return 1
    fi
}

# Rotacao de backups antigos
rotate_backups() {
    log_info "Removendo backups com mais de $RETENTION_DAYS dias..."

    local count=$(find "$BACKUP_DIR" -name "lfm_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS | wc -l)

    if [ "$count" -gt 0 ]; then
        find "$BACKUP_DIR" -name "lfm_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
        log_info "Removidos $count backups antigos"
    else
        log_info "Nenhum backup antigo para remover"
    fi
}

# Listar backups existentes
list_backups() {
    log_info "Backups existentes:"
    echo "----------------------------------------"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    echo "----------------------------------------"

    local count=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
    log_info "Total de backups: $count"
}

# Verificar integridade do backup
verify_backup() {
    if [ -f "$BACKUP_FILE" ]; then
        log_info "Verificando integridade do backup..."

        if gzip -t "$BACKUP_FILE" 2>/dev/null; then
            log_info "Backup verificado: OK"
            return 0
        else
            log_error "Backup corrompido!"
            return 1
        fi
    else
        log_error "Arquivo de backup nao encontrado: $BACKUP_FILE"
        return 1
    fi
}

# Main
main() {
    log_info "=========================================="
    log_info "LIQUID FLOW MONITOR - DATABASE BACKUP"
    log_info "=========================================="

    check_env
    ensure_backup_dir

    if [ "$1" == "--manual" ]; then
        BACKUP_FILE="${BACKUP_DIR}/lfm_backup_manual_${DATE}.sql.gz"
        log_info "Modo: Backup manual"
    fi

    if do_backup; then
        verify_backup
        rotate_backups
        list_backups
        log_info "Processo de backup finalizado com sucesso!"
        exit 0
    else
        log_error "Processo de backup falhou!"
        exit 1
    fi
}

main "$@"
