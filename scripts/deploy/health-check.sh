#!/bin/bash

# Health Check Script for divideIt
# Usage: ./health-check.sh [environment]

set -euo pipefail

ENVIRONMENT="${1:-development}"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
    local url=$1
    local name=$2
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✓${NC} $name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $name is unhealthy"
        return 1
    fi
}

check_docker_services() {
    echo "Checking Docker services..."
    
    local compose_file="docker-compose.yml"
    case "$ENVIRONMENT" in
        production)
            compose_file="docker-compose.prod.yml"
            ;;
        staging)
            compose_file="docker-compose.staging.yml"
            ;;
    esac
    
    if docker-compose -f "$compose_file" ps | grep -q "Up"; then
        echo -e "${GREEN}✓${NC} Docker services are running"
    else
        echo -e "${RED}✗${NC} Some Docker services are not running"
        return 1
    fi
}

main() {
    echo "Health Check for $ENVIRONMENT environment"
    echo "========================================"
    
    local failed=0
    
    check_docker_services || failed=$((failed + 1))
    check_endpoint "$BACKEND_URL/api/health" "Backend API" || failed=$((failed + 1))
    check_endpoint "$BACKEND_URL/api/health/ready" "Backend Readiness" || failed=$((failed + 1))
    check_endpoint "$BACKEND_URL/api/health/live" "Backend Liveness" || failed=$((failed + 1))
    check_endpoint "$BACKEND_URL/api/metrics" "Backend Metrics" || failed=$((failed + 1))
    check_endpoint "$FRONTEND_URL" "Frontend" || failed=$((failed + 1))
    
    echo "========================================"
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}All health checks passed${NC}"
        exit 0
    else
        echo -e "${RED}$failed health check(s) failed${NC}"
        exit 1
    fi
}

main "$@"
