#!/usr/bin/env bash
# run-migrations.sh — Apply Supabase migrations to a target environment.
# Usage: bash scripts/run-migrations.sh [dev|staging|prod]

set -euo pipefail

ENV=${1:-dev}

case "$ENV" in
  dev)
    echo "[INFO] Applying migrations to LOCAL Supabase..."
    cd supabase && supabase db push
    ;;
  staging)
    echo "[INFO] Applying migrations to STAGING..."
    [ -z "${STAGING_PROJECT_REF:-}" ] && { echo "Set STAGING_PROJECT_REF env var"; exit 1; }
    [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && { echo "Set SUPABASE_ACCESS_TOKEN env var"; exit 1; }
    cd supabase
    supabase link --project-ref "$STAGING_PROJECT_REF"
    supabase db push --project-ref "$STAGING_PROJECT_REF"
    ;;
  prod)
    echo "[WARN] Applying migrations to PRODUCTION — this is irreversible!"
    read -r -p "Type YES to confirm: " confirm
    [ "$confirm" != "YES" ] && { echo "Aborted."; exit 1; }
    [ -z "${PROD_PROJECT_REF:-}" ] && { echo "Set PROD_PROJECT_REF env var"; exit 1; }
    [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && { echo "Set SUPABASE_ACCESS_TOKEN env var"; exit 1; }
    cd supabase
    supabase link --project-ref "$PROD_PROJECT_REF"
    supabase db push --project-ref "$PROD_PROJECT_REF"
    ;;
  *)
    echo "Usage: $0 [dev|staging|prod]"
    exit 1
    ;;
esac

echo "[INFO] Migrations applied successfully."
