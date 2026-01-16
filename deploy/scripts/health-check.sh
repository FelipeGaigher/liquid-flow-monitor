#!/bin/bash
# ============================================================
# LIQUID FLOW MONITOR - HEALTH CHECK SCRIPT
# ============================================================
#
# Verifica a saude de todos os servicos
#
# USO:
#   ./health-check.sh
#   ./health-check.sh --verbose
#   ./health-check.sh --json
#
# ============================================================

set -e

# Configuracoes
API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-lfm_user}"
DB_NAME="${DB_NAME:-liquid_flow_monitor}"

VERBOSE=false
JSON_OUTPUT=false

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --json|-j)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Resultados
declare -A RESULTS

check_status() {
    local name="$1"
    local status="$2"
    local message="$3"

    RESULTS["$name"]="$status"

    if [ "$JSON_OUTPUT" = false ]; then
        if [ "$status" = "ok" ]; then
            echo -e "${GREEN}[OK]${NC} $name: $message"
        elif [ "$status" = "warn" ]; then
            echo -e "${YELLOW}[WARN]${NC} $name: $message"
        else
            echo -e "${RED}[FAIL]${NC} $name: $message"
        fi
    fi
}

# Verificar API Backend
check_api() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking API at $API_URL/health..."
    fi

    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        check_status "API Backend" "ok" "Healthy (HTTP $response)"
    elif [ "$response" = "000" ]; then
        check_status "API Backend" "fail" "Connection refused"
    else
        check_status "API Backend" "fail" "Unhealthy (HTTP $response)"
    fi
}

# Verificar Frontend
check_frontend() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking Frontend at $FRONTEND_URL..."
    fi

    response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")

    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        check_status "Frontend" "ok" "Accessible (HTTP $response)"
    elif [ "$response" = "000" ]; then
        check_status "Frontend" "fail" "Connection refused"
    else
        check_status "Frontend" "fail" "Error (HTTP $response)"
    fi
}

# Verificar Database
check_database() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking Database at $DB_HOST:$DB_PORT..."
    fi

    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
            check_status "PostgreSQL" "ok" "Accepting connections"
        else
            check_status "PostgreSQL" "fail" "Not accepting connections"
        fi
    else
        # Fallback: usar nc para verificar porta
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            check_status "PostgreSQL" "ok" "Port $DB_PORT is open"
        else
            check_status "PostgreSQL" "fail" "Port $DB_PORT is closed"
        fi
    fi
}

# Verificar uso de disco
check_disk() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking disk usage..."
    fi

    usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$usage" -lt 70 ]; then
        check_status "Disk Usage" "ok" "${usage}% used"
    elif [ "$usage" -lt 90 ]; then
        check_status "Disk Usage" "warn" "${usage}% used"
    else
        check_status "Disk Usage" "fail" "${usage}% used (critical)"
    fi
}

# Verificar uso de memoria
check_memory() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking memory usage..."
    fi

    if command -v free &> /dev/null; then
        usage=$(free | awk '/Mem:/ {printf("%.0f", $3/$2 * 100)}')

        if [ "$usage" -lt 70 ]; then
            check_status "Memory Usage" "ok" "${usage}% used"
        elif [ "$usage" -lt 90 ]; then
            check_status "Memory Usage" "warn" "${usage}% used"
        else
            check_status "Memory Usage" "fail" "${usage}% used (critical)"
        fi
    else
        check_status "Memory Usage" "warn" "Unable to check"
    fi
}

# Gerar output JSON
generate_json() {
    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"status\": {"

    local first=true
    for key in "${!RESULTS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"$key\": \"${RESULTS[$key]}\""
    done

    echo ""
    echo "  },"

    # Overall status
    local overall="healthy"
    for status in "${RESULTS[@]}"; do
        if [ "$status" = "fail" ]; then
            overall="unhealthy"
            break
        elif [ "$status" = "warn" ]; then
            overall="degraded"
        fi
    done

    echo "  \"overall\": \"$overall\""
    echo "}"
}

# Main
main() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo "=========================================="
        echo "LIQUID FLOW MONITOR - HEALTH CHECK"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "------------------------------------------"
    fi

    check_api
    check_frontend
    check_database
    check_disk
    check_memory

    if [ "$JSON_OUTPUT" = true ]; then
        generate_json
    else
        echo "------------------------------------------"

        # Calcular status geral
        local failed=0
        local warned=0
        for status in "${RESULTS[@]}"; do
            if [ "$status" = "fail" ]; then
                ((failed++))
            elif [ "$status" = "warn" ]; then
                ((warned++))
            fi
        done

        if [ $failed -gt 0 ]; then
            echo -e "${RED}OVERALL STATUS: UNHEALTHY${NC} ($failed failures)"
            exit 1
        elif [ $warned -gt 0 ]; then
            echo -e "${YELLOW}OVERALL STATUS: DEGRADED${NC} ($warned warnings)"
            exit 0
        else
            echo -e "${GREEN}OVERALL STATUS: HEALTHY${NC}"
            exit 0
        fi
    fi
}

main
