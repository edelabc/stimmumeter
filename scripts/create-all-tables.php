#!/usr/bin/env php
<?php
/**
 * Erstellt alle Tabellen aus den Migrationen
 * 
 * Dieses Script:
 * 1. Konvertiert alle PostgreSQL-Migrationen zu MySQL
 * 2. Erstellt die Datenbank "wameli"
 * 3. Erstellt alle Tabellen-Strukturen
 * 4. Importiert Standard-Daten
 * 
 * Verwendung:
 *   php scripts/create-all-tables.php local      # Für lokale DB
 *   php scripts/create-all-tables.php production # Für Produktions-DB
 */

$environment = $argv[1] ?? 'local';

if ($environment === 'production') {
    require_once __DIR__ . '/../config.production.php';
} else {
    require_once __DIR__ . '/../config.local.php';
}

echo "🚀 Erstelle komplette Datenbank-Struktur\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "Umgebung: " . ($environment === 'production' ? 'PRODUKTION' : 'LOKAL') . "\n";
echo "Datenbank: " . DB_NAME . "\n";
echo "Host: " . DB_HOST . ":" . DB_PORT . "\n\n";

try {
    // Verbindung OHNE Datenbank
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    echo "✅ Verbindung zu MySQL erfolgreich\n\n";
    
    // Prüfe ob Datenbank existiert
    $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" . DB_NAME . "'");
    $dbExists = $stmt->fetch();
    
    if (!$dbExists) {
        echo "⚠️  WICHTIG: Datenbank '" . DB_NAME . "' existiert nicht!\n";
        echo "   Bitte erstellen Sie zuerst ein Backup der vorhandenen Datenbank.\n";
        echo "   Führen Sie aus: php scripts/backup-database.php $environment\n\n";
        echo "   Möchten Sie die Datenbank jetzt erstellen? (yes/no): ";
        
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        if (trim($line) !== 'yes') {
            echo "\n❌ Abgebrochen. Bitte erstellen Sie zuerst ein Backup.\n";
            exit(0);
        }
        fclose($handle);
        
        echo "\n📦 Erstelle Datenbank '" . DB_NAME . "'...\n";
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    }
    
    $pdo->exec("USE `" . DB_NAME . "`");
    echo "✅ Datenbank verbunden\n\n";
    
    // Lade alle Migrationen
    $migrationDir = __DIR__ . '/../supabase/migrations';
    $migrations = glob($migrationDir . '/*.sql');
    sort($migrations);
    
    if (empty($migrations)) {
        throw new Exception("Keine Migrationen gefunden in: $migrationDir");
    }
    
    echo "📋 Gefundene Migrationen: " . count($migrations) . "\n\n";
    
    $createdTables = [];
    $errors = [];
    
    // Konvertiere und führe jede Migration aus
    foreach ($migrations as $migrationFile) {
        $filename = basename($migrationFile);
        echo "🔄 Verarbeite: $filename...\n";
        
        $sql = file_get_contents($migrationFile);
        
        // PostgreSQL → MySQL Konvertierung
        $sql = convertPostgresToMySQL($sql);
        
        // Teile in einzelne Statements
        $statements = splitSQLStatements($sql);
        
        foreach ($statements as $statement) {
            if (empty(trim($statement))) continue;
            
            // Überspringe Kommentare und leere Statements
            if (preg_match('/^\s*(--|\/\*)/', $statement)) continue;
            
            try {
                $pdo->exec($statement);
                
                // Erkenne CREATE TABLE Statements
                if (preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i', $statement, $matches)) {
                    $tableName = $matches[1];
                    if (!in_array($tableName, $createdTables)) {
                        $createdTables[] = $tableName;
                    }
                }
            } catch (PDOException $e) {
                $errorMsg = $e->getMessage();
                // Ignoriere "already exists" Fehler
                if (strpos($errorMsg, 'already exists') === false &&
                    strpos($errorMsg, 'Duplicate') === false &&
                    strpos($errorMsg, 'Unknown table') === false) {
                    $errors[] = [
                        'file' => $filename,
                        'statement' => substr($statement, 0, 100),
                        'error' => $errorMsg
                    ];
                }
            }
        }
        
        echo "   ✅ Abgeschlossen\n";
    }
    
    echo "\n✅ Datenbank-Setup abgeschlossen!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Zeige erstellte Tabellen
    $allTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "📊 Erstellte Tabellen: " . count($allTables) . "\n";
    foreach ($allTables as $table) {
        echo "   ✅ $table\n";
    }
    
    if (!empty($errors)) {
        echo "\n⚠️  Warnungen (" . count($errors) . "):\n";
        foreach (array_slice($errors, 0, 10) as $error) {
            echo "   - {$error['file']}: {$error['error']}\n";
        }
        if (count($errors) > 10) {
            echo "   ... und " . (count($errors) - 10) . " weitere\n";
        }
    }
    
    echo "\n✅ Fertig! Die Datenbank ist bereit.\n\n";
    
} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Konvertiert PostgreSQL SQL zu MySQL
 */
function convertPostgresToMySQL($sql) {
    // 1. Entferne PostgreSQL-spezifische Blöcke
    $sql = preg_replace('/DO \$\$.*?\$\$;/s', '', $sql);
    $sql = preg_replace('/BEGIN\s*END;/s', '', $sql);
    
    // 2. UUID → CHAR(36)
    $sql = preg_replace('/UUID\s+PRIMARY KEY/i', 'CHAR(36) PRIMARY KEY', $sql);
    $sql = preg_replace('/UUID\s+DEFAULT gen_random_uuid\(\)/i', 'CHAR(36) DEFAULT (UUID())', $sql);
    $sql = preg_replace('/UUID\s+REFERENCES/i', 'CHAR(36) REFERENCES', $sql);
    $sql = preg_replace('/UUID\s+NOT NULL/i', 'CHAR(36) NOT NULL', $sql);
    $sql = preg_replace('/UUID\s+/i', 'CHAR(36) ', $sql);
    
    // 3. TIMESTAMPTZ → DATETIME
    $sql = preg_replace('/TIMESTAMPTZ/i', 'DATETIME', $sql);
    $sql = preg_replace('/DEFAULT NOW\(\)/i', 'DEFAULT CURRENT_TIMESTAMP', $sql);
    
    // 4. JSONB → JSON
    $sql = preg_replace('/JSONB/i', 'JSON', $sql);
    
    // 5. NUMERIC → DECIMAL
    $sql = preg_replace('/NUMERIC\((\d+),\s*(\d+)\)/i', 'DECIMAL($1,$2)', $sql);
    $sql = preg_replace('/\bNUMERIC\b/i', 'DECIMAL(10,2)', $sql);
    
    // 6. INET → VARCHAR(45)
    $sql = preg_replace('/INET/i', 'VARCHAR(45)', $sql);
    
    // 7. BOOLEAN → TINYINT(1)
    $sql = preg_replace('/\bBOOLEAN\b/i', 'TINYINT(1)', $sql);
    $sql = preg_replace('/DEFAULT true/i', 'DEFAULT 1', $sql);
    $sql = preg_replace('/DEFAULT false/i', 'DEFAULT 0', $sql);
    
    // 8. INTEGER → INT
    $sql = preg_replace('/\bINTEGER\b/i', 'INT', $sql);
    
    // 9. Entferne RLS (Row Level Security)
    $sql = preg_replace('/ALTER TABLE .+ ENABLE ROW LEVEL SECURITY;/i', '', $sql);
    $sql = preg_replace('/CREATE POLICY .+?;/is', '', $sql);
    $sql = preg_replace('/DROP POLICY IF EXISTS .+?;/i', '', $sql);
    
    // 10. Entferne PostgreSQL-spezifische Index-Syntax
    $sql = preg_replace('/USING GIST\([^)]+\)/i', '', $sql);
    
    // 11. Entferne PostgreSQL-Functions (werden später behandelt)
    $sql = preg_replace('/CREATE OR REPLACE FUNCTION .+?END;.*?LANGUAGE plpgsql;/is', '', $sql);
    $sql = preg_replace('/CREATE TRIGGER .+?EXECUTE FUNCTION .+?;/is', '', $sql);
    
    // 12. Entferne Kommentare
    $sql = preg_replace('/COMMENT ON TABLE .+?;/i', '', $sql);
    
    // 13. ON CONFLICT → ON DUPLICATE KEY UPDATE
    $sql = preg_replace(
        '/ON CONFLICT \(([^)]+)\) DO NOTHING/i',
        'ON DUPLICATE KEY UPDATE $1 = $1',
        $sql
    );
    
    // 14. Entferne mehrfache Leerzeilen
    $sql = preg_replace('/\n\s*\n\s*\n+/', "\n\n", $sql);
    
    return trim($sql);
}

/**
 * Teilt SQL in einzelne Statements
 */
function splitSQLStatements($sql) {
    // Entferne Kommentare
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    
    // Teile bei Semikolon
    $statements = explode(';', $sql);
    
    return array_filter(
        array_map('trim', $statements),
        function($stmt) {
            return !empty($stmt) && 
                   strlen($stmt) > 10 && // Mindestlänge
                   !preg_match('/^\s*(--|\/\*)/', $stmt);
        }
    );
}

?>

