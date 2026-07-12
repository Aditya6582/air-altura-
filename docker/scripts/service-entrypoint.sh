#!/bin/sh
set -eu

if [ -n "${WAIT_FOR:-}" ]; then
  OLD_IFS=$IFS
  IFS=','
  for target in $WAIT_FOR; do
    host="${target%:*}"
    port="${target##*:}"
    echo "Waiting for ${host}:${port}..."
    node /opt/docker-scripts/wait-for-tcp.js "$host" "$port" "${WAIT_TIMEOUT_MS:-120000}"
  done
  IFS=$OLD_IFS
fi

if [ -n "${MIGRATE_CMD:-}" ]; then
  echo "Running migrations..."
  sh -lc "$MIGRATE_CMD"
fi

if [ -n "${SEED_CMD:-}" ]; then
  echo "Running seeders..."
  sh -lc "$SEED_CMD"
fi

exec sh -lc "${START_CMD:-npm start}"
