<?php
/**
 * Stimmumeter - PRODUKTIV-SERVER Konfiguration
 * 
 * WICHTIG: Diese Datei ist für den PRODUKTIV-Server
 * 
 * INSTALLATION:
 * 1. Diese Datei auf den Live-Server hochladen
 * 2. Passwörter und Zugangsdaten anpassen
 * 3. Dateirechte setzen: chmod 640 config.production.php
 */

// Sicherheit: Verhindere direkten Aufruf dieser Datei
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access forbidden');
}

// ==========================================
// DATENBANK-KONFIGURATION (LIVE-SERVER)
// ==========================================
define('DB_HOST', 'localhost');
define('DB_PORT', 3306); // Standard MySQL Port
define('DB_USER', 'TrastimoGmbHsql6');
define('DB_PASS', 'cmjVKrwdog');
define('DB_NAME', 'wameli');
// Socket wird auf Live-Server automatisch erkannt
if (file_exists('/var/run/mysqld/mysqld.sock')) {
    define('DB_SOCKET', '/var/run/mysqld/mysqld.sock');
} elseif (file_exists('/tmp/mysql.sock')) {
    define('DB_SOCKET', '/tmp/mysql.sock');
} else {
    define('DB_SOCKET', ''); // Kein Socket, nutzt TCP
}

// ==========================================
// ANWENDUNGS-KONFIGURATION (LIVE)
// ==========================================
define('APP_NAME', 'Stimmumeter');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'https://wameli.com'); // ⚠️ Anpassen falls nötig!
define('APP_DEBUG', false); // ⚠️ WICHTIG: Debug im Live-Betrieb IMMER ausschalten!

// API Base URL für Frontend
define('API_BASE_URL', 'https://wameli.com/api'); // ⚠️ Anpassen falls nötig!

// ==========================================
// SUPABASE-KONFIGURATION (Falls verwendet)
// ==========================================
// Diese werden aus Umgebungsvariablen geladen
define('SUPABASE_URL', getenv('VITE_SUPABASE_URL') ?: '');
define('SUPABASE_ANON_KEY', getenv('VITE_SUPABASE_ANON_KEY') ?: '');

// ==========================================
// SICHERHEITS-EINSTELLUNGEN
// ==========================================
// Session-Einstellungen für Produktion
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', '1'); // Nur über HTTPS
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Strict');

// WICHTIG: Keine Header hier setzen!
// Header werden in .htaccess und in den API-Dateien gesetzt
// Diese Datei wird nur eingebunden, nicht direkt ausgeführt

// ==========================================
// FEHLERBEHANDLUNG
// ==========================================
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/logs/php-errors.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    // Fehler nur in Log-Datei schreiben, nicht anzeigen
    ini_set('error_log', __DIR__ . '/logs/php-errors.log');
}

// Zeitzone
date_default_timezone_set('Europe/Berlin');

// ==========================================
// PERFORMANCE-EINSTELLUNGEN
// ==========================================
// Memory Limit für Produktion
ini_set('memory_limit', '256M');

// Max Execution Time
ini_set('max_execution_time', '30');

// Output Compression (wenn mod_deflate verfügbar)
if (extension_loaded('zlib') && !ob_get_level()) {
    ob_start('ob_gzhandler');
}

// ==========================================
// CORS-EINSTELLUNGEN (für API)
// ==========================================
// Nur für API-Endpunkte, nicht für Frontend
define('CORS_ALLOWED_ORIGINS', [
    'https://wameli.com',
    'https://www.wameli.com'
]);

// ==========================================
// LOGGING
// ==========================================
// Log-Verzeichnis erstellen falls nicht vorhanden
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    @mkdir($logDir, 0755, true);
}

?>


