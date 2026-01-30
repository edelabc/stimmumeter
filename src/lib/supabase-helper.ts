/**
 * DEPRECATED: Diese Datei wird nicht mehr verwendet
 * Alle Supabase-Funktionalität wurde auf MySQL umgestellt
 */

// Leere Exports für Kompatibilität
export function getSupabaseClient(): any {
  throw new Error('Supabase wurde entfernt. Bitte verwenden Sie die MySQL-basierte API.');
}

export const isSupabaseAvailable = (): boolean => false;
