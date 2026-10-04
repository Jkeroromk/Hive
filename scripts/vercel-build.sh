#!/bin/sh
# Vercel runs this instead of `npm run build`.
# Production deploys sync the Prisma schema to the database first, over the
# direct (non-pooled) connection. Preview deploys share the same database,
# so they never touch the schema.
# `db push` refuses changes that would lose data, which fails the deploy
# instead of dropping anything.
set -e

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Syncing database schema…"
  DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx prisma db push --skip-generate
fi

npx next build
