#!/bin/bash
# ============================================================
# LIQUID FLOW MONITOR - DATABASE RESTORE SCRIPT
# ============================================================
#
# Restaura backup do PostgreSQL
#
# VARIAVEIS DE AMBIENTE NECESSARIAS:
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#
# USO:
#   ./restore-db.sh                    # Restaura o backup mais recente
#   ./restore-db.sh backup_file.sql.gz # Restaura um backup especifico
#   ./restore-db.sh --list             # Lista backups disponiveis
#
# ============================================================

set -e

# Configuracoes
BACKUP_DIR="${BACKUP_DIR:-/backups}"

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

# Listar backups disponiveis
list_backups() {
    log_info "Backups disponiveis em $BACKUP_DIR:"
    echo "----------------------------------------"

    if ls "$BACKUP_DIR"/*.sql.gz 1>/dev/null 2>&1; then
        ls -lht "$BACKUP_DIR"/*.sql.gz | head -20
        echo "----------------------------------------"
        local count=$(ls -1 "$BACKUP_DIR"/*.sql.gz | wc -l)
        log_info "Total: $count backups"
    else
        log_warn "Nenhum backup encontrado"
    fi
}

# Confirmar operacao
confirm() {
    local message="$1"
    echo -e "${YELLOW}ATENCAO:${NC} $message"
    read -p "Deseja continuar? (yes/no): " response

    if [ "$response" != "yes" ]; then
        log_info "Operacao cancelada pelo usuario"
        exit 0
    fi
}

# Verificar arquivo de backup
verify_backup_file() {
    local file="$1"

    if [ ! -f "$file" ]; then
        log_error "Arquivo de backup nao encontrado: $file"
        exit 1
    fi

    log_info "Verificando integridade do arquivo..."
    if gzip -t "$file" 2>/dev/null; then
        log_info "Arquivo verificado: OK"
    else
        log_error "Arquivo de backup corrompido!"
        exit 1
    fi
}

# Executar restore
do_restore() {
    local backup_file="$1"

    log_info "Iniciando restore do banco de dados: $PGDATABASE"
    log_info "Host: $PGHOST"
    log_info "Arquivo de origem: $backup_file"

    # Descompactar e restaurar
    if gunzip -c "$backup_file" | psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -q 2>/dev/null; then
        log_info "Restore concluido com sucesso!"
        return 0
    else
        log_error "Falha ao restaurar backup!"
        return 1
    fi
}

# Verificar conexao com o banco
check_connection() {
    log_info "Verificando conexao com o banco de dados..."

    if pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" > /dev/null 2>&1; then
        log_info "Conexao OK"
    else
        log_error "Nao foi possivel conectar ao banco de dados"
        exit 1
    fi
}

# Mostrar ajuda
show_help() {
    echo "USO: $0 [OPCOES] [ARQUIVO_BACKUP]"
    echo ""
    echo "OPCOES:"
    echo "  --list      Lista backups disponiveis"
    echo "  --latest    Restaura o backup mais recente"
    echo "  --help      Mostra esta ajuda"
    echo ""
    echo "EXEMPLOS:"
    echo "  $0 --list"
    echo "  $0 --latest"
    echo "  $0 /backups/lfm_backup_20260116_020000.sql.gz"
}

# Main
main() {
    log_info "=========================================="
    log_info "LIQUID FLOW MONITOR - DATABASE RESTORE"
    log_info "=========================================="

    # Processar argumentos
    case "$1" in
        --list)
            list_backups
            exit 0
            ;;
        --help)
            show_help
            exit 0
            ;;
        --latest)
            BACKUP_FILE="${BACKUP_DIR}/latest.sql.gz"
            if [ ! -f "$BACKUP_FILE" ]; then
                log_error "Nenhum backup mais recente encontrado"
                log_info "Use --list para ver backups disponiveis"
                exit 1
            fi
            ;;
        "")
            # Sem argumentos, usar o mais recente
            BACKUP_FILE="${BACKUP_DIR}/latest.sql.gz"
            if [ ! -f "$BACKUP_FILE" ]; then
                log_error "Nenhum backup mais recente encontrado"
                log_info "Use --list para ver backups disponiveis"
                exit 1
            fi
            ;;
        *)
            # Arquivo especifico
            BACKUP_FILE="$1"
            ;;
    esac

    check_env
    check_connection
    verify_backup_file "$BACKUP_FILE"

    # Mostrar informacoes do backup
    FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    FILEDATE=$(ls -l "$BACKUP_FILE" | awk '{print $6, $7, $8}')
    log_info "Arquivo: $BACKUP_FILE"
    log_info "Tamanho: $FILESIZE"
    log_info "Data: $FILEDATE"

    # Confirmar operacao
    confirm "Esta operacao ira substituir TODOS os dados do banco '$PGDATABASE'."

    # Executar restore
    if do_restore "$BACKUP_FILE"; then
        log_info "Processo de restore finalizado com sucesso!"
        exit 0
    else
        log_error "Processo de restore falhou!"
        exit 1
    fi
}

main "$@"
