#!/usr/bin/env node

/**
 * Execute Migration: Add is_active column to t_vereinbarungstitel
 * 
 * This script executes the SQL migration directly via Supabase REST API
 */

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
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

// SQL Migration
const migrationSQL = `ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);`;

async function executeMigration() {
  console.log('🔧 [MIGRATION] Starte Migration...');
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
  
  // Try to execute via Supabase Management API
  // Note: This requires Service Role Key or API token
  if (!supabaseServiceRoleKey) {
    console.log('⚠️  [MIGRATION] Service Role Key nicht gefunden.');
    console.log('📝 [MIGRATION] Versuche Migration über Supabase Dashboard API...');
    console.log('');
    console.log('Bitte führen Sie die Migration manuell aus:');
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
    process.exit(1);
  }

  try {
    // Execute SQL via Supabase REST API (PostgREST)
    // Note: PostgREST doesn't support DDL operations directly
    // We need to use the Management API or pg_net extension
    
    console.log('📝 [MIGRATION] Versuche Migration über Management API...');
    
    // Try using pg_net if available (requires Edge Function or direct DB access)
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
      console.log('⚠️  [MIGRATION] API-Methode nicht verfügbar.');
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
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ [MIGRATION] Fehler:', error.message);
    console.log('');
    console.log('📝 [MIGRATION] Bitte führen Sie die Migration manuell aus:');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(migrationSQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

executeMigration();

