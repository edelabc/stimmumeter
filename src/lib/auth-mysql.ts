/**
 * Authentifizierung ohne Supabase
 * Verwendet PHP-API-Endpunkte statt Supabase
 */

import { apiClient, getApiBaseUrl } from './api-client';

// API Base URL dynamisch bestimmen
const API_BASE_URL = (): string => getApiBaseUrl();

// Token im localStorage speichern
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Speichert Token im localStorage
 */
function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Holt Token aus localStorage
 */
function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Entfernt Token aus localStorage
 */
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Speichert Benutzer-Daten im localStorage
 */
function setUser(user: any) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Holt Benutzer-Daten aus localStorage
 */
function getUser(): any | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Registrierung
 */
export async function signUp(email: string, password: string, agreements?: Array<{ agreementId: string; consentType: string; checked: boolean }>) {
    try {
        const response = await fetch(`${API_BASE_URL()}/auth.php?action=signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, agreements }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                data: { user: null, session: null },
                error: {
                    name: 'AuthError',
                    message: data.error || 'Registrierung fehlgeschlagen',
                },
            };
        }

        if (data.success && data.data) {
            // Speichere Token und Benutzer
            if (data.data.session?.access_token) {
                setToken(data.data.session.access_token);
            }
            if (data.data.user) {
                setUser(data.data.user);
            }

            return {
                data: {
                    user: data.data.user,
                    session: data.data.session,
                },
                error: null,
            };
        }

        return {
            data: { user: null, session: null },
            error: {
                name: 'AuthError',
                message: 'Unerwarteter Fehler bei der Registrierung',
            },
        };
    } catch (err: any) {
        return {
            data: { user: null, session: null },
            error: {
                name: 'AuthError',
                message: err.message || 'Netzwerkfehler bei der Registrierung',
            },
        };
    }
}

/**
 * Login
 */
export async function signIn(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL()}/auth.php?action=signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                data: { user: null, session: null },
                error: {
                    name: 'AuthError',
                    message: data.error || 'Login fehlgeschlagen',
                },
            };
        }

        if (data.success && data.data) {
            // Speichere Token und Benutzer
            if (data.data.session?.access_token) {
                setToken(data.data.session.access_token);
            }
            if (data.data.user) {
                setUser(data.data.user);
            }

            return {
                data: {
                    user: data.data.user,
                    session: data.data.session,
                },
                error: null,
            };
        }

        return {
            data: { user: null, session: null },
            error: {
                name: 'AuthError',
                message: 'Unerwarteter Fehler beim Login',
            },
        };
    } catch (err: any) {
        return {
            data: { user: null, session: null },
            error: {
                name: 'AuthError',
                message: err.message || 'Netzwerkfehler beim Login',
            },
        };
    }
}

/**
 * Logout
 */
export async function signOut() {
    try {
        const token = getToken();
        if (token) {
            await fetch(`${API_BASE_URL()}/auth.php?action=signout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        }
    } catch (err) {
        console.error('Logout-Fehler:', err);
    } finally {
        removeToken();
    }
    return { error: null };
}

/**
 * Aktueller Benutzer
 */
export async function getCurrentUser() {
    // Prüfe zuerst localStorage
    const cachedUser = getUser();
    if (cachedUser) {
        return cachedUser;
    }

    // Hole vom Server
    try {
        const token = getToken();
        if (!token) {
            return null;
        }

        const response = await fetch(`${API_BASE_URL()}/auth.php?action=user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            removeToken();
            return null;
        }

        const data = await response.json();
        if (data.success && data.data?.user) {
            setUser(data.data.user);
            return data.data.user;
        }

        return null;
    } catch (err) {
        console.warn('Fehler beim Abrufen des aktuellen Users:', err);
        return null;
    }
}

/**
 * Passwort-Reset anfordern
 */
export async function resetPassword(email: string) {
    try {
        const response = await fetch(`${API_BASE_URL()}/auth.php?action=reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                data: null,
                error: {
                    name: 'AuthError',
                    message: data.error || 'Passwort-Reset fehlgeschlagen',
                },
            };
        }

        return {
            data: data,
            error: null,
        };
    } catch (err: any) {
        return {
            data: null,
            error: {
                name: 'AuthError',
                message: err.message || 'Netzwerkfehler beim Passwort-Reset',
            },
        };
    }
}

/**
 * Prüft ob Benutzer eingeloggt ist
 */
export function isAuthenticated(): boolean {
    return getToken() !== null;
}

/**
 * Holt Authorization Header für API-Requests
 */
export function getAuthHeaders(): Record<string, string> {
    const token = getToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
        };
    }
    return {};
}

