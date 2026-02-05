#!/bin/bash

# divideIt Backup Script
# Creates backups of uploads, processed files, logs, and database (if applicable)

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="divideit-backup-$TIMESTAMP"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log "Backup directory: $BACKUP_DIR"
}

# Backup volumes
backup_volumes() {
    log "Backing up volumes..."
    
    local backup_file="$BACKUP_DIR/$BACKUP_NAME-volumes.tar.gz"
    
    # Backup uploads, processed files, and logs
    docker-compose exec -T backend tar czf - \
        /app/uploads \
        /app/processed \
        /app/logs \
        2>/dev/null > "$backup_file" || {
        error "Failed to backup volumes"
    }
    
    log "Volumes backed up to: $backup_file"
}

# Backup database (if applicable)
backup_database() {
    log "Checking for database..."
    # Add database backup logic here if you add a database
    # Example:
    # docker-compose exec -T postgres pg_dump -U divideit divideit > "$BACKUP_DIR/$BACKUP_NAME-database.sql"
}

# Backup configuration files
backup_config() {
    log "Backing up configuration files..."
    
    local config_backup="$BACKUP_DIR/$BACKUP_NAME-config.tar.gz"
    
    tar czf "$config_backup" \
        docker-compose.yml \
        docker-compose.prod.yml \
        docker-compose.staging.yml \
        backend/.env.example \
        frontend/.env.example \
        monitoring/ \
        2>/dev/null || warning "Some config files may be missing"
    
    log "Configuration backed up to: $config_backup"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    local manifest="$BACKUP_DIR/$BACKUP_NAME-manifest.json"
    
    cat > "$manifest" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_name": "$BACKUP_NAME",
  "environment": "${ENVIRONMENT:-unknown}",
  "version": "$(git describe --tags --always 2>/dev/null || echo 'unknown')",
  "files": [
    "$BACKUP_NAME-volumes.tar.gz",
    "$BACKUP_NAME-config.tar.gz"
  ]
}
EOF
    
    log "Manifest created: $manifest"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "divideit-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "divideit-backup-*.json" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleaned up"
}

# Verify backup
verify_backup() {
    log "Verifying backup..."
    
    local backup_file="$BACKUP_DIR/$BACKUP_NAME-volumes.tar.gz"
    
    if [ -f "$backup_file" ] && tar -tzf "$backup_file" > /dev/null 2>&1; then
        log "Backup verification passed"
        return 0
    else
        error "Backup verification failed"
    fi
}

# Main backup flow
main() {
    log "Starting backup process..."
    
    create_backup_dir
    backup_volumes
    backup_database
    backup_config
    create_manifest
    verify_backup
    cleanup_old_backups
    
    log "Backup completed successfully: $BACKUP_NAME"
    log "Backup location: $BACKUP_DIR"
}

main "$@"
