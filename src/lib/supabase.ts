/**
 * DEPRECATED: Diese Datei wird nicht mehr verwendet
 * Alle Supabase-Funktionalität wurde auf MySQL umgestellt
 * Diese Datei bleibt nur für Kompatibilität mit bestehenden Type-Imports
 */

// Leere Exports für Kompatibilität
export const supabase: any = null;
export const isSupabaseConfigured = (): boolean => false;
export const isSupabaseAvailable = (): boolean => false;

// Type-Definitionen (werden noch verwendet)
export interface Pseudonym {
  id: string;
  name: string;
  color: string;
  created_at: string;
  user_id: string;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  occupation?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  city_addition?: string | null;
  street?: string | null;
  house_number?: string | null;
  house_number_addition?: string | null;
  language?: string | null;
}

export interface IndicatorCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodIndicator {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  min_value: number;
  max_value: number;
  step_value: number;
  color_start: string;
  color_end: string;
  user_id: string | null;
  icon_url?: string | null;
  category_id?: string | null;
  category?: IndicatorCategory | null;
  description?: string | null;
}

export interface MoodEntry {
  id: string;
  pseudonym_id: string;
  note: string | null;
  created_at: string;
  entry_date: string;
  time_of_day?: string | null;
  weather?: string | null;
  weather_code?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  temperature?: number | null;
  custom_tags?: string[] | null;
  location?: string | null;
}

export interface MoodIndicatorValue {
  id: string;
  mood_entry_id: string;
  indicator_id: string;
  value: number;
  created_at: string;
}

export interface MoodEntryWithValues extends MoodEntry {
  values: Array<{
    indicator_id: string;
    indicator_name: string;
    indicator_color: string;
    indicator_description?: string | null;
    value: number;
  }>;
}

export interface AIConfiguration {
  id: string;
  user_id: string;
  nickname: string;
  provider: 'openai' | 'gemini' | 'claude' | 'xai' | 'manus';
  model: string;
  api_key: string;
  text_color: string;
  background_color: string;
  is_active: boolean;
  is_enabled: boolean;
  system_prompt?: string | null;
  created_at: string;
  updated_at: string;
}

// Dummy-Type für Kompatibilität
export type SupabaseClient = any;
