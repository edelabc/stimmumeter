#!/usr/bin/env node

/**
 * Migration Script: Add is_active column to t_vereinbarungstitel
 * 
 * This script executes the migration to add the is_active column
 * to the t_vereinbarungstitel table in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Fehler: Supabase-Credentials fehlen!');
  console.error('Bitte setzen Sie:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (oder VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

console.log('🔧 [MIGRATION] Starte Migration...');
console.log('🔧 [MIGRATION] Supabase URL:', supabaseUrl);

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL Migration Script
const migrationSQL = `
-- Füge is_active Feld hinzu (nur wenn es noch nicht existiert)
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Kommentar hinzufügen
COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);
`;

async function runMigration() {
  try {
    console.log('📝 [MIGRATION] Führe SQL aus...');
    
    // Execute SQL via Supabase REST API
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API or PostgREST
    
    // Try using rpc if we have a function, otherwise use direct REST call
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ sql: migrationSQL }),
    });

    // If rpc doesn't exist, try alternative approach
    if (!response.ok) {
      console.log('⚠️  [MIGRATION] RPC-Methode nicht verfügbar, verwende alternativen Ansatz...');
      
      // Alternative: Execute via PostgREST using pg_net or direct connection
      // Since we can't execute raw SQL directly, we'll check if column exists first
      // and provide instructions
      
      console.log('📋 [MIGRATION] Prüfe ob Spalte bereits existiert...');
      
      // Check if column exists by trying to query it
      const { data, error } = await supabase
        .from('t_vereinbarungstitel')
        .select('is_active')
        .limit(1);
      
      if (error) {
        if (error.message?.includes('is_active') || error.code === 'PGRST205') {
          console.log('✅ [MIGRATION] Spalte existiert noch nicht - Migration erforderlich');
          console.log('');
          console.log('⚠️  [MIGRATION] Automatische Migration über API nicht möglich.');
          console.log('📝 [MIGRATION] Bitte führen Sie das SQL-Script manuell in Supabase aus:');
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(migrationSQL);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('📍 Anleitung:');
          console.log('1. Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb');
          console.log('2. Gehen Sie zu "SQL Editor"');
          console.log('3. Kopieren Sie das SQL oben');
          console.log('4. Klicken Sie auf "Run"');
          process.exit(0);
        } else {
          throw error;
        }
      } else {
        console.log('✅ [MIGRATION] Spalte is_active existiert bereits!');
        console.log('✅ [MIGRATION] Migration nicht erforderlich.');
        process.exit(0);
      }
    } else {
      const result = await response.json();
      console.log('✅ [MIGRATION] Erfolgreich ausgeführt!');
      console.log('📊 [MIGRATION] Ergebnis:', result);
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ [MIGRATION] Fehler:', error.message);
    console.error('');
    console.log('📝 [MIGRATION] Bitte führen Sie das SQL-Script manuell aus:');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(migrationSQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

runMigration();

