# Secrets Management

This directory contains configuration and documentation for secrets management.

## Overview

Secrets should NEVER be committed to version control. This directory contains:
- Templates for secret files
- Documentation on secrets management
- Scripts for secret rotation

## Secret Storage

### Development
Use `.env` files (already in `.gitignore`):
- `backend/.env`
- `frontend/.env.local`

### Staging/Production
Use one of the following:

1. **Docker Secrets** (recommended for Docker Swarm)
2. **Kubernetes Secrets** (for Kubernetes deployments)
3. **Environment Variables** (set in CI/CD or deployment platform)
4. **Secret Management Services**:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

## Required Secrets

### Backend
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/staging/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `JWT_SECRET` - JWT signing secret (if authentication added)
- `DATABASE_URL` - Database connection string (if database added)
- `REDIS_URL` - Redis connection string (if Redis added)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Monitoring
- `GRAFANA_USER` - Grafana admin username
- `GRAFANA_PASSWORD` - Grafana admin password
- `PROMETHEUS_PASSWORD` - Prometheus basic auth password (if enabled)

## Secret Rotation

Run the secret rotation script:
```bash
./scripts/secrets/rotate-secrets.sh [environment]
```

## Best Practices

1. **Never commit secrets** - Always use `.env.example` files
2. **Rotate secrets regularly** - At least every 90 days
3. **Use strong passwords** - Minimum 32 characters for production
4. **Limit secret access** - Use least privilege principle
5. **Audit secret access** - Log all secret access attempts
6. **Encrypt secrets at rest** - Use encryption for stored secrets
7. **Use different secrets per environment** - Never reuse secrets

## Secret Generation

Generate secure secrets:
```bash
# Generate random secret (32 characters)
openssl rand -hex 32

# Generate JWT secret (64 characters)
openssl rand -base64 64
```

## CI/CD Integration

Secrets should be stored as GitHub Secrets or your CI/CD platform's secret store:

### GitHub Secrets
- `BACKEND_ENV_PROD`
- `FRONTEND_ENV_PROD`
- `DOCKER_REGISTRY_TOKEN`
- `DEPLOYMENT_KEY`

Access in workflows:
```yaml
env:
  SECRET: ${{ secrets.BACKEND_ENV_PROD }}
```
