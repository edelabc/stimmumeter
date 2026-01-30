#!/usr/bin/env node

/**
 * Auto-Migration Script
 * 
 * This script provides the SQL and instructions for manual execution,
 * as Supabase doesn't allow DDL operations via REST API for security reasons.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load SQL file
const sqlPath = join(__dirname, '..', 'FIX_IS_ACTIVE_COLUMN.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 MIGRATION SQL (zum Kopieren):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log(sql);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('⚠️  WICHTIG: Supabase erlaubt keine automatische SQL-Ausführung');
console.log('   über die REST API aus Sicherheitsgründen.');
console.log('');
console.log('📍 Bitte führen Sie die Migration manuell aus:');
console.log('   1. Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb');
console.log('   2. Gehen Sie zu "SQL Editor"');
console.log('   3. Kopieren Sie das SQL oben');
console.log('   4. Klicken Sie auf "Run"');
console.log('');

