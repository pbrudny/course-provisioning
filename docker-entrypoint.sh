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

# Write .env to both locations so dotenv/config finds it wherever prisma.config.ts runs from
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > /app/.env
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > /app/prisma/.env

echo "Running database migrations..."
npx prisma migrate deploy

rm -f /app/.env /app/prisma/.env

echo "Starting application..."
exec node dist/main
