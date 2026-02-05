#!/bin/bash

# divideIt Disaster Recovery Script
# Comprehensive disaster recovery procedures

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
ENVIRONMENT="${ENVIRONMENT:-production}"

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

# Assess damage
assess_damage() {
    log "Assessing system damage..."
    
    local issues=0
    
    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        warning "Containers are not running"
        issues=$((issues + 1))
    fi
    
    # Check disk space
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        warning "Disk usage is high: ${disk_usage}%"
        issues=$((issues + 1))
    fi
    
    # Check for recent backups
    if [ ! -f "$BACKUP_DIR"/*-manifest.json ]; then
        warning "No recent backups found"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        log "No critical issues detected"
    else
        warning "$issues issue(s) detected"
    fi
}

# Emergency stop
emergency_stop() {
    log "Performing emergency stop..."
    docker-compose down
    log "Services stopped"
}

# Recover from backup
recover_from_backup() {
    log "Recovering from latest backup..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/*-manifest.json 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        error "No backups available for recovery"
    fi
    
    local backup_name=$(basename "$latest_backup" -manifest.json)
    log "Using backup: $backup_name"
    
    # Restore volumes
    local backup_file="$BACKUP_DIR/$backup_name-volumes.tar.gz"
    if [ -f "$backup_file" ]; then
        docker-compose up -d backend
        sleep 5
        cat "$backup_file" | docker-compose exec -T backend tar xzf - -C /
        log "Volumes restored"
    fi
}

# Rebuild services
rebuild_services() {
    log "Rebuilding services..."
    docker-compose build --no-cache
    docker-compose up -d
    log "Services rebuilt"
}

# Verify recovery
verify_recovery() {
    log "Verifying recovery..."
    
    sleep 10
    
    # Check health endpoints
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    if curl -f -s http://localhost:3000 > /dev/null; then
        log "Frontend health check passed"
    else
        warning "Frontend health check failed"
    fi
}

# Generate recovery report
generate_report() {
    local report_file="./recovery-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" <<EOF
divideIt Disaster Recovery Report
=================================
Date: $(date)
Environment: $ENVIRONMENT

Recovery Actions Taken:
- Emergency stop performed
- Backup restoration completed
- Services rebuilt
- Health checks verified

System Status:
$(docker-compose ps)

Backup Used:
$(ls -lh "$BACKUP_DIR"/*-manifest.json | tail -1)

Next Steps:
1. Monitor system for 24 hours
2. Verify all functionality
3. Review logs for errors
4. Update documentation if needed
EOF
    
    log "Recovery report generated: $report_file"
}

# Main recovery flow
main() {
    log "Starting disaster recovery procedure..."
    
    assess_damage
    
    read -p "Do you want to proceed with disaster recovery? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Recovery cancelled"
        exit 0
    fi
    
    emergency_stop
    recover_from_backup
    rebuild_services
    verify_recovery
    generate_report
    
    log "Disaster recovery completed"
}

main "$@"
