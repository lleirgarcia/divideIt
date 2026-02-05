# DevOps Documentation

Comprehensive DevOps guide for divideIt project.

## Table of Contents

1. [Overview](#overview)
2. [Docker Configuration](#docker-configuration)
3. [CI/CD Pipelines](#cicd-pipelines)
4. [Monitoring](#monitoring)
5. [Deployment](#deployment)
6. [Backup & Recovery](#backup--recovery)
7. [Infrastructure](#infrastructure)
8. [Secrets Management](#secrets-management)
9. [Troubleshooting](#troubleshooting)

## Overview

divideIt uses a modern DevOps stack:
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local, Kubernetes-ready for production
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Prometheus + Grafana
- **Infrastructure**: Terraform for AWS
- **Secrets**: Environment-based with rotation support

## Docker Configuration

### Dockerfiles

Both backend and frontend use optimized multi-stage builds:

- **Backend** (`backend/Dockerfile`): Node.js 20 Alpine with FFmpeg
- **Frontend** (`frontend/Dockerfile`): Next.js standalone build

### Docker Compose Files

- `docker-compose.yml` - Development
- `docker-compose.staging.yml` - Staging environment
- `docker-compose.prod.yml` - Production with monitoring

### Building Images

```bash
# Backend
cd backend
docker build -t divideit-backend:latest .

# Frontend
cd frontend
docker build -t divideit-frontend:latest .
```

## CI/CD Pipelines

### Continuous Integration

Runs on every push/PR:
- Linting (ESLint)
- Unit tests (Jest)
- Integration tests
- Docker image builds (no push)

### Staging Deployment

Triggers on push to `develop` branch:
- Full test suite
- Build and push Docker images
- Deploy to staging environment
- Smoke tests

### Production Deployment

Triggers on version tags (e.g., `v1.0.0`):
- Full test suite with coverage
- Security scanning (Trivy)
- Build and push Docker images
- Deploy to production
- Health checks
- Create GitHub release

## Monitoring

### Prometheus

Scrapes metrics from:
- Backend API (`/api/metrics`)
- Node Exporter (system metrics)
- Frontend (if metrics endpoint added)

Configuration: `monitoring/prometheus/prometheus.yml`

### Grafana

Pre-configured dashboards:
- API metrics (request rate, latency, errors)
- System resources (CPU, memory, disk)
- Custom divideIt metrics

Access: http://localhost:3002 (default: admin/admin)

### Health Checks

Endpoints:
- `/api/health` - Basic health check
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe
- `/api/metrics` - Prometheus metrics

## Deployment

### Manual Deployment

```bash
# Development
./scripts/deploy/deploy.sh development

# Staging
./scripts/deploy/deploy.sh staging

# Production
./scripts/deploy/deploy.sh production
```

### Automated Deployment

Deployments are automated via GitHub Actions:
- Staging: Push to `develop` branch
- Production: Create version tag

### Rollback

```bash
# List backups
./scripts/deploy/rollback.sh staging

# Rollback to specific backup
./scripts/deploy/rollback.sh staging 20240101-120000
```

## Backup & Recovery

### Automated Backups

Backups include:
- Uploaded videos
- Processed segments
- Logs
- Configuration files

### Backup Schedule

Set up cron job for automated backups:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup/backup.sh
```

### Recovery Procedures

1. **Standard Restore**: Use `restore.sh`
2. **Disaster Recovery**: Use `disaster-recovery.sh`
3. **Partial Restore**: Restore specific components

## Infrastructure

### Terraform

Infrastructure as code for AWS:
- VPC with public/private subnets
- ECS cluster for containers
- Application Load Balancer
- S3 buckets for storage
- CloudWatch Logs

### Environments

- **Staging**: `terraform/environments/staging.tfvars`
- **Production**: `terraform/environments/production.tfvars`

### Provisioning

```bash
cd terraform
terraform init
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

## Secrets Management

### Development

Use `.env` files (gitignored):
- `backend/.env`
- `frontend/.env.local`

### Production

Options:
1. **Docker Secrets** (Docker Swarm)
2. **Kubernetes Secrets** (Kubernetes)
3. **AWS Secrets Manager** (AWS)
4. **HashiCorp Vault** (Enterprise)

### Secret Rotation

```bash
./scripts/secrets/rotate-secrets.sh production
```

See [secrets/README.md](secrets/README.md) for details.

## Troubleshooting

### Services Not Starting

1. Check logs: `docker-compose logs [service]`
2. Verify health: `./scripts/deploy/health-check.sh`
3. Check resources: `docker stats`

### High Memory Usage

1. Check Prometheus metrics
2. Review Grafana dashboards
3. Scale services if needed

### Deployment Failures

1. Check CI/CD logs in GitHub Actions
2. Verify environment variables
3. Check Docker image availability
4. Review health check endpoints

### Backup Issues

1. Verify backup directory permissions
2. Check disk space
3. Review backup logs
4. Test restore procedure

## Best Practices

1. **Always test in staging** before production
2. **Monitor metrics** continuously
3. **Rotate secrets** regularly (90 days)
4. **Backup frequently** (daily minimum)
5. **Review logs** regularly
6. **Keep dependencies updated**
7. **Document changes** in deployment notes
8. **Use infrastructure as code** for all environments

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
