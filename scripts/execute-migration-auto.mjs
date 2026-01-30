#!/usr/bin/env node

/**
 * Auto-Execute Migration Script
 * 
 * This script attempts to execute the migration automatically.
 * If automatic execution is not possible, it provides clear instructions.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

// SQL Migration
const sql = `ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);`;

console.log('🔧 [AUTO-MIGRATION] Versuche automatische Migration...');
console.log('🔧 [AUTO-MIGRATION] Projekt:', projectRef);
console.log('');

// Try Method 1: Supabase CLI (if logged in)
try {
  console.log('📝 [METHODE 1] Versuche über Supabase CLI...');
  
  // Check if supabase CLI is available
  execSync('which supabase', { stdio: 'ignore' });
  
  // Try to execute via migration push
  const migrationFile = join(__dirname, '..', 'supabase', 'migrations', '20251120000002_add_is_active_to_vereinbarungstitel.sql');
  
  try {
    execSync(`supabase db push --project-ref ${projectRef}`, {
      cwd: join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ [ERFOLG] Migration erfolgreich über CLI ausgeführt!');
    process.exit(0);
  } catch (cliError) {
    if (cliError.message?.includes('not logged in') || cliError.message?.includes('Access token')) {
      console.log('⚠️  [CLI] Nicht eingeloggt. Versuche nächste Methode...');
    } else {
      throw cliError;
    }
  }
} catch (error) {
  console.log('⚠️  [METHODE 1] CLI nicht verfügbar oder nicht eingeloggt.');
}

// Try Method 2: Direct SQL execution via API (not possible for DDL)
console.log('');
console.log('📝 [METHODE 2] Versuche über REST API...');
console.log('⚠️  [INFO] Supabase erlaubt keine DDL-Operationen über REST API.');
console.log('');

// Fallback: Provide instructions
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 MIGRATION SQL (zum Kopieren):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log(sql);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📍 Bitte führen Sie die Migration manuell aus:');
console.log('');
console.log(`1. Öffnen Sie: https://supabase.com/dashboard/project/${projectRef}`);
console.log('2. Gehen Sie zu "SQL Editor"');
console.log('3. Kopieren Sie das SQL oben');
console.log('4. Klicken Sie auf "Run"');
console.log('');
console.log('📖 Detaillierte Anleitung: DOKU/MIGRATION_IS_ACTIVE_TITEL.md');
console.log('');

process.exit(1);

