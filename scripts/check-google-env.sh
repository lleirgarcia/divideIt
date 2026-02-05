#!/bin/bash
# Comprueba que backend/.env tenga las variables de Google Drive (mismo archivo que en local y en Docker).

set -e
cd "$(dirname "$0")/.."

ENV_FILE="backend/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe $ENV_FILE (el mismo que usas en local)."
  echo ""
  echo "Cópialo desde el ejemplo del backend y rellena las credenciales de Google."
  exit 1
fi

missing=()
grep -q '^GOOGLE_DRIVE_CLIENT_ID=.\+' "$ENV_FILE" || missing+=(GOOGLE_DRIVE_CLIENT_ID)
grep -q '^GOOGLE_DRIVE_CLIENT_SECRET=.\+' "$ENV_FILE" || missing+=(GOOGLE_DRIVE_CLIENT_SECRET)
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "En $ENV_FILE faltan o están vacías: ${missing[*]}"
  exit 1
fi

echo "OK: $ENV_FILE tiene CLIENT_ID y CLIENT_SECRET (Docker usa este mismo archivo)."
echo ""
echo "Reinicia el stack para aplicar: docker compose -f docker-compose.internal.yml up -d"
echo "Comprueba: curl -s http://127.0.0.1:18081/api/google-drive/status"
