#!/bin/sh
set -e

# Dokku postgres:link sets DATABASE_URL; fall back to POSTGRES_URL alias
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_URL" ]; then
  export DATABASE_URL="$POSTGRES_URL"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Run: dokku postgres:link <db-name> course-provisioning-api"
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node dist/main
