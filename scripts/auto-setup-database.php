#!/usr/bin/env php
<?php
/**
 * Automatisches Datenbank-Setup mit Backup
 * 
 * Dieses Script:
 * 1. Erstellt automatisch ein Backup (falls Datenbank existiert)
 * 2. Erstellt die Datenbank (falls nicht vorhanden)
 * 3. Erstellt alle fehlenden Tabellen
 * 4. Fügt Standard-Daten ein
 * 
 * Verwendung:
 *   php scripts/auto-setup-database.php local      # Lokale DB
 *   php scripts/auto-setup-database.php production # Produktions-DB
 */

$environment = $argv[1] ?? 'local';

if ($environment === 'production') {
    require_once __DIR__ . '/../config.production.php';
} else {
    require_once __DIR__ . '/../config.local.php';
}

echo "🚀 Automatisches Datenbank-Setup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "Umgebung: " . ($environment === 'production' ? 'PRODUKTION' : 'LOKAL') . "\n";
echo "Datenbank: " . DB_NAME . "\n";
echo "Host: " . DB_HOST . ":" . DB_PORT . "\n\n";

try {
    // Schritt 1: Verbindung OHNE Datenbank
    $pdoNoDb = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✅ Verbindung zu MySQL erfolgreich\n\n";
    
    // Schritt 2: Prüfe ob Datenbank existiert
    $stmt = $pdoNoDb->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" . DB_NAME . "'");
    $dbExists = $stmt->fetch();
    
    if ($dbExists) {
        echo "📋 Datenbank '" . DB_NAME . "' existiert bereits\n";
        
        // Schritt 3: Backup erstellen
        echo "\n💾 Erstelle Backup...\n";
        require_once __DIR__ . '/backup-database.php';
        passthru("php " . __DIR__ . "/backup-database.php $environment", $backupReturnCode);
        
        if ($backupReturnCode === 0) {
            echo "\n✅ Backup erfolgreich erstellt\n\n";
        } else {
            echo "\n⚠️ Backup konnte nicht erstellt werden\n\n";
        }
    } else {
        echo "📋 Datenbank '" . DB_NAME . "' existiert nicht - wird erstellt\n\n";
    }
    
    // Schritt 4: Datenbank erstellen (falls nicht vorhanden)
    $pdoNoDb->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Datenbank '" . DB_NAME . "' ist bereit\n\n";
    
    // Schritt 5: Verbindung zur Datenbank
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    // Schritt 6: Auto-Setup ausführen
    require_once __DIR__ . '/../api/auto-setup.php';
    $autoSetup = new AutoSetup($pdo);
    
    echo "📦 Erstelle fehlende Tabellen...\n";
    $result = $autoSetup->createMissingTables();
    
    if (!empty($result['created'])) {
        echo "✅ Erstellte Tabellen:\n";
        foreach ($result['created'] as $table) {
            echo "   - $table\n";
        }
    } else {
        echo "✅ Alle Tabellen sind vorhanden\n";
    }
    
    if (!empty($result['errors'])) {
        echo "\n⚠️ Fehler beim Erstellen:\n";
        foreach ($result['errors'] as $error) {
            echo "   - {$error['table']}: {$error['error']}\n";
        }
    }
    
    // Schritt 7: Standard-Daten einfügen
    echo "\n📋 Füge Standard-Daten ein...\n";
    $autoSetup->insertDefaultData();
    echo "✅ Standard-Daten eingefügt\n\n";
    
    // Schritt 8: Vollständiges Setup ausführen (falls gewünscht)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "📋 Möchten Sie die vollständige Datenbank-Struktur erstellen?\n";
    echo "   (Dies erstellt ALLE Tabellen aus create-complete-database.sql)\n";
    echo "   (yes/no): ";
    
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    
    if (trim($line) === 'yes') {
        echo "\n📦 Erstelle vollständige Datenbank-Struktur...\n";
        $sqlFile = __DIR__ . '/../database/create-complete-database.sql';
        
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            // Entferne CREATE DATABASE Statement (DB existiert bereits)
            $sql = preg_replace('/CREATE DATABASE.*?;/i', '', $sql);
            $sql = preg_replace('/USE.*?;/i', '', $sql);
            
            // Teile in Statements
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                function($stmt) {
                    return !empty($stmt) && strlen($stmt) > 10;
                }
            );
            
            $created = 0;
            $skipped = 0;
            
            foreach ($statements as $statement) {
                try {
                    $pdo->exec($statement);
                    if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                        $created++;
                    }
                } catch (PDOException $e) {
                    // Ignoriere "already exists" Fehler
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $skipped++;
                    }
                }
            }
            
            echo "✅ Tabellen erstellt: $created\n";
            if ($skipped > 0) {
                echo "⚠️ Übersprungen: $skipped\n";
            }
        } else {
            echo "⚠️ SQL-Datei nicht gefunden: $sqlFile\n";
        }
    } else {
        echo "\n⏭️ Vollständiges Setup übersprungen\n";
    }
    fclose($handle);
    
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "✅ Automatisches Setup abgeschlossen!\n\n";
    
    // Zeige Status
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "📊 Tabellen in Datenbank: " . count($tables) . "\n";
    
} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>


