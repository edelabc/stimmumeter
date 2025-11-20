#!/usr/bin/env node

/**
 * Migration Script: Add is_active column to t_vereinbarungstitel
 * 
 * This script checks if the column exists and provides instructions
 * if manual migration is needed.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️  Konnte .env Datei nicht laden, verwende Umgebungsvariablen');
    return {};
  }
}

const env = loadEnv();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Fehler: Supabase-Credentials fehlen!');
  console.error('Bitte setzen Sie:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 [MIGRATION] Prüfe Datenbank-Schema...');
console.log('🔧 [MIGRATION] Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL Migration Script
const migrationSQL = `-- Füge is_active Feld hinzu (nur wenn es noch nicht existiert)
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Kommentar hinzufügen
COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);`;

async function checkAndMigrate() {
  try {
    console.log('📋 [MIGRATION] Prüfe ob Spalte is_active existiert...');
    
    // Try to query the column - if it doesn't exist, we'll get an error
    const { data, error } = await supabase
      .from('t_vereinbarungstitel')
      .select('id, titel, is_active')
      .limit(1);
    
    if (error) {
      if (error.message?.includes('is_active') || error.code === 'PGRST205' || error.message?.includes('column')) {
        console.log('⚠️  [MIGRATION] Spalte is_active existiert noch nicht!');
        console.log('');
        console.log('📝 [MIGRATION] Bitte führen Sie das SQL-Script in Supabase aus:');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(migrationSQL);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📍 Anleitung:');
        console.log('1. Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb');
        console.log('2. Gehen Sie zu "SQL Editor"');
        console.log('3. Kopieren Sie das SQL oben');
        console.log('4. Klicken Sie auf "Run" oder drücken Sie Ctrl+Enter / Cmd+Enter');
        console.log('');
        process.exit(1);
      } else {
        throw error;
      }
    } else {
      console.log('✅ [MIGRATION] Spalte is_active existiert bereits!');
      console.log('✅ [MIGRATION] Migration nicht erforderlich.');
      console.log('📊 [MIGRATION] Gefundene Daten:', data?.length || 0, 'Einträge');
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

checkAndMigrate();

