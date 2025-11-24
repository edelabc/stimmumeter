#!/usr/bin/env node

/**
 * Mood Assessment System Migration Runner
 * 
 * Dieses Script führt die Migration für das Mood Assessment System aus.
 * 
 * Verwendung:
 *   node scripts/run-mood-assessment-migration.mjs
 * 
 * Oder manuell über Supabase Dashboard:
 *   1. Öffne: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb/editor
 *   2. Gehe zu "SQL Editor"
 *   3. Kopiere den Inhalt von: supabase/migrations/20251122000000_create_mood_assessment_system.sql
 *   4. Klicke auf "Run"
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lade Migration-Datei
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251122000000_create_mood_assessment_system.sql');

console.log('📋 Mood Assessment System Migration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

try {
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('✅ Migration-Datei geladen:', migrationPath);
  console.log('');
  console.log('⚠️  WICHTIG: Dieses Script kann die Migration nicht automatisch ausführen.');
  console.log('   Die Migration muss über das Supabase Dashboard ausgeführt werden.');
  console.log('');
  console.log('📝 ANLEITUNG:');
  console.log('');
  console.log('1. Öffne das Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb/editor');
  console.log('');
  console.log('2. Klicke auf "SQL Editor" im linken Menü');
  console.log('');
  console.log('3. Kopiere den folgenden SQL-Code:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(migrationSQL);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('4. Füge den Code in den SQL Editor ein');
  console.log('');
  console.log('5. Klicke auf "Run" oder drücke Ctrl+Enter (Windows) / Cmd+Enter (Mac)');
  console.log('');
  console.log('6. Warte auf die Bestätigung "Success"');
  console.log('');
  console.log('✅ Nach erfolgreicher Migration sollten die 404-Fehler verschwinden!');
  console.log('');
  
  // Versuche auch, die Migration-Datei in die Zwischenablage zu kopieren (falls möglich)
  console.log('💡 TIPP: Die Migration-Datei befindet sich hier:');
  console.log('   ' + migrationPath);
  console.log('');
  
} catch (error) {
  console.error('❌ Fehler beim Laden der Migration-Datei:', error.message);
  console.log('');
  console.log('📝 Migration-Datei manuell öffnen:');
  console.log('   ' + migrationPath);
  process.exit(1);
}


