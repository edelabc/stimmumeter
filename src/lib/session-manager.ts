/**
 * Session Manager - Verwaltet anonyme Sessions für Stimmungserfassung
 * 
 * Features:
 * - Session-ID Generation und Persistierung
 * - YRA-Balance Tracking
 * - Bot-Schutz Integration
 * - Device Fingerprinting
 * 
 * WICHTIG: Keine Fallbacks - alle Fehler werden als eindeutige Fehlermeldungen geworfen
 */

import { apiClient } from './api-client';
import { SessionError, ApiError, ErrorCode } from './errors';

export interface SessionData {
  sessionId: string;
  yraBalance: number;
  assessmentsCount: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface AssessmentData {
  symbolType: 'woman' | 'man' | 'child' | 'family' | 'group';
  latitude: number;
  longitude: number;
  mood: 'positive' | 'neutral' | 'negative';
  intensity?: number;
}

export interface BotProtectionResult {
  allowed: boolean;
  reason?: string;
  rateLimitRemaining?: number;
}

class SessionManager {
  private sessionId: string | null = null;
  private deviceFingerprint: string | null = null;
  private tableExists: boolean | null = null; // null = unbekannt, true = existiert, false = existiert nicht
  private lastTableCheck: number = 0;
  
  // Konfiguration aus Umgebungsvariablen (keine Hardcodierung)
  private readonly TABLE_CHECK_INTERVAL = parseInt(
    import.meta.env.VITE_SESSION_TABLE_CHECK_INTERVAL || '60000',
    10
  );

  /**
   * Initialisiert oder lädt eine Session
   */
  async initializeSession(): Promise<string> {
    // Prüfe ob Session bereits existiert
    const storedSessionId = sessionStorage.getItem('mood_assessment_session_id');

    if (storedSessionId) {
      this.sessionId = storedSessionId;
      // Validiere Session im Backend
      const isValid = await this.validateSession(storedSessionId);
      if (isValid) {
        return storedSessionId;
      }
    }

    // Erstelle neue Session
    const newSessionId = this.generateSessionId();
    this.sessionId = newSessionId;
    sessionStorage.setItem('mood_assessment_session_id', newSessionId);

    // Erstelle Session im Backend
    await this.createSessionInBackend(newSessionId);

    return newSessionId;
  }

  /**
   * Generiert eine eindeutige Session-ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fingerprint = this.getDeviceFingerprint();
    return `session_${timestamp}_${random}_${fingerprint.substring(0, 8)}`;
  }

  /**
   * Erstellt Device Fingerprint für Bot-Schutz
   */
  getDeviceFingerprint(): string {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.platform,
      navigator.hardwareConcurrency?.toString() || '0',
    ];

    // Einfacher Hash (für Produktion sollte ein besserer Hash verwendet werden)
    const hash = components.join('|');
    this.deviceFingerprint = this.simpleHash(hash);

    return this.deviceFingerprint;
  }

  /**
   * Einfacher Hash-Algorithmus
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Erstellt Session im Backend
   * @throws {SessionError} Wenn Session nicht erstellt werden kann
   */
  private async createSessionInBackend(sessionId: string): Promise<void> {
    // Prüfe zuerst, ob Tabelle existiert
    const tableExists = await this.checkTableExists();
    if (!tableExists) {
      throw new SessionError(
        ErrorCode.SESSION_TABLE_NOT_FOUND,
        `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
        { sessionId, tableName: 'session_yra' }
      );
    }

    try {
      await apiClient.post('/session_manager.php?action=initialize', {
        sessionId
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.code === ErrorCode.DATABASE_TABLE_NOT_FOUND || 
            error.details?.apiCode === 'TABLE_NOT_FOUND') {
          this.tableExists = false;
          throw new SessionError(
            ErrorCode.SESSION_TABLE_NOT_FOUND,
            `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
            { sessionId, tableName: 'session_yra', originalError: error }
          );
        }
        throw new SessionError(
          ErrorCode.SESSION_CREATION_FAILED,
          `Fehler beim Erstellen der Session im Backend: ${error.message}`,
          { sessionId, originalError: error }
        );
      }
      throw new SessionError(
        ErrorCode.SESSION_CREATION_FAILED,
        `Unerwarteter Fehler beim Erstellen der Session: ${error.message || 'Unbekannter Fehler'}`,
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Prüft ob ein Fehler auf eine fehlende Tabelle hinweist
   */
  private isMissingTableError(error: any): boolean {
    if (error instanceof ApiError) {
      return error.code === ErrorCode.DATABASE_TABLE_NOT_FOUND ||
             error.details?.apiCode === 'TABLE_NOT_FOUND';
    }
    
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    
    return (
      errorCode === 'TABLE_NOT_FOUND' ||
      errorCode === ErrorCode.DATABASE_TABLE_NOT_FOUND ||
      errorMessage.includes('Table session_yra does not exist') ||
      errorMessage.includes('Base table or view not found')
    );
  }

  /**
   * Validiert eine Session
   * @throws {SessionError} Wenn Session nicht validiert werden kann
   */
  private async validateSession(sessionId: string): Promise<boolean> {
    // Prüfe zuerst, ob Tabelle existiert
    const tableExists = await this.checkTableExists();
    if (!tableExists) {
      throw new SessionError(
        ErrorCode.SESSION_TABLE_NOT_FOUND,
        `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
        { sessionId, tableName: 'session_yra' }
      );
    }

    try {
      const response = await apiClient.get(`/session_manager.php?action=get&sessionId=${sessionId}`);
      
      // Wenn table_exists Flag gesetzt ist, existiert die Tabelle, auch wenn Session nicht gefunden wurde
      if (response.table_exists === true && !response.session_id) {
        // Tabelle existiert, aber Session nicht - das ist OK für neue Sessions
        return true;
      }
      
      if (!response.session_id) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session mit ID '${sessionId}' wurde nicht gefunden.`,
          { sessionId }
        );
      }
      
      return true;
    } catch (error: any) {
      if (error instanceof SessionError) {
        throw error;
      }
      
      if (this.isMissingTableError(error)) {
        this.tableExists = false;
        throw new SessionError(
          ErrorCode.SESSION_TABLE_NOT_FOUND,
          `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
          { sessionId, tableName: 'session_yra', originalError: error }
        );
      }
      
      // Wenn table_exists Flag gesetzt ist, existiert die Tabelle, nur Session nicht
      if (error instanceof ApiError && error.details?.table_exists === true) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session mit ID '${sessionId}' wurde nicht gefunden.`,
          { sessionId, originalError: error }
        );
      }
      
      throw new SessionError(
        ErrorCode.SESSION_VALIDATION_FAILED,
        `Fehler bei der Validierung der Session: ${error.message || 'Unbekannter Fehler'}`,
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Prüft ob die Tabelle existiert (mit Caching)
   * @throws {SessionError} Wenn Tabelle nicht geprüft werden kann
   */
  private async checkTableExists(): Promise<boolean> {
    const now = Date.now();

    // Konfiguration aus Umgebungsvariablen (keine Hardcodierung)
    const missingTableCheckInterval = parseInt(
      import.meta.env.VITE_SESSION_TABLE_CHECK_INTERVAL_MISSING || '300000',
      10
    );
    const checkInterval = this.tableExists === false ? missingTableCheckInterval : this.TABLE_CHECK_INTERVAL;

    if (this.tableExists !== null && (now - this.lastTableCheck) < checkInterval) {
      return this.tableExists;
    }

    try {
      // Versuche eine einfache Abfrage
      // "Session not found" bedeutet, dass die Tabelle existiert, aber die Session nicht
      // Das ist OK für unsere Prüfung - wir wollen nur wissen ob die Tabelle existiert
      const response = await apiClient.get('/session_manager.php?action=get&sessionId=test');

      this.lastTableCheck = now;
      // Kein Fehler = Tabelle existiert (auch wenn Session nicht gefunden wurde)
      // Prüfe ob table_exists Flag gesetzt ist
      if (response.table_exists === true || response.code === 'SESSION_NOT_FOUND') {
        if (this.tableExists === false) {
          console.log('✅ [SessionManager] Tabelle session_yra wurde erkannt - wechsle in Online-Modus');
        }
        this.tableExists = true;
        return true;
      }
      // Wenn session_id vorhanden ist, existiert die Tabelle definitiv
      if (response.session_id) {
        if (this.tableExists === false) {
          console.log('✅ [SessionManager] Tabelle session_yra wurde erkannt - wechsle in Online-Modus');
        }
        this.tableExists = true;
        return true;
      }
    } catch (error: any) {
      this.lastTableCheck = now;
      
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      const errorStatus = error?.status || 0;
      const tableExistsFlag = (error as any)?.table_exists;
      
      // "Session not found" bedeutet, dass die Tabelle existiert, nur die Session fehlt
      // Das ist KEIN Fehler für unsere Prüfung!
      // Prüfe zuerst den error.code und table_exists Flag
      if (errorCode === 'SESSION_NOT_FOUND' || 
          tableExistsFlag === true ||
          (errorMessage.includes('Session not found') && !errorMessage.includes('Table')) || 
          errorMessage.includes('SESSION_NOT_FOUND') ||
          (errorStatus === 404 && tableExistsFlag !== false && !errorMessage.includes('Table') && !errorMessage.includes('database') && errorCode !== 'TABLE_NOT_FOUND')) {
        // Tabelle existiert, nur Session nicht - das ist OK!
        if (this.tableExists === false) {
          console.log('✅ [SessionManager] Tabelle session_yra wurde erkannt - wechsle in Online-Modus');
        }
        this.tableExists = true;
        return true;
      }

      // Bei Datenbankfehlern gehen wir davon aus, dass die Tabelle fehlt
      if (this.isMissingTableError(error)) {
        this.tableExists = false;
        return false;
      }
      
      // Unbekannter Fehler - werfe eindeutige Fehlermeldung
      if (error instanceof ApiError) {
        throw new SessionError(
          ErrorCode.SESSION_TABLE_NOT_FOUND,
          `Fehler beim Prüfen der Datenbanktabelle: ${error.message}`,
          { originalError: error, tableName: 'session_yra' }
        );
      }
      
      throw new SessionError(
        ErrorCode.SESSION_TABLE_NOT_FOUND,
        `Unerwarteter Fehler beim Prüfen der Datenbanktabelle: ${errorMessage || 'Unbekannter Fehler'}`,
        { originalError: error, tableName: 'session_yra' }
      );
    }
  }

  /**
   * Lädt Session-Daten
   * @throws {SessionError} Wenn Session-Daten nicht geladen werden können
   */
  async getSessionData(): Promise<SessionData> {
    const sessionId = await this.getSessionId();
    if (!sessionId) {
      throw new SessionError(
        ErrorCode.SESSION_NOT_FOUND,
        'Keine Session-ID verfügbar. Bitte initialisieren Sie zuerst eine Session.',
        {}
      );
    }

    // Prüfe zuerst, ob Tabelle existiert (mit Caching)
    const tableExists = await this.checkTableExists();

    if (!tableExists) {
      throw new SessionError(
        ErrorCode.SESSION_TABLE_NOT_FOUND,
        `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
        { sessionId, tableName: 'session_yra' }
      );
    }

    // Tabelle existiert - lade vom Backend
    try {
      const data = await apiClient.get(`/session_manager.php?action=get&sessionId=${sessionId}`);

      // Wenn table_exists Flag gesetzt ist, aber keine session_id, bedeutet das Session nicht gefunden
      // Versuche Session automatisch zu erstellen
      if (data.table_exists === true && !data.session_id) {
        // Session existiert nicht - erstelle sie automatisch
        try {
          await this.createSessionInBackend(sessionId);
          // Lade Session-Daten erneut
          const newData = await apiClient.get(`/session_manager.php?action=get&sessionId=${sessionId}`);
          if (newData && newData.session_id) {
            return {
              sessionId: newData.session_id,
              yraBalance: newData.yra_balance ?? 0,
              assessmentsCount: newData.assessments_count ?? 0,
              createdAt: new Date(newData.created_at),
              lastActivity: new Date(newData.last_activity),
            };
          }
        } catch (createError) {
          // Wenn Erstellung fehlschlägt, werfe Fehler
          throw new SessionError(
            ErrorCode.SESSION_NOT_FOUND,
            `Session mit ID '${sessionId}' wurde nicht gefunden und konnte nicht erstellt werden.`,
            { sessionId, originalError: createError }
          );
        }
      }

      if (!data || !data.session_id) {
        // Versuche Session automatisch zu erstellen
        try {
          await this.createSessionInBackend(sessionId);
          // Lade Session-Daten erneut
          const newData = await apiClient.get(`/session_manager.php?action=get&sessionId=${sessionId}`);
          if (newData && newData.session_id) {
            return {
              sessionId: newData.session_id,
              yraBalance: newData.yra_balance ?? 0,
              assessmentsCount: newData.assessments_count ?? 0,
              createdAt: new Date(newData.created_at),
              lastActivity: new Date(newData.last_activity),
            };
          }
        } catch (createError) {
          // Wenn Erstellung fehlschlägt, werfe Fehler
          throw new SessionError(
            ErrorCode.SESSION_NOT_FOUND,
            `Session mit ID '${sessionId}' wurde nicht gefunden und konnte nicht erstellt werden.`,
            { sessionId, originalError: createError }
          );
        }
      }

      return {
        sessionId: data.session_id,
        yraBalance: data.yra_balance ?? 0,
        assessmentsCount: data.assessments_count ?? 0,
        createdAt: new Date(data.created_at),
        lastActivity: new Date(data.last_activity),
      };
    } catch (error: any) {
      if (error instanceof SessionError) {
        throw error;
      }
      
      if (this.isMissingTableError(error)) {
        this.tableExists = false;
        throw new SessionError(
          ErrorCode.SESSION_TABLE_NOT_FOUND,
          `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
          { sessionId, tableName: 'session_yra', originalError: error }
        );
      }
      
      // Wenn table_exists Flag gesetzt ist, existiert die Tabelle, nur Session nicht
      if (error instanceof ApiError && error.details?.table_exists === true) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session mit ID '${sessionId}' wurde nicht gefunden.`,
          { sessionId, originalError: error }
        );
      }
      
      // Prüfe ob Fehler "Session not found" enthält
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Session not found') || errorMessage.includes('Session mit ID')) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session mit ID '${sessionId}' wurde nicht gefunden.`,
          { sessionId, originalError: error }
        );
      }
      
      throw new SessionError(
        ErrorCode.SESSION_DATA_LOAD_FAILED,
        `Fehler beim Laden der Session-Daten: ${error.message || 'Unbekannter Fehler'}`,
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Gibt aktuelle Session-ID zurück
   */
  async getSessionId(): Promise<string> {
    if (!this.sessionId) {
      return await this.initializeSession();
    }
    return this.sessionId;
  }

  /**
   * Bot-Schutz: Prüft ob Assessment erlaubt ist
   * @throws {SessionError} Wenn Bot-Schutz-Prüfung fehlschlägt
   */
  async checkBotProtection(): Promise<BotProtectionResult> {
    // Konfiguration aus Umgebungsvariablen (keine Hardcodierung)
    const minTimeBetweenAssessments = parseInt(
      import.meta.env.VITE_BOT_PROTECTION_MIN_TIME_MS || '2000',
      10
    );
    const maxRateLimit = parseInt(
      import.meta.env.VITE_BOT_PROTECTION_MAX_RATE_LIMIT || '10',
      10
    );
    
    const sessionId = await this.getSessionId();
    const lastAssessmentKey = `last_assessment_${sessionId}`;
    const lastAssessmentTime = sessionStorage.getItem(lastAssessmentKey);

    if (lastAssessmentTime) {
      const timeSinceLast = Date.now() - parseInt(lastAssessmentTime, 10);
      if (timeSinceLast < minTimeBetweenAssessments) {
        const remaining = Math.ceil((minTimeBetweenAssessments - timeSinceLast) / 1000);
        return {
          allowed: false,
          reason: `Bitte warte ${remaining} Sekunde(n) zwischen den Einschätzungen.`,
          rateLimitRemaining: maxRateLimit - 1,
        };
      }
    }

    return { allowed: true, rateLimitRemaining: maxRateLimit };
  }

  /**
   * Speichert eine Stimmungseinschätzung
   * @throws {SessionError} Wenn Assessment nicht gespeichert werden kann
   */
  async saveAssessment(assessment: AssessmentData): Promise<{ success: boolean; yraEarned: number }> {
    // Bot-Schutz prüfen
    const botCheck = await this.checkBotProtection();
    if (!botCheck.allowed) {
      throw new SessionError(
        ErrorCode.ASSESSMENT_BOT_PROTECTION_FAILED,
        botCheck.reason || 'Assessment nicht erlaubt',
        { rateLimitRemaining: botCheck.rateLimitRemaining }
      );
    }

    const sessionId = await this.getSessionId();
    const deviceFingerprint = this.getDeviceFingerprint();

    // Prüfe ob Tabellen existieren
    const tableExists = await this.checkTableExists();

    if (!tableExists) {
      throw new SessionError(
        ErrorCode.SESSION_TABLE_NOT_FOUND,
        `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
        { sessionId, tableName: 'session_yra' }
      );
    }

    try {
      // Speichere Assessment im Backend via API
      const result = await apiClient.post('/assessments.php', {
        sessionId,
        symbolType: assessment.symbolType,
        latitude: assessment.latitude,
        longitude: assessment.longitude,
        mood: assessment.mood,
        intensity: assessment.intensity ?? 1,
        deviceFingerprint,
      });

      if (!result.success) {
        throw new SessionError(
          ErrorCode.ASSESSMENT_SAVE_FAILED,
          result.error || 'Fehler beim Speichern der Einschätzung',
          { sessionId, assessment, originalError: result.error }
        );
      }

      if (typeof result.yraEarned !== 'number') {
        throw new SessionError(
          ErrorCode.ASSESSMENT_SAVE_FAILED,
          'Ungültige YRA-Belohnung vom Backend erhalten',
          { sessionId, assessment, yraEarned: result.yraEarned }
        );
      }

      // Speichere lokale Timing-Info für Bot-Schutz
      const lastAssessmentKey = `last_assessment_${sessionId}`;
      sessionStorage.setItem(lastAssessmentKey, Date.now().toString());

      return {
        success: true,
        yraEarned: result.yraEarned,
      };
    } catch (error: any) {
      if (error instanceof SessionError) {
        throw error;
      }
      
      if (this.isMissingTableError(error)) {
        this.tableExists = false;
        throw new SessionError(
          ErrorCode.SESSION_TABLE_NOT_FOUND,
          `Die Datenbanktabelle 'session_yra' existiert nicht. Bitte führen Sie die Datenbank-Migration aus.`,
          { sessionId, tableName: 'session_yra', originalError: error }
        );
      }
      
      throw new SessionError(
        ErrorCode.ASSESSMENT_SAVE_FAILED,
        `Fehler beim Speichern der Einschätzung: ${error.message || 'Unbekannter Fehler'}`,
        { sessionId, assessment, originalError: error }
      );
    }
  }

  /**
   * Fügt YRA zur Session hinzu (nicht mehr benötigt, da API das übernimmt)
   */
  private async addYraToSession(amount: number): Promise<void> {
    // Diese Methode ist nicht mehr nötig, da die API die YRA-Balance direkt aktualisiert
    // Behalten wir aber für Kompatibilität
  }

  /**
   * Überträgt Session-YRA zu einem User-Account
   * @throws {SessionError} Wenn Transfer nicht durchgeführt werden kann
   */
  async transferYraToAccount(userId: string): Promise<{ success: boolean; yraTransferred: number }> {
    throw new SessionError(
      ErrorCode.SESSION_CREATION_FAILED,
      'Transfer-Funktionalität ist noch nicht implementiert',
      { userId }
    );
  }

  /**
   * Löscht Session-Daten (für Logout/Cleanup)
   */
  clearSession(): void {
    const sessionId = this.sessionId;
    this.sessionId = null;
    sessionStorage.removeItem('mood_assessment_session_id');
    if (sessionId) {
      sessionStorage.removeItem(`session_yra_${sessionId}`);
    }
  }
}

// Singleton-Instanz
export const sessionManager = new SessionManager();

