#!/usr/bin/env php
<?php
/**
 * Einfaches Script zum Erstellen der Datenbank
 * 
 * Erstellt die Datenbank "wameli" für Online oder "stimmumeter" für Local
 * 
 * Verwendung:
 *   php scripts/create-database-simple.php local    # Für lokale DB
 *   php scripts/create-database-simple.php production  # Für Produktions-DB
 */

$environment = $argv[1] ?? 'local';

if ($environment === 'production') {
    require_once __DIR__ . '/../config.production.php';
    $dbName = DB_NAME;
    $dbHost = DB_HOST;
    $dbUser = DB_USER;
    $dbPass = DB_PASS;
    $dbPort = DB_PORT;
} else {
    require_once __DIR__ . '/../config.local.php';
    $dbName = DB_NAME;
    $dbHost = DB_HOST;
    $dbUser = DB_USER;
    $dbPass = DB_PASS;
    $dbPort = DB_PORT;
}

echo "🚀 Erstelle Datenbank: $dbName\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Verbindung OHNE Datenbank (um Datenbank zu erstellen)
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    echo "✅ Verbindung zu MySQL erfolgreich\n";
    echo "   Host: $dbHost:$dbPort\n";
    echo "   User: $dbUser\n\n";
    
    // Prüfe ob Datenbank bereits existiert
    $stmt = $pdo->query("SHOW DATABASES LIKE '$dbName'");
    if ($stmt->rowCount() > 0) {
        echo "⚠️  Datenbank '$dbName' existiert bereits!\n";
        echo "   Möchten Sie sie löschen und neu erstellen? (yes/no): ";
        
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        if (trim($line) === 'yes') {
            echo "\n🗑️  Lösche vorhandene Datenbank...\n";
            $pdo->exec("DROP DATABASE IF EXISTS `$dbName`");
            echo "✅ Datenbank gelöscht\n\n";
        } else {
            echo "\n❌ Abgebrochen. Datenbank bleibt unverändert.\n";
            exit(0);
        }
        fclose($handle);
    }
    
    // Erstelle Datenbank
    echo "📦 Erstelle Datenbank '$dbName'...\n";
    $pdo->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Datenbank '$dbName' erfolgreich erstellt!\n\n";
    
    // Verwende die Datenbank
    $pdo->exec("USE `$dbName`");
    
    // Prüfe Tabellen
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 Tabellen in Datenbank: " . count($tables) . "\n";
    
    if (count($tables) > 0) {
        echo "   Vorhandene Tabellen:\n";
        foreach ($tables as $table) {
            echo "   - $table\n";
        }
    } else {
        echo "   (Noch keine Tabellen vorhanden)\n";
    }
    
    echo "\n✅ Datenbank ist bereit!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "📝 Nächste Schritte:\n";
    echo "   1. Führen Sie die Migrationen aus:\n";
    echo "      php scripts/setup-database-local.php\n";
    echo "      (oder setup-database-production.php für Produktion)\n";
    echo "   2. Oder importieren Sie die SQL-Dateien manuell in phpMyAdmin\n\n";
    
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n\n";
    echo "🔧 Lösungsvorschläge:\n";
    echo "   1. Prüfen Sie, ob MySQL läuft\n";
    echo "   2. Prüfen Sie Benutzername und Passwort\n";
    echo "   3. Prüfen Sie, ob der Benutzer die Berechtigung hat, Datenbanken zu erstellen\n";
    echo "   4. Für XAMPP: Starten Sie MySQL über XAMPP Control Panel\n\n";
    exit(1);
}

?>





