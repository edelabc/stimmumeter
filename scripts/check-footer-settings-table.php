<?php
/**
 * Check Footer Settings Table
 * Prüft und erstellt gegebenenfalls die footer_settings Tabelle
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();

    if (!$pdo) {
        die("❌ Datenbankverbindung fehlgeschlagen\n");
    }

    echo "✅ Datenbankverbindung erfolgreich\n";

    // Prüfe ob footer_settings Tabelle existiert
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'footer_settings'")->fetch();
    
    if ($tableCheck) {
        echo "✅ footer_settings Tabelle existiert bereits\n";
        
        // Zeige Inhalt
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM footer_settings");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   Anzahl Datensätze: {$result['count']}\n";
    } else {
        echo "❌ footer_settings Tabelle existiert NICHT\n";
        echo "📝 Erstelle footer_settings Tabelle...\n";

        $sql = "CREATE TABLE IF NOT EXISTS `footer_settings` (
            `id` CHAR(36) PRIMARY KEY,
            `content` JSON NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        $pdo->exec($sql);
        echo "✅ footer_settings Tabelle erstellt\n";

        // Füge Standard-Eintrag hinzu
        echo "📝 Füge Standard-Footer-Einstellungen hinzu...\n";

        $id = '00000000-0000-0000-0000-000000000030';
        $defaultContent = json_encode([
            'text' => '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
            'links' => []
        ]);

        $stmt = $pdo->prepare("INSERT IGNORE INTO footer_settings (id, content) VALUES (?, ?)");
        $stmt->execute([$id, $defaultContent]);

        echo "✅ Standard-Footer-Einstellungen hinzugefügt\n";

        // Verifiziere
        $stmt = $pdo->query("SELECT * FROM footer_settings LIMIT 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            echo "   Standard-Eintrag erstellt mit ID: {$result['id']}\n";
        }
    }

    echo "\n🎉 Footer Settings Check abgeschlossen!\n";

} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>

