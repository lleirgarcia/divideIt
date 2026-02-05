#!/bin/bash
# Levanta divideIt en Docker para uso interno (solo localhost).
# Backend: http://127.0.0.1:18081
# Frontend: http://127.0.0.1:18080

set -e
cd "$(dirname "$0")/.."

echo "Building and starting divideIt (internal)..."
docker compose -f docker-compose.internal.yml up -d --build

echo ""
echo "Ready. Open in your browser:"
echo "  http://127.0.0.1:18080"
echo ""
echo "Backend API: http://127.0.0.1:18081"
echo "Health:      http://127.0.0.1:18081/api/health"
echo ""
echo "Logs:  docker compose -f docker-compose.internal.yml logs -f"
echo "Stop:  docker compose -f docker-compose.internal.yml down"
