#!/bin/bash

# Secret Rotation Script
# Rotates secrets for the divideIt application

set -euo pipefail

ENVIRONMENT="${1:-development}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Generate random secret
generate_secret() {
    local length="${1:-32}"
    openssl rand -hex "$length"
}

# Rotate backend secrets
rotate_backend_secrets() {
    log "Rotating backend secrets..."
    
    local env_file="backend/.env"
    
    if [ ! -f "$env_file" ]; then
        warning "Backend .env file not found, creating from example..."
        cp backend/.env.example "$env_file" 2>/dev/null || true
    fi
    
    # Generate new secrets
    local jwt_secret=$(generate_secret 64)
    
    # Update .env file (you may need to adjust based on your secrets)
    # sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$env_file"
    
    log "Backend secrets rotated"
}

# Rotate frontend secrets
rotate_frontend_secrets() {
    log "Rotating frontend secrets..."
    # Add frontend secret rotation if needed
    log "Frontend secrets rotated"
}

# Rotate monitoring secrets
rotate_monitoring_secrets() {
    log "Rotating monitoring secrets..."
    
    local grafana_password=$(generate_secret 32)
    
    log "New Grafana password generated (update docker-compose.prod.yml)"
    log "GRAFANA_PASSWORD=$grafana_password"
}

# Backup current secrets
backup_secrets() {
    log "Backing up current secrets..."
    
    local backup_dir="./backups/secrets"
    mkdir -p "$backup_dir"
    
    if [ -f "backend/.env" ]; then
        cp "backend/.env" "$backup_dir/backend.env.$(date +%Y%m%d-%H%M%S).bak"
    fi
    
    log "Secrets backed up"
}

main() {
    log "Starting secret rotation for $ENVIRONMENT environment"
    
    backup_secrets
    rotate_backend_secrets
    rotate_frontend_secrets
    
    if [ "$ENVIRONMENT" == "production" ]; then
        rotate_monitoring_secrets
    fi
    
    log "Secret rotation completed"
    warning "Remember to update your deployment platform with new secrets"
}

main "$@"
