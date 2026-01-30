#!/bin/bash

# Migration Script: Add is_active column to t_vereinbarungstitel
# This script executes the SQL migration via Supabase API

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 [MIGRATION] Starte Migration...${NC}"

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Fehler: VITE_SUPABASE_URL nicht gefunden!${NC}"
    exit 1
fi

echo -e "${GREEN}🔧 [MIGRATION] Supabase URL: $SUPABASE_URL${NC}"

# Extract project reference
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\)\.supabase\.co.*/\1/p')

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Fehler: Konnte Projekt-Referenz nicht extrahieren!${NC}"
    exit 1
fi

echo -e "${GREEN}📋 [MIGRATION] Projekt-Referenz: $PROJECT_REF${NC}"

# SQL Migration
SQL="ALTER TABLE t_vereinbarungstitel ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true; COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.'; CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active ON t_vereinbarungstitel(is_active);"

echo -e "${YELLOW}⚠️  [MIGRATION] Automatische Migration über API nicht möglich.${NC}"
echo -e "${YELLOW}📝 [MIGRATION] Bitte führen Sie die Migration manuell aus:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "-- Füge is_active Feld hinzu"
echo "ALTER TABLE t_vereinbarungstitel"
echo "ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;"
echo ""
echo "-- Kommentar hinzufügen"
echo "COMMENT ON COLUMN t_vereinbarungstitel.is_active IS"
echo "  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';"
echo ""
echo "-- Index für bessere Performance"
echo "CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active"
echo "ON t_vereinbarungstitel(is_active);"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}📍 Anleitung:${NC}"
echo "1. Öffnen Sie: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "2. Gehen Sie zu 'SQL Editor'"
echo "3. Kopieren Sie das SQL oben"
echo "4. Klicken Sie auf 'Run' oder drücken Sie Ctrl+Enter / Cmd+Enter"
echo ""
echo -e "${YELLOW}💡 Tipp: Die SQL-Datei befindet sich in: FIX_IS_ACTIVE_COLUMN.sql${NC}"

