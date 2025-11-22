/**
 * API Service für Live-Mood-Daten
 * Basiert auf der API_DOCUMENTATION.md aus startsite/Version1
 */

export interface MoodDataCell {
  lat: number;
  lng: number;
  mood_score: number;
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  city?: string;
  country?: string;
  dominant_indicator?: string;
  top_indicators?: Array<{
    name: string;
    emoji?: string;
    share: number;
  }>;
}

export interface LiveMoodResponse {
  time_window: string;
  generated_at: string;
  total_entries: number;
  cells: MoodDataCell[];
}

export interface GuessRequest {
  user_id: string;
  session_id: string;
  lat: number;
  lng: number;
  guess: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  captcha_token?: string;
}

export interface GuessResponse {
  correct: boolean;
  actual_state: 'positive' | 'neutral' | 'negative';
  yra_earned: number;
  streak: number;
  total_yra_balance: number;
  next_location?: {
    lat: number;
    lng: number;
    hint?: string;
  };
}

/**
 * Lädt Live-Mood-Daten vom Backend
 */
export async function fetchLiveMoodData(
  timeWindow: '15m' | '1h' | '24h' | '7d' = '15m',
  zoom: number = 5
): Promise<LiveMoodResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${apiBaseUrl}/api/mood/live?time_window=${timeWindow}&zoom=${zoom}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: LiveMoodResponse = await response.json();
    return data;
  } catch (error: any) {
    // Prüfe ob es ein HTML-Fehler ist (404, etc.)
    if (error.message && error.message.includes('<!doctype')) {
      console.warn('⚠️ [MOOD-API] API-Endpunkt nicht verfügbar, verwende Demo-Daten');
    } else {
      console.error('❌ Fehler beim Laden der Live-Mood-Daten:', error);
    }
    
    // Fallback: Leere Antwort mit Demo-Daten-Struktur
    return {
      time_window: timeWindow,
      generated_at: new Date().toISOString(),
      total_entries: 0,
      cells: [],
    };
  }
}

/**
 * Sendet eine Guess-Verifizierung an das Backend
 */
export async function submitGuess(request: GuessRequest): Promise<GuessResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${apiBaseUrl}/api/mood/guess`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: GuessResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Guess:', error);
    // Fallback: Lokale Verifizierung
    return {
      correct: false,
      actual_state: 'neutral',
      yra_earned: 0,
      streak: 0,
      total_yra_balance: 0,
    };
  }
}

/**
 * Generiert Demo-Daten für die Visualisierung
 * Wird verwendet, wenn die API nicht verfügbar ist
 */
export function generateDemoMoodData(): MoodDataCell[] {
  return [
    {
      lat: 50.94,
      lng: 6.96,
      mood_score: 0.7,
      state: 'positive',
      count: 234,
      city: 'Köln',
      country: 'Deutschland',
      dominant_indicator: 'optimistisch',
      top_indicators: [
        { name: 'optimistisch', emoji: '😊', share: 0.32 },
        { name: 'motiviert', emoji: '💪', share: 0.21 },
        { name: 'freundlich', emoji: '🤗', share: 0.19 },
      ],
    },
    {
      lat: 40.71,
      lng: -74.00,
      mood_score: -0.3,
      state: 'negative',
      count: 567,
      city: 'New York',
      country: 'USA',
      dominant_indicator: 'angespannt',
      top_indicators: [
        { name: 'angespannt', emoji: '😰', share: 0.28 },
        { name: 'müde', emoji: '😴', share: 0.24 },
        { name: 'gestresst', emoji: '😓', share: 0.17 },
      ],
    },
    {
      lat: 35.68,
      lng: 139.69,
      mood_score: 0.1,
      state: 'neutral',
      count: 432,
      city: 'Tokyo',
      country: 'Japan',
      dominant_indicator: 'ausgeglichen',
      top_indicators: [
        { name: 'ausgeglichen', emoji: '😐', share: 0.35 },
        { name: 'ruhig', emoji: '😌', share: 0.22 },
        { name: 'konzentriert', emoji: '🧘', share: 0.18 },
      ],
    },
    {
      lat: -33.86,
      lng: 151.21,
      mood_score: 0.8,
      state: 'positive',
      count: 321,
      city: 'Sydney',
      country: 'Australien',
      dominant_indicator: 'glücklich',
      top_indicators: [
        { name: 'glücklich', emoji: '😄', share: 0.38 },
        { name: 'energisch', emoji: '⚡', share: 0.25 },
        { name: 'zufrieden', emoji: '😊', share: 0.20 },
      ],
    },
    {
      lat: 51.50,
      lng: -0.12,
      mood_score: -0.2,
      state: 'negative',
      count: 456,
      city: 'London',
      country: 'UK',
      dominant_indicator: 'müde',
      top_indicators: [
        { name: 'müde', emoji: '😴', share: 0.30 },
        { name: 'niedergeschlagen', emoji: '😔', share: 0.22 },
        { name: 'gestresst', emoji: '😓', share: 0.19 },
      ],
    },
  ];
}

