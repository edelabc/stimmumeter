#!/usr/bin/env node

/**
 * Execute SQL Migration Directly
 * 
 * This script uses Supabase CLI to execute the migration SQL
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlPath = join(__dirname, '..', 'FIX_IS_ACTIVE_COLUMN.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('🔧 [MIGRATION] Versuche Migration über Supabase CLI...');

try {
  // Try to execute via Supabase CLI
  // Note: This requires being logged in: supabase login
  const output = execSync(
    `supabase db execute --file "${sqlPath}" --project-ref apacsqcodgyohiebjhjb`,
    { encoding: 'utf-8', stdio: 'inherit' }
  );
  
  console.log('✅ [MIGRATION] Erfolgreich ausgeführt!');
  console.log(output);
} catch (error) {
  console.error('❌ [MIGRATION] Fehler bei CLI-Ausführung:', error.message);
  console.log('');
  console.log('⚠️  Alternative: Bitte führen Sie die Migration manuell aus:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📍 Anleitung:');
  console.log('1. Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb');
  console.log('2. Gehen Sie zu "SQL Editor"');
  console.log('3. Kopieren Sie das SQL oben');
  console.log('4. Klicken Sie auf "Run"');
  process.exit(1);
}

