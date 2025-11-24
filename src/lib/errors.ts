/**
 * Zentrale Fehler-Definitionen für die Anwendung
 * Keine Fallbacks - nur eindeutige Fehlermeldungen
 */

export enum ErrorCode {
  // Session Manager Errors
  SESSION_TABLE_NOT_FOUND = 'SESSION_TABLE_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  SESSION_VALIDATION_FAILED = 'SESSION_VALIDATION_FAILED',
  SESSION_DATA_LOAD_FAILED = 'SESSION_DATA_LOAD_FAILED',
  
  // API Errors
  API_BASE_URL_NOT_CONFIGURED = 'API_BASE_URL_NOT_CONFIGURED',
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_NETWORK_ERROR = 'API_NETWORK_ERROR',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',
  
  // Assessment Errors
  ASSESSMENT_SAVE_FAILED = 'ASSESSMENT_SAVE_FAILED',
  ASSESSMENT_BOT_PROTECTION_FAILED = 'ASSESSMENT_BOT_PROTECTION_FAILED',
  ASSESSMENT_INVALID_DATA = 'ASSESSMENT_INVALID_DATA',
  
  // Configuration Errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  
  // Database Errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_TABLE_NOT_FOUND = 'DATABASE_TABLE_NOT_FOUND',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class SessionError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, details);
    this.name = 'SessionError';
  }
}

export class ApiError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, details);
    this.name = 'ApiError';
  }
}

export class ConfigurationError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, details);
    this.name = 'ConfigurationError';
  }
}


