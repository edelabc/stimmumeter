<?php
// api/db.php

// CORS Headers nur setzen, wenn noch keine Header gesendet wurden (d.h. wenn db.php direkt aufgerufen wird)
// Wenn db.php von anderen Dateien eingebunden wird, werden die Header bereits gesetzt sein
if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Handle preflight requests nur wenn direkt aufgerufen
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Load configuration - Automatische Umgebungserkennung
// Prüfe ob wir lokal oder auf dem Production-Server sind
$isLocalEnvironment = (
    // XAMPP/MAMP erkennbar
    (strpos($_SERVER['DOCUMENT_ROOT'] ?? '', 'XAMPP') !== false) ||
    (strpos($_SERVER['DOCUMENT_ROOT'] ?? '', 'xampp') !== false) ||
    (strpos($_SERVER['DOCUMENT_ROOT'] ?? '', 'MAMP') !== false) ||
    // Localhost in der URL
    (isset($_SERVER['HTTP_HOST']) && (
        $_SERVER['HTTP_HOST'] === 'localhost' || 
        strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === 0 ||
        strpos($_SERVER['HTTP_HOST'], 'localhost:') === 0
    )) ||
    // CLI mit lokalem Pfad
    (php_sapi_name() === 'cli' && (
        strpos(__DIR__, '/Applications/XAMPP') === 0 ||
        strpos(__DIR__, '/xampp/') !== false
    ))
);

// Lade entsprechende Config-Datei
if ($isLocalEnvironment) {
    $configFile = __DIR__ . '/../config.local.php';
} else {
    $configFile = __DIR__ . '/../config.production.php';
}

if (!file_exists($configFile)) {
    // Header sicherstellen, bevor Output gesendet wird
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Content-Type: application/json; charset=UTF-8");
    }
    http_response_code(500);
    echo json_encode([
        'error' => 'Configuration file not found', 
        'path' => $configFile,
        'environment' => $isLocalEnvironment ? 'local' : 'production',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'not set'
    ]);
    exit;
}

require_once $configFile;

// Check if constants are defined
if (!defined('DB_HOST') || !defined('DB_NAME') || !defined('DB_USER') || !defined('DB_PASS')) {
    // Header sicherstellen, bevor Output gesendet wird
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Content-Type: application/json; charset=UTF-8");
    }
    http_response_code(500);
    echo json_encode(['error' => 'Database configuration incomplete']);
    exit;
}

// Connect to Database
try {
    // First, try to connect without database to check if database exists
    $dsnNoDb = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";charset=utf8mb4";
    $pdoCheck = new PDO($dsnNoDb, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    // Check if database exists
    $stmt = $pdoCheck->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" . DB_NAME . "'");
    $dbExists = $stmt->fetch();
    
    if (!$dbExists) {
        // Database doesn't exist - create it
        $pdoCheck->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        error_log("✅ Datenbank '" . DB_NAME . "' wurde automatisch erstellt");
    }
    
    // Now connect to the database
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Exportiere getDbConnection() Funktion für andere API-Dateien
    function getDbConnection() {
        global $pdo;
        return $pdo;
    }
    
    // PERFORMANCE-OPTIMIERUNG: Schema-Check nur einmal täglich ausführen
    // Anstatt bei jedem Request kostspielige Schema-Migrationen durchzuführen
    $schemaCheckFile = __DIR__ . '/../.schema-check-cache';
    $schemaCheckInterval = 86400; // 24 Stunden in Sekunden
    $runSchemaCheck = false;
    
    if (!file_exists($schemaCheckFile)) {
        $runSchemaCheck = true;
    } else {
        $lastCheck = (int)file_get_contents($schemaCheckFile);
        if (time() - $lastCheck > $schemaCheckInterval) {
            $runSchemaCheck = true;
        }
    }
    
    // Erzwinge Schema-Check über URL-Parameter (für Entwicklung/Debugging)
    if (isset($_GET['force_schema_check']) && $_GET['force_schema_check'] === '1') {
        $runSchemaCheck = true;
    }
    
    if ($runSchemaCheck) {
        // Auto-Setup: Prüfe fehlende Tabellen und Schema-Änderungen
        require_once __DIR__ . '/auto-setup.php';
        $autoSetup = new AutoSetup($pdo);
        
        // Prüfe ob wichtige Tabellen fehlen
        $criticalTables = ['session_yra', 'mood_assessments'];
        $missingTables = [];
        
        foreach ($criticalTables as $table) {
            $check = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
            if (!$check) {
                $missingTables[] = $table;
            }
        }
        
        // Wenn Tabellen fehlen: Backup erstellen und Tabellen erstellen
        if (!empty($missingTables)) {
            error_log("⚠️ Fehlende Tabellen erkannt: " . implode(', ', $missingTables));
            
            // Backup erstellen (falls Datenbank nicht leer ist)
            $allTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($allTables)) {
                $autoSetup->createBackupIfNeeded();
            }
            
            // Fehlende Tabellen erstellen (führt auch Schema-Migration aus)
            $result = $autoSetup->createMissingTables();
            if (!empty($result['created'])) {
                error_log("✅ Automatisch erstellte Tabellen: " . implode(', ', $result['created']));
            }
            
            // Standard-Daten einfügen
            $autoSetup->insertDefaultData();
        } else {
            // Tabellen existieren - prüfe Schema-Änderungen
            require_once __DIR__ . '/schema-migrator.php';
            $migrator = new SchemaMigrator($pdo);
            
            error_log("🔄 Prüfe Schema-Änderungen...");
            $migrationResults = $migrator->migrateAllTables();
            
            if (!empty($migrationResults['added'])) {
                error_log("✅ Neue Spalten hinzugefügt: " . implode(', ', $migrationResults['added']));
            }
            
            if (!empty($migrationResults['modified'])) {
                error_log("✅ Spalten geändert: " . implode(', ', $migrationResults['modified']));
            }
            
            if (!empty($migrationResults['dropped'])) {
                error_log("⚠️ Spalten gelöscht: " . implode(', ', $migrationResults['dropped']));
            }
            
            if (!empty($migrationResults['errors'])) {
                foreach ($migrationResults['errors'] as $error) {
                    error_log("❌ Migrations-Fehler: $error");
                }
            }
        }
        
        // Cache-Datei aktualisieren
        @file_put_contents($schemaCheckFile, time());
        error_log("✅ Schema-Check abgeschlossen, nächster Check in 24 Stunden");
    }
    
} catch (PDOException $e) {
    // Header sicherstellen, bevor Output gesendet wird
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Content-Type: application/json; charset=UTF-8");
    }
    
    $errorMessage = $e->getMessage();
    $errorCode = $e->getCode();
    
    // Spezielle Behandlung für Berechtigungsfehler
    if (strpos($errorMessage, 'Access denied') !== false || 
        strpos($errorMessage, '1044') !== false || 
        strpos($errorMessage, '1045') !== false) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Database access denied',
            'message' => $errorMessage,
            'code' => 'DB_ACCESS_DENIED',
            'hint' => 'Der Datenbankbenutzer hat keine Berechtigung auf die Datenbank zuzugreifen. ' .
                      'Bitte führen Sie das Script database/grant-permissions-production.sql als ROOT-Admin aus.',
            'user' => DB_USER,
            'database' => DB_NAME
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Database connection failed',
            'message' => $errorMessage,
            'code' => 'DB_CONNECTION_ERROR'
        ]);
    }
    exit;
}
?>
