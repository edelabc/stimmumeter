#!/bin/bash

# Script to apply RLS fix migration
# This script executes the SQL migration directly

echo "🔧 [MIGRATION] Starte RLS-Fix Migration..."
echo ""

# Read the migration SQL
MIGRATION_FILE="supabase/migrations/20251120130000_fix_mood_indicators_rls_allow_defaults.sql"
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Extract only the SQL statements (remove comments)
SQL_STATEMENTS=$(echo "$SQL_CONTENT" | grep -v "^/\*" | grep -v "^\*" | grep -v "^#.*" | grep -v "^--.*" | grep -v "^$" | sed 's/^  //')

echo "📝 [MIGRATION] SQL-Statements:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SQL_STATEMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase CLI is available and logged in
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI gefunden"
    
    # Try to execute via Supabase CLI
    echo "📡 Versuche Migration über Supabase CLI..."
    
    # Check if project is linked
    if [ -f ".supabase/config.toml" ]; then
        echo "✅ Projekt ist verlinkt"
        echo "📝 Führe Migration aus..."
        
        # Use psql if available via Supabase
        if command -v psql &> /dev/null; then
            echo "✅ psql gefunden"
            echo "⚠️  Bitte führen Sie die Migration manuell über das Supabase Dashboard aus"
        else
            echo "⚠️  psql nicht gefunden"
            echo "📝 Bitte führen Sie die Migration manuell über das Supabase Dashboard aus"
        fi
    else
        echo "⚠️  Projekt ist nicht verlinkt"
        echo "📝 Bitte führen Sie die Migration manuell über das Supabase Dashboard aus"
    fi
else
    echo "⚠️  Supabase CLI nicht gefunden"
    echo "📝 Bitte führen Sie die Migration manuell über das Supabase Dashboard aus"
fi

echo ""
echo "📍 Anleitung für manuelle Ausführung:"
echo "1. Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb"
echo "2. Gehen Sie zu 'SQL Editor'"
echo "3. Kopieren Sie das SQL oben"
echo "4. Klicken Sie auf 'Run'"
echo ""

