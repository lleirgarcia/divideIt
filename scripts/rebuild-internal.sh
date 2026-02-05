#!/bin/bash
# Reconstruye las imágenes (front/back) y vuelve a levantar el stack interno.
# Úsalo después de cambiar código en frontend o backend.

set -e
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.internal.yml"

echo "Building images..."
$COMPOSE build

echo "Restarting containers..."
$COMPOSE up -d

echo ""
echo "Done. App: http://127.0.0.1:18080"
echo "Logs:  $COMPOSE logs -f"
