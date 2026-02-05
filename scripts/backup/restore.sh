#!/bin/bash

# divideIt Restore Script
# Restores backups created by backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_NAME="${1:-}"

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

# List available backups
list_backups() {
    log "Available backups:"
    ls -lh "$BACKUP_DIR"/*-manifest.json 2>/dev/null | while read -r line; do
        local file=$(echo "$line" | awk '{print $NF}')
        local name=$(basename "$file" -manifest.json)
        echo "  - $name"
    done || warning "No backups found"
}

# Select backup
select_backup() {
    if [ -z "$BACKUP_NAME" ]; then
        list_backups
        error "Please specify a backup name"
    fi
    
    local manifest="$BACKUP_DIR/$BACKUP_NAME-manifest.json"
    
    if [ ! -f "$manifest" ]; then
        error "Backup manifest not found: $manifest"
    fi
    
    log "Selected backup: $BACKUP_NAME"
    cat "$manifest"
}

# Restore volumes
restore_volumes() {
    log "Restoring volumes..."
    
    local backup_file="$BACKUP_DIR/$BACKUP_NAME-volumes.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    # Stop services
    log "Stopping services..."
    docker-compose down || warning "Failed to stop some services"
    
    # Start backend for restoration
    log "Starting backend container..."
    docker-compose up -d backend
    sleep 5
    
    # Restore volumes
    log "Restoring files..."
    cat "$backup_file" | docker-compose exec -T backend tar xzf - -C /
    
    log "Volumes restored"
}

# Restore configuration
restore_config() {
    log "Restoring configuration..."
    
    local config_backup="$BACKUP_DIR/$BACKUP_NAME-config.tar.gz"
    
    if [ -f "$config_backup" ]; then
        tar xzf "$config_backup" -C . || warning "Failed to restore some config files"
        log "Configuration restored"
    else
        warning "Config backup not found"
    fi
}

# Restore database (if applicable)
restore_database() {
    log "Checking for database backup..."
    # Add database restore logic here if you add a database
    # Example:
    # local db_backup="$BACKUP_DIR/$BACKUP_NAME-database.sql"
    # if [ -f "$db_backup" ]; then
    #     docker-compose exec -T postgres psql -U divideit divideit < "$db_backup"
    # fi
}

# Verify restoration
verify_restore() {
    log "Verifying restoration..."
    
    # Check if files exist
    if docker-compose exec -T backend test -d /app/uploads && \
       docker-compose exec -T backend test -d /app/processed; then
        log "Restoration verification passed"
    else
        warning "Some directories may be missing"
    fi
}

# Main restore flow
main() {
    log "Starting restore process..."
    
    if [ -z "$BACKUP_NAME" ]; then
        list_backups
        error "Usage: ./restore.sh [backup-name]"
    fi
    
    select_backup
    
    read -p "Are you sure you want to restore this backup? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    restore_volumes
    restore_config
    restore_database
    verify_restore
    
    log "Restore completed successfully"
    log "You may need to restart services: docker-compose up -d"
}

main "$@"
