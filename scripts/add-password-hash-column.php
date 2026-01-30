<?php
/**
 * Fügt password_hash Spalte zur users_profile Tabelle hinzu
 */

require_once __DIR__ . '/../config.local.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Prüfe ob Spalte bereits existiert
    $stmt = $pdo->query("SHOW COLUMNS FROM users_profile LIKE 'password_hash'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        // Füge Spalte hinzu
        $pdo->exec("ALTER TABLE users_profile ADD COLUMN password_hash VARCHAR(255) NULL");
        echo "✅ Spalte 'password_hash' wurde erfolgreich hinzugefügt.\n";
    } else {
        echo "ℹ️ Spalte 'password_hash' existiert bereits.\n";
    }
    
    // Prüfe auch is_blocked Spalte
    $stmt = $pdo->query("SHOW COLUMNS FROM users_profile LIKE 'is_blocked'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        $pdo->exec("ALTER TABLE users_profile ADD COLUMN is_blocked TINYINT(1) DEFAULT 0");
        echo "✅ Spalte 'is_blocked' wurde erfolgreich hinzugefügt.\n";
    } else {
        echo "ℹ️ Spalte 'is_blocked' existiert bereits.\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>




