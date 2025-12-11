#!/usr/bin/env bash
set -euo pipefail

# copy-db-if-needed.sh
# Copia `BDTravelPin.db` desde el repo al directorio persistente indicado
# por `DATABASE_PATH` (o `DB_PATH`) si aún no existe. Luego arranca el servidor.

TARGET_DB_PATH="${DATABASE_PATH:-${DB_PATH:-/data/BDTravelPin.db}}"
TARGET_DIR="$(dirname "$TARGET_DB_PATH")"

echo "[copy-db-if-needed] TARGET_DB_PATH=$TARGET_DB_PATH"

# Crear directorio destino si no existe
mkdir -p "$TARGET_DIR"

# Si no existe la DB en destino y existe una copia en el repo, copiarla
if [ ! -f "$TARGET_DB_PATH" ]; then
  if [ -f "./BDTravelPin.db" ]; then
    echo "[copy-db-if-needed] Copiando BD local -> $TARGET_DB_PATH"
    cp ./BDTravelPin.db "$TARGET_DB_PATH"
    chmod 644 "$TARGET_DB_PATH"
  else
    echo "[copy-db-if-needed] No hay BD en el repo para copiar. Se creará una nueva cuando el servidor haga seed si procede."
  fi
else
  echo "[copy-db-if-needed] BD ya existe en destino: $TARGET_DB_PATH"
fi

echo "[copy-db-if-needed] Iniciando server.js (usando DATABASE_PATH=$TARGET_DB_PATH)"
export DATABASE_PATH="$TARGET_DB_PATH"
exec node server.js
