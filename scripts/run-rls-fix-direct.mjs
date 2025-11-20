#!/usr/bin/env node

/**
 * Execute RLS Fix Migration directly via Supabase REST API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://apacsqcodgyohiebjhjb.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

// Read migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251120130000_fix_mood_indicators_rls_allow_defaults.sql');
let migrationSQL = readFileSync(migrationPath, 'utf-8');

// Remove comments and clean SQL
migrationSQL = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('*') && !line.trim().startsWith('*/') && !line.trim().startsWith('#'))
  .filter(line => line.trim() !== '')
  .join('\n')
  .trim();

async function executeMigration() {
  console.log('🔧 [MIGRATION] Starte RLS-Fix Migration...');
  console.log('🔧 [MIGRATION] Supabase URL:', supabaseUrl);
  console.log('');
  console.log('📝 [MIGRATION] SQL:');
  console.log(migrationSQL);
  console.log('');

  if (!supabaseServiceRoleKey) {
    console.error('❌ Fehler: SUPABASE_SERVICE_ROLE_KEY nicht gefunden!');
    console.log('');
    console.log('📝 Bitte führen Sie die Migration manuell aus:');
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
    process.exit(1);
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute SQL statements one by one
    const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
    
    console.log(`📊 [MIGRATION] Führe ${statements.length} SQL-Statement(s) aus...`);
    console.log('');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`📝 [MIGRATION] Statement ${i + 1}/${statements.length}:`);
      console.log(statement);
      console.log('');

      try {
        // Use Supabase REST API to execute SQL via pg_net or similar
        // Since direct DDL execution isn't supported via REST API,
        // we'll use the Management API endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement + ';' }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ [MIGRATION] Statement ${i + 1} erfolgreich!`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️  [MIGRATION] RPC-Methode nicht verfügbar für Statement ${i + 1}`);
          console.log(`📝 [MIGRATION] Bitte führen Sie die Migration manuell aus (siehe oben)`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`❌ [MIGRATION] Fehler bei Statement ${i + 1}:`, error.message);
        console.log(`📝 [MIGRATION] Bitte führen Sie die Migration manuell aus (siehe oben)`);
        process.exit(1);
      }
    }

    console.log('');
    console.log('✅ [MIGRATION] Alle Statements erfolgreich ausgeführt!');
    process.exit(0);

  } catch (error) {
    console.error('❌ [MIGRATION] Fehler:', error.message);
    console.log('');
    console.log('📝 [MIGRATION] Bitte führen Sie die Migration manuell aus:');
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
    process.exit(1);
  }
}

executeMigration();

