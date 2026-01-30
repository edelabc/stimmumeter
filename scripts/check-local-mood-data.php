<?php
/**
 * Prüfe mood_assessments, mood_entries und mood_indicator_values in lokaler MySQL
 */

require_once __DIR__ . '/../config.local.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ MySQL-Verbindung erfolgreich\n\n";
    
    $tables = ['mood_assessments', 'mood_entries', 'mood_indicator_values'];
    
    foreach ($tables as $table) {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "📋 Tabelle: $table\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Prüfe ob Tabelle existiert
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if (!$tableExists) {
            echo "❌ Tabelle existiert nicht in MySQL\n\n";
            continue;
        }
        
        // Zähle Datensätze
        $count = $pdo->query("SELECT COUNT(*) as cnt FROM `$table`")->fetch()['cnt'];
        echo "📊 Anzahl Datensätze: $count\n";
        
        if ($count > 0) {
            // Zeige erste 3 Datensätze
            $stmt = $pdo->query("SELECT * FROM `$table` LIMIT 3");
            $rows = $stmt->fetchAll();
            echo "\nErste 3 Datensätze:\n";
            foreach ($rows as $i => $row) {
                echo "\n--- Datensatz " . ($i + 1) . " ---\n";
                foreach ($row as $key => $value) {
                    $displayValue = is_string($value) && strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value;
                    echo "  $key: $displayValue\n";
                }
            }
        }
        
        echo "\n";
    }
    
    echo "✅ Prüfung abgeschlossen!\n";
    
} catch (PDOException $e) {
    echo "❌ MySQL-Fehler: " . $e->getMessage() . "\n";
    exit(1);
}





