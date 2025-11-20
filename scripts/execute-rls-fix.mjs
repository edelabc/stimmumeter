#!/usr/bin/env node

/**
 * Execute RLS Fix Migration: Allow Default Mood Indicators
 * 
 * This script executes the SQL migration directly via Supabase
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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

// Read migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251120130000_fix_mood_indicators_rls_allow_defaults.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function executeMigration() {
  console.log('🔧 [MIGRATION] Starte RLS-Fix Migration...');
  console.log('🔧 [MIGRATION] Supabase URL:', supabaseUrl);
  
  if (!supabaseUrl) {
    console.error('❌ Fehler: VITE_SUPABASE_URL nicht gefunden!');
    process.exit(1);
  }

  // Extract project reference from URL
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Fehler: Konnte Projekt-Referenz nicht aus URL extrahieren!');
    process.exit(1);
  }

  console.log('📋 [MIGRATION] Projekt-Referenz:', projectRef);
  console.log('📝 [MIGRATION] SQL:', migrationSQL);
  console.log('');

  // Try using Supabase client with service role key for direct SQL execution
  if (supabaseServiceRoleKey) {
    console.log('🔑 [MIGRATION] Verwende Service Role Key...');
    
    try {
      // Create Supabase client with service role key
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Execute SQL via RPC if available, otherwise use direct query
      // Note: Supabase JS client doesn't support direct DDL execution
      // We'll use the REST API directly
      console.log('📡 [MIGRATION] Versuche Migration über REST API...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({ sql: migrationSQL }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [MIGRATION] Erfolgreich ausgeführt!');
        console.log('📊 [MIGRATION] Ergebnis:', result);
        process.exit(0);
      } else {
        const errorText = await response.text();
        console.log('⚠️  [MIGRATION] RPC-Methode nicht verfügbar.');
        console.log('📝 [MIGRATION] Versuche alternative Methode...');
      }
    } catch (error) {
      console.log('⚠️  [MIGRATION] API-Fehler:', error.message);
    }
  }

  // Fallback: Use Supabase CLI if available
  console.log('📝 [MIGRATION] Versuche Migration über Supabase CLI...');
  
  try {
    const { execSync } = await import('child_process');
    
    // Try to execute via Supabase CLI
    const output = execSync(
      `supabase db execute --file "${migrationPath}" --project-ref ${projectRef}`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
    
    console.log('✅ [MIGRATION] Erfolgreich über CLI ausgeführt!');
    process.exit(0);
  } catch (error) {
    console.log('⚠️  [MIGRATION] CLI nicht verfügbar oder nicht eingeloggt.');
    console.log('');
    console.log('📝 [MIGRATION] Bitte führen Sie die Migration manuell aus:');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(migrationSQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📍 Anleitung:');
    console.log(`1. Öffnen Sie: https://supabase.com/dashboard/project/${projectRef}`);
    console.log('2. Gehen Sie zu "SQL Editor"');
    console.log('3. Kopieren Sie das SQL oben');
    console.log('4. Klicken Sie auf "Run"');
    console.log('');
    console.log('🔧 Alternative: Supabase CLI verwenden:');
    console.log(`   supabase db execute --file "${migrationPath}" --project-ref ${projectRef}`);
    process.exit(1);
  }
}

executeMigration();

