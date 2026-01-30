/**
 * API Client für lokale PHP Backend-Kommunikation
 */

import { ApiError, ErrorCode } from './errors';

/**
 * Bestimmt die API Base URL dynamisch (lokal und online)
 * Kann auch von anderen Modulen verwendet werden
 */
export const getApiBaseUrl = (): string => {
    // 1. Prüfe Umgebungsvariable (hat Priorität)
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
        return envUrl;
    }

    // 2. Dynamisch basierend auf aktueller Domain erstellen
    if (typeof window !== 'undefined') {
        const { protocol, hostname, port, pathname } = window.location;

        // ENTWICKLUNG: Wenn wir auf einem Vite Dev-Server laufen (Port 5173 oder ähnlich),
        // verwende einen RELATIVEN Pfad, damit der Vite-Proxy die Anfragen abfangen kann
        if (port && (port === '5173' || port === '5174' || port === '3000')) {
            // Relativer Pfad für Vite-Proxy
            return '/stimmumeter/api';
        }

        // PRODUKTION: Bestimme Basis-Pfad
        let basePath = '';

        // Wenn wir in einem Unterverzeichnis sind (z.B. /stimmumeter/dist/)
        if (pathname.includes('/stimmumeter/')) {
            basePath = '/stimmumeter';
        } else if (pathname.includes('/dist/')) {
            // Wenn wir direkt in dist/ sind, entferne /dist und behalte den Rest
            basePath = pathname.replace(/\/dist.*$/, '').replace(/\/$/, '') || '';
        } else if (pathname.startsWith('/api')) {
            // Wenn wir bereits in /api sind, verwende Root
            basePath = '';
        } else if (pathname !== '/' && pathname !== '') {
            // Andere Pfade: entferne den letzten Teil (z.B. /app -> /)
            const parts = pathname.split('/').filter(p => p);
            if (parts.length > 0) {
                // Nimm den ersten Teil als Basis (z.B. /stimmumeter)
                basePath = '/' + parts[0];
            }
        }

        // Baue API-URL zusammen - IMMER die aktuelle Domain verwenden
        const apiPath = basePath ? `${basePath}/api` : '/api';
        return `${protocol}//${hostname}${apiPath}`;
    }

    // Fallback für SSR oder wenn window nicht verfügbar ist
    return '/api';
};

export interface ApiResponse<T = any> {
    success?: boolean;
    error?: string;
    data?: T;
    [key: string]: any;
}

class ApiClient {
    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const apiBaseUrl = getApiBaseUrl();

        // Hole Auth-Token für Authorization Header
        const authHeaders: Record<string, string> = {};
        try {
            const authModule = await import('./auth-mysql');
            const headers = authModule.getAuthHeaders();
            Object.assign(authHeaders, headers);
        } catch (e) {
            // Auth-Modul nicht verfügbar, verwende localStorage direkt
            const token = localStorage.getItem('auth_token');
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }
        }

        try {
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                    ...options.headers,
                },
            });

            // Prüfe ob Response JSON ist
            let data: any;
            const contentType = response.headers.get('content-type');
            const responseText = await response.text();

            // Prüfe ob Response leer ist
            if (!responseText || responseText.trim() === '') {
                throw new ApiError(
                    ErrorCode.API_INVALID_RESPONSE,
                    'API antwortete mit leerer Antwort',
                    { status: response.status, endpoint }
                );
            }

            // Versuche JSON zu parsen - entferne mögliche zusätzliche Zeichen nach dem JSON
            try {
                // Finde das erste gültige JSON-Objekt (kann mehrere geben, wenn PHP-Fehler ausgegeben wurden)
                let jsonText = responseText.trim();

                // Wenn der Text mit { beginnt, versuche das erste JSON-Objekt zu extrahieren
                if (jsonText.startsWith('{')) {
                    let braceCount = 0;
                    let jsonEnd = -1;

                    for (let i = 0; i < jsonText.length; i++) {
                        if (jsonText[i] === '{') braceCount++;
                        if (jsonText[i] === '}') braceCount--;
                        if (braceCount === 0 && jsonText[i] === '}') {
                            jsonEnd = i + 1;
                            break;
                        }
                    }

                    if (jsonEnd > 0) {
                        jsonText = jsonText.substring(0, jsonEnd);
                    }
                }

                data = JSON.parse(jsonText);
            } catch (parseError: any) {
                // Wenn JSON-Parsing fehlschlägt, versuche den ersten JSON-Teil zu extrahieren
                try {
                    // Suche nach dem ersten { und dem passenden }
                    const firstBrace = responseText.indexOf('{');
                    if (firstBrace >= 0) {
                        let braceCount = 0;
                        let jsonEnd = -1;

                        for (let i = firstBrace; i < responseText.length; i++) {
                            if (responseText[i] === '{') braceCount++;
                            if (responseText[i] === '}') braceCount--;
                            if (braceCount === 0 && responseText[i] === '}') {
                                jsonEnd = i + 1;
                                break;
                            }
                        }

                        if (jsonEnd > firstBrace) {
                            const jsonText = responseText.substring(firstBrace, jsonEnd);
                            data = JSON.parse(jsonText);
                        } else {
                            throw parseError;
                        }
                    } else {
                        throw parseError;
                    }
                } catch (secondError: any) {
                    throw new ApiError(
                        ErrorCode.API_INVALID_RESPONSE,
                        `Ungültige JSON-Antwort: ${parseError.message}`,
                        {
                            status: response.status,
                            responseText: responseText.substring(0, 500),
                            endpoint,
                            contentType
                        }
                    );
                }
            }

            if (!response.ok) {
                // Eindeutige Fehlermeldung basierend auf Status-Code und API-Response
                const errorMessage = data.error || `HTTP ${response.status}`;
                const errorCode = data.code || ErrorCode.API_REQUEST_FAILED;

                throw new ApiError(
                    errorCode as ErrorCode,
                    errorMessage,
                    {
                        status: response.status,
                        endpoint,
                        apiCode: data.code,
                        table_exists: data.table_exists,
                        originalError: data.error,
                    }
                );
            }

            return data;
        } catch (error: any) {
            // Wenn es bereits ein AppError ist, weiterwerfen
            if (error instanceof ApiError || error instanceof Error && error.name === 'AppError') {
                throw error;
            }

            // Network-Fehler
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new ApiError(
                    ErrorCode.API_NETWORK_ERROR,
                    `Netzwerkfehler beim Aufruf der API: ${error.message}`,
                    { endpoint, originalError: error.message }
                );
            }

            // JSON-Parsing-Fehler speziell behandeln
            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                throw new ApiError(
                    ErrorCode.API_INVALID_RESPONSE,
                    `Ungültige JSON-Antwort von der API: ${error.message}`,
                    { endpoint, originalError: error.message }
                );
            }

            // Unbekannter Fehler
            throw new ApiError(
                ErrorCode.API_REQUEST_FAILED,
                `Unerwarteter Fehler beim API-Aufruf: ${error.message || 'Unbekannter Fehler'}`,
                { endpoint, originalError: error }
            );
        }
    }

    async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET', ...options });
    }

    async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
