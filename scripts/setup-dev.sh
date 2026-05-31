#!/usr/bin/env bash
# setup-dev.sh — Bootstrap the local development environment from scratch.
# Run once after cloning: bash scripts/setup-dev.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

info "=== SUNR Circle — Development Setup ==="

# 1. Check prerequisites
command -v node    >/dev/null 2>&1 || { echo "Node.js 20+ required"; exit 1; }
command -v flutter >/dev/null 2>&1 || { echo "Flutter 3.19+ required"; exit 1; }
command -v supabase>/dev/null 2>&1 || { warn "Supabase CLI not found — installing..."; npm install -g supabase; }
command -v docker  >/dev/null 2>&1 || { echo "Docker Desktop required for local Supabase"; exit 1; }

# 2. Admin panel dependencies
info "Installing Admin Panel dependencies..."
cd apps/admin
npm install
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  warn "Created apps/admin/.env.local — fill in your Supabase credentials before running."
fi
cd ../..

# 3. Mobile app dependencies
info "Installing Flutter dependencies..."
cd apps/mobile
flutter pub get
if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created apps/mobile/.env — fill in your Supabase credentials before running."
fi
cd ../..

# 4. Local Supabase
info "Starting local Supabase (Docker)..."
cd supabase
supabase start
info "Running database migrations..."
supabase db push
cd ..

info ""
info "=== Setup Complete ==="
info "Next steps:"
info "  1. Edit apps/admin/.env.local with local Supabase URL + keys (run: supabase status)"
info "  2. Edit apps/mobile/.env with the same credentials"
info "  3. Create auth users in Supabase Dashboard, then run: psql ... -f supabase/seed/dev_seed.sql"
info "  4. Start admin: cd apps/admin && npm run dev"
info "  5. Start mobile: cd apps/mobile && flutter run --dart-define-from-file=.env"
