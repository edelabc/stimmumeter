#!/usr/bin/env php
<?php
/**
 * Setup-Script für Produktions-Datenbank
 * 
 * Erstellt die komplette Datenbankstruktur auf dem Live-Server
 * 
 * Verwendung:
 *   php scripts/setup-database-production.php
 * 
 * ⚠️ WICHTIG: Nur auf dem Produktions-Server ausführen!
 */

require_once __DIR__ . '/../config.production.php';

echo "🚀 Stimmumeter - Produktions-Datenbank-Setup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Sicherheitsabfrage
echo "⚠️  WICHTIG: Sie sind dabei, die PRODUKTIONS-Datenbank zu erstellen!\n";
echo "   Host: " . DB_HOST . "\n";
echo "   Datenbank: " . DB_NAME . "\n";
echo "   Benutzer: " . DB_USER . "\n\n";
echo "Möchten Sie fortfahren? (yes/no): ";

$handle = fopen("php://stdin", "r");
$line = fgets($handle);
if (trim($line) !== 'yes') {
    echo "❌ Abgebrochen.\n";
    exit(0);
}
fclose($handle);

echo "\n";

// Datenbankverbindung ohne Datenbank (um Datenbank zu erstellen)
try {
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
    
    // Erstelle Datenbank falls nicht vorhanden
    echo "📦 Erstelle Datenbank '" . DB_NAME . "'...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Datenbank erstellt\n\n";
    
    // Verwende die Datenbank
    $pdo->exec("USE `" . DB_NAME . "`");
    
    // Lade MySQL-Migrationen
    $migrationDir = __DIR__ . '/../database/migrations/mysql';
    if (!is_dir($migrationDir)) {
        echo "❌ Fehler: Migrations-Verzeichnis nicht gefunden: $migrationDir\n";
        echo "   Bitte führen Sie zuerst das Konvertierungs-Script aus:\n";
        echo "   php scripts/convert-migrations-to-mysql.php\n";
        exit(1);
    }
    
    // Lade alle Migrationen in chronologischer Reihenfolge
    $migrations = glob($migrationDir . '/*.sql');
    sort($migrations);
    
    if (empty($migrations)) {
        echo "❌ Fehler: Keine Migrationen gefunden!\n";
        echo "   Bitte führen Sie zuerst das Konvertierungs-Script aus:\n";
        echo "   php scripts/convert-migrations-to-mysql.php\n";
        exit(1);
    }
    
    echo "📋 Gefundene Migrationen: " . count($migrations) . "\n\n";
    
    // Führe Migrationen aus
    foreach ($migrations as $migration) {
        $filename = basename($migration);
        echo "🔄 Führe aus: $filename...\n";
        
        $sql = file_get_contents($migration);
        
        // Teile SQL in einzelne Statements
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) {
                return !empty($stmt) && 
                       !preg_match('/^\s*--/', $stmt) && 
                       !preg_match('/^\s*\/\*/', $stmt);
            }
        );
        
        foreach ($statements as $statement) {
            if (empty(trim($statement))) continue;
            
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                // Ignoriere "already exists" Fehler
                if (strpos($e->getMessage(), 'already exists') === false &&
                    strpos($e->getMessage(), 'Duplicate') === false) {
                    echo "   ⚠️  Warnung: " . $e->getMessage() . "\n";
                }
            }
        }
        
        echo "   ✅ Abgeschlossen\n";
    }
    
    echo "\n✅ Datenbank-Setup erfolgreich abgeschlossen!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>




