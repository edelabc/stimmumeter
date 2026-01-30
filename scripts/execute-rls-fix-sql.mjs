#!/usr/bin/env node

/**
 * Execute RLS Fix Migration via Supabase REST API
 * This script executes the SQL directly via Supabase Management API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251120130000_fix_mood_indicators_rls_allow_defaults.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Extract only SQL statements (remove comments)
const sqlStatements = migrationSQL
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('/*') && 
           !trimmed.startsWith('*') && 
           !trimmed.startsWith('*/') && 
           !trimmed.startsWith('#') &&
           !trimmed.startsWith('--');
  })
  .join('\n')
  .trim();

console.log('🔧 [MIGRATION] RLS-Fix für mood_indicators');
console.log('');
console.log('📝 [MIGRATION] SQL:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(sqlStatements);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Try to execute via Supabase Management API
const supabaseUrl = 'https://apacsqcodgyohiebjhjb.supabase.co';
const projectRef = 'apacsqcodgyohiebjhjb';

// Check for service role key in environment
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (serviceRoleKey) {
  console.log('🔑 Service Role Key gefunden, versuche automatische Ausführung...');
  
  try {
    // Execute via Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query: sqlStatements
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [MIGRATION] Erfolgreich ausgeführt!');
      console.log('📊 Ergebnis:', result);
      process.exit(0);
    } else {
      const errorText = await response.text();
      console.log('⚠️  API-Fehler:', errorText);
      console.log('📝 Bitte führen Sie die Migration manuell aus (siehe SQL oben)');
    }
  } catch (error) {
    console.log('⚠️  Fehler bei API-Aufruf:', error.message);
    console.log('📝 Bitte führen Sie die Migration manuell aus (siehe SQL oben)');
  }
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY nicht gefunden');
  console.log('📝 Bitte führen Sie die Migration manuell aus:');
  console.log('');
  console.log('📍 Anleitung:');
  console.log(`1. Öffnen Sie: https://supabase.com/dashboard/project/${projectRef}`);
  console.log('2. Gehen Sie zu "SQL Editor"');
  console.log('3. Kopieren Sie das SQL oben');
  console.log('4. Klicken Sie auf "Run"');
  console.log('');
  console.log('💡 Tipp: Setzen Sie SUPABASE_SERVICE_ROLE_KEY für automatische Ausführung');
}

process.exit(0);

