---
name: divideIt Scripts Inventory
description: Complete reference of all executable scripts in divideIt project (npm, shell, TypeScript, Docker, GitHub Actions)
type: reference
---

# divideIt Project — Complete Script Inventory

**Generated:** 2026-03-15  
**Project:** divideIt (Video Processing SaaS)  
**Location:** /Users/lleirgarcia/projects/2026/divideIt

## NPM Scripts Summary

### Root Level
- **Dev**: `npm run dev` (concurrent backend+frontend)
- **Build**: `npm run build` (both workspaces)
- **Test**: `npm run test`, `npm run test:e2e`, `npm run test:coverage`
- **Lint**: `npm run lint`
- **Docker**: `npm run docker:build|up|down|logs`

### Backend (from /backend)
- **Dev**: `npm run dev` (tsx watch on 3051)
- **Build**: `npm run build` (TypeScript → dist/)
- **Start**: `npm run start` (production mode)
- **Test**: `npm run test|test:watch|test:coverage`
- **Lint**: `npm run lint|lint:fix`

### Frontend (from /frontend)
- **Dev**: `next dev -p 4050`
- **Build**: `next build`
- **Start**: `next start -p 4050`
- **Test**: `npm run test|test:watch|test:coverage`

## Shell Scripts (scripts/ directory)

### Internal Stack
- `scripts/run-internal.sh` — Start Docker stack (localhost 18080/18081)
- `scripts/rebuild-internal.sh` — Rebuild and restart
- `scripts/check-google-env.sh` — Validate Google Drive creds

### Deployment (scripts/deploy/)
- `deploy.sh [environment]` ⚠️ — Deploy to dev/staging/prod with backup
- `health-check.sh [environment]` — Check service health
- `rollback.sh [environment] [timestamp]` ⚠️ — Restore from backup

### Backup (scripts/backup/)
- `backup.sh` — Create backup (volumes + config)
- `restore.sh [backup-name]` — Restore from backup
- `disaster-recovery.sh` ⚠️ — Full recovery procedure

### Secrets
- `scripts/secrets/rotate-secrets.sh [environment]` — Rotate secrets

### Backend
- `backend/scripts/get-refresh-token.sh` — Interactive: get Google Drive token

## TypeScript Scripts (backend/scripts/)

Run with: `npx tsx scripts/SCRIPT.ts` from backend/

### Video Splitting
- `splitAll.ts [--account name]` — Generate all presets (tiktok, ig, ig_zoom, yt)
- `splitIg.ts` — Instagram clips only (aqualityguy)
- `splitIgYt.ts` — Instagram zoom + YouTube Shorts (aqualityguy)
- `testAllPresets.ts [--account name]` — 1 clip per preset (quick test)

### Game Overlays
- `addGameOverlayToSegment.ts <path>` — Add Space Invaders to segment
- `generateSpaceInvadersVideo.ts` — Generate theme videos for overlays

## Docker Compose Environments

- `docker-compose.yml` — Development (ports 3051/3050)
- `docker-compose.internal.yml` — Internal localhost (18081/18080)
- `docker-compose.staging.yml` — Staging (ports 3001/3000 + Prometheus)
- `docker-compose.prod.yml` — Production (full stack with Grafana, nginx)

**Commands:**
```bash
docker-compose up -d                                    # Dev
docker-compose -f docker-compose.internal.yml up -d    # Internal
docker-compose -f docker-compose.staging.yml up -d     # Staging
docker-compose -f docker-compose.prod.yml up -d        # Prod
docker-compose logs -f                                  # Logs
docker-compose down                                     # Stop
```

## GitHub Actions Workflows

- `.github/workflows/ci.yml` — Build + test on push/PR (main/develop)
- `.github/workflows/deploy-staging.yml` — Push to develop → staging
- `.github/workflows/deploy-production.yml` ⚠️ — Version tags → production

## Project Memory Scripts (Global)

Available globally via `~/.zshrc`:
- `pm-start` — Start daemon watcher
- `pm-stop` — Stop daemon
- `pm-note "text"` — Log note
- `pm-daily [date]` — Daily summary
- `pm-youtube-summary [--days N]` — Narrative script
- `pm-status` — Daemon status

## Most Used Commands (Daily)

1. `npm run dev` — Full stack dev
2. `bash scripts/run-internal.sh` — Quick Docker internal
3. `cd backend && npx tsx scripts/splitIg.ts` — Generate clips
4. `npm test` — Run unit tests
5. `npm run lint` — Check code style

## Environment Variables

- `NODE_ENV`: development|staging|production
- `FRONTEND_URL`: accessible URL for frontend
- `GOOGLE_DRIVE_CLIENT_ID|CLIENT_SECRET|REFRESH_TOKEN`: Drive integration
- `BACKEND_PORT|FRONTEND_PORT`: Internal stack overrides
- `GRAFANA_USER|GRAFANA_PASSWORD`: Monitoring (prod)

## Port Mapping

| Service | Dev | Internal | Staging | Prod |
|---------|-----|----------|---------|------|
| Backend | 3051 | 18081 | 3001 | 3001 |
| Frontend | 3050 | 18080 | 3000 | 3000 |
| Prometheus | — | — | 9090 | 9090 |
| Grafana | — | — | — | 3002 |
| Node Exporter | — | — | — | 9100 |
| Nginx | — | — | — | 80/443 |

## Dangerous Operations ⚠️

- `deploy.sh production` — Creates backup first, but verify env before running
- `rollback.sh` — Requires specific backup timestamp
- `disaster-recovery.sh` — Requires manual confirmation; assesses damage
- `rotate-secrets.sh production` — Update deployment platform after

## Key Files
- Root: `/package.json` (workspace definition)
- Backend: `/backend/package.json`
- Frontend: `/frontend/package.json`
- Compose: `/docker-compose.{yml,internal,staging,prod}.yml`
- Workflows: `/.github/workflows/{ci,deploy-staging,deploy-production}.yml`
- Scripts: `/scripts/{run-internal,rebuild-internal,check-google-env,deploy,health-check,rollback,backup,restore,disaster-recovery,rotate-secrets}.sh`
- Backend scripts: `/backend/scripts/{get-refresh-token}.sh`
- TypeScript: `/backend/scripts/{splitAll,splitIg,splitIgYt,testAllPresets,addGameOverlayToSegment,generateSpaceInvadersVideo}.ts`

