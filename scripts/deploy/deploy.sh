#!/bin/bash

# divideIt Deployment Script
# Usage: ./deploy.sh [environment] [options]
# Environments: development, staging, production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    log "Prerequisites check passed"
}

# Select compose file based on environment
select_compose_file() {
    case "$ENVIRONMENT" in
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        development)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT. Use: development, staging, or production"
            ;;
    esac
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Compose file not found: $COMPOSE_FILE"
    fi
    
    log "Using compose file: $COMPOSE_FILE"
}

# Backup current deployment
backup_deployment() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log "Creating backup..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup volumes
        docker-compose -f "$COMPOSE_FILE" exec -T backend tar czf - /app/uploads /app/processed /app/logs > \
            "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" 2>/dev/null || true
        
        log "Backup created"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull || warning "Failed to pull some images"
}

# Build images
build_images() {
    log "Building images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
}

# Run database migrations (if applicable)
run_migrations() {
    log "Running migrations..."
    # Add migration commands here if needed
    # docker-compose -f "$COMPOSE_FILE" exec backend npm run migrate
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Services deployed"
}

# Wait for health checks
wait_for_health() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            log "Services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    warning "Health checks did not pass within expected time"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    local backend_url="http://localhost:3001"
    local frontend_url="http://localhost:3000"
    
    # Test backend health
    if curl -f -s "$backend_url/api/health" > /dev/null; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Test frontend
    if curl -f -s "$frontend_url" > /dev/null; then
        log "Frontend health check passed"
    else
        warning "Frontend health check failed"
    fi
}

# Show deployment status
show_status() {
    log "Deployment status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."
    docker image prune -f
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment"
    
    check_prerequisites
    select_compose_file
    
    if [ "$ENVIRONMENT" == "production" ]; then
        backup_deployment
    fi
    
    pull_images
    build_images
    run_migrations
    deploy_services
    
    if wait_for_health; then
        run_smoke_tests
    fi
    
    show_status
    cleanup
    
    log "Deployment completed successfully!"
}

# Run main function
main "$@"
