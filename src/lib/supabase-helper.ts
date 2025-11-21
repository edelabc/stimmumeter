/**
 * Helper-Funktionen für sichere Supabase-Verwendung
 * Prüft ob Supabase konfiguriert ist bevor es verwendet wird
 */

import { supabase, isSupabaseAvailable } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gibt den Supabase Client zurück oder wirft einen Fehler wenn nicht konfiguriert
 * Verwenden Sie diese Funktion wenn Supabase zwingend erforderlich ist
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase ist nicht konfiguriert. ' +
      'Bitte setzen Sie VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in der .env Datei.'
    );
  }
  return supabase;
}

/**
 * Prüft ob Supabase verfügbar ist
 */
export { isSupabaseAvailable };

/**
 * Führt eine Supabase-Operation aus, nur wenn Supabase verfügbar ist
 * Gibt null zurück wenn Supabase nicht konfiguriert ist
 */
export async function safeSupabaseCall<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T | null> {
  if (!supabase) {
    console.warn('Supabase nicht konfiguriert - Operation übersprungen');
    return null;
  }
  
  try {
    return await operation(supabase);
  } catch (error) {
    console.error('Supabase-Operation fehlgeschlagen:', error);
    return null;
  }
}

