#!/bin/bash

# divideIt Rollback Script
# Usage: ./rollback.sh [environment] [backup-timestamp]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
BACKUP_TIMESTAMP="${2:-}"
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.yml"

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

# Select compose file
select_compose_file() {
    case "$ENVIRONMENT" in
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
}

# List available backups
list_backups() {
    log "Available backups:"
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || warning "No backups found"
}

# Restore from backup
restore_backup() {
    if [ -z "$BACKUP_TIMESTAMP" ]; then
        error "Backup timestamp required. Use: ./rollback.sh $ENVIRONMENT [timestamp]"
    fi
    
    local backup_file="$BACKUP_DIR/backup-$BACKUP_TIMESTAMP.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring from backup: $backup_file"
    
    # Stop services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore volumes
    docker-compose -f "$COMPOSE_FILE" up -d backend
    sleep 5
    
    cat "$backup_file" | docker-compose -f "$COMPOSE_FILE" exec -T backend tar xzf - -C /
    
    log "Backup restored"
}

# Rollback to previous image version
rollback_images() {
    log "Rolling back to previous image version..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Pull previous version (you may need to adjust tag strategy)
    docker-compose -f "$COMPOSE_FILE" pull || warning "Failed to pull previous images"
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Images rolled back"
}

main() {
    log "Starting rollback for $ENVIRONMENT environment"
    
    select_compose_file
    
    if [ -z "$BACKUP_TIMESTAMP" ]; then
        list_backups
        error "Please specify a backup timestamp"
    fi
    
    restore_backup
    rollback_images
    
    log "Rollback completed"
}

main "$@"
