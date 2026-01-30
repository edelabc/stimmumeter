/**
 * Mood API Client für MySQL
 * Ersetzt Supabase-Aufrufe durch PHP-API-Aufrufe
 */

import { apiClient, getApiBaseUrl } from './api-client';
import { getAuthHeaders } from './auth-mysql';

// API Base URL dynamisch bestimmen
const API_BASE_URL = (): string => getApiBaseUrl();

/**
 * Lädt alle Pseudonyme des aktuellen Benutzers
 */
export async function loadPseudonyms() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('❌ [API] Kein Auth-Token gefunden');
            return { data: [], error: new Error('Nicht authentifiziert') };
        }
        
        const url = `${API_BASE_URL()}/pseudonyms.php?action=list`;
        console.log('🔵 [API] Lade Pseudonyme von:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [API] Fehler beim Laden der Pseudonyme:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ [API] Pseudonyme geladen:', data.data?.length || 0, 'Einträge');
        
        if (!data.success) {
            console.error('❌ [API] API-Fehler:', data.error);
            return { data: [], error: new Error(data.error || 'Unbekannter Fehler') };
        }
        
        return { data: data.data || [], error: null };
    } catch (error: any) {
        console.error('❌ [API] Exception beim Laden der Pseudonyme:', error);
        return { data: [], error };
    }
}

/**
 * Erstellt oder aktualisiert ein Pseudonym
 */
export async function savePseudonym(pseudonym: any) {
    try {
        const token = localStorage.getItem('auth_token');
        const method = pseudonym.id ? 'PUT' : 'POST';
        const url = pseudonym.id 
            ? `${API_BASE_URL()}/pseudonyms.php?id=${pseudonym.id}`
            : `${API_BASE_URL()}/pseudonyms.php`;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pseudonym),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Speichern');
        }
        
        const data = await response.json();
        return { data: data.data, error: null };
    } catch (error: any) {
        return { data: null, error };
    }
}

/**
 * Löscht ein Pseudonym
 */
export async function deletePseudonym(id: string) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL()}/pseudonyms.php?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Löschen');
        }
        
        return { error: null };
    } catch (error: any) {
        return { error };
    }
}

/**
 * Lädt alle Mood-Indikatoren
 */
export async function loadIndicators() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('❌ [API] Kein Auth-Token gefunden');
            return { data: [], error: new Error('Nicht authentifiziert') };
        }
        
        const url = `${API_BASE_URL()}/mood-indicators.php?action=list`;
        console.log('🔵 [API] Lade Indikatoren von:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [API] Fehler beim Laden der Indikatoren:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ [API] Indikatoren geladen:', data.data?.length || 0, 'Einträge');
        
        if (!data.success) {
            console.error('❌ [API] API-Fehler:', data.error);
            return { data: [], error: new Error(data.error || 'Unbekannter Fehler') };
        }
        
        return { data: data.data || [], error: null };
    } catch (error: any) {
        console.error('❌ [API] Exception beim Laden der Indikatoren:', error);
        return { data: [], error };
    }
}

/**
 * Lädt Mood-Einträge für ein Pseudonym
 */
export async function loadMoodEntries(pseudonymId: string) {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('❌ [API] Kein Auth-Token gefunden');
            return { data: [], error: new Error('Nicht authentifiziert') };
        }
        
        const url = `${API_BASE_URL()}/mood-entries.php?pseudonym_id=${pseudonymId}`;
        console.log('🔵 [API] Lade Mood-Einträge von:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [API] Fehler beim Laden der Einträge:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ [API] Mood-Einträge geladen:', data.data?.length || 0, 'Einträge');
        
        if (!data.success) {
            console.error('❌ [API] API-Fehler:', data.error);
            return { data: [], error: new Error(data.error || 'Unbekannter Fehler') };
        }
        
        return { data: data.data || [], error: null };
    } catch (error: any) {
        console.error('❌ [API] Exception beim Laden der Einträge:', error);
        return { data: [], error };
    }
}

/**
 * Erstellt einen neuen Mood-Eintrag
 */
export async function createMoodEntry(entry: any) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL()}/mood-entries.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Erstellen');
        }
        
        const data = await response.json();
        return { data: data.data, error: null };
    } catch (error: any) {
        return { data: null, error };
    }
}

/**
 * Aktualisiert einen Mood-Eintrag
 */
export async function updateMoodEntry(id: string, entry: any) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL()}/mood-entries.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...entry, id }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Aktualisieren');
        }
        
        const data = await response.json();
        return { data: data.data, error: null };
    } catch (error: any) {
        return { data: null, error };
    }
}

/**
 * Löscht einen Mood-Eintrag
 */
export async function deleteMoodEntry(id: string) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL()}/mood-entries.php?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Löschen');
        }
        
        return { error: null };
    } catch (error: any) {
        return { error };
    }
}

