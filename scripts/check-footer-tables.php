<?php
/**
 * Check Footer Tables Script
 * Prüft ob footer_menu_items Tabelle existiert
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();

    if (!$pdo) {
        die("❌ Datenbankverbindung fehlgeschlagen\n");
    }

    echo "✅ Datenbankverbindung erfolgreich\n";

    // Prüfe ob footer_menu_items Tabelle existiert
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'footer_menu_items'")->fetch();
    if ($tableCheck) {
        echo "✅ footer_menu_items Tabelle existiert\n";

        // Zeige Inhalt
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM footer_menu_items");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   Anzahl Datensätze: {$result['count']}\n";

        if ($result['count'] > 0) {
            $stmt = $pdo->query("SELECT id, title, category, position FROM footer_menu_items ORDER BY category, position LIMIT 5");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "   Beispieldatensätze:\n";
            foreach ($items as $item) {
                echo "     - {$item['title']} ({$item['category']}, Position: {$item['position']})\n";
            }
        }
    } else {
        echo "❌ footer_menu_items Tabelle existiert NICHT\n";

        // Erstelle die Tabelle
        echo "📝 Erstelle footer_menu_items Tabelle...\n";

        $sql = "CREATE TABLE IF NOT EXISTS `footer_menu_items` (
            `id` CHAR(36) PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `url` VARCHAR(500) NULL,
            `position` INT DEFAULT 0,
            `is_active` TINYINT(1) DEFAULT 1,
            `category` VARCHAR(50) DEFAULT 'general',
            `linked_agreement_id` CHAR(36) NULL,
            `slug` VARCHAR(255) NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_footer_menu_items_category` (`category`),
            INDEX `idx_footer_menu_items_position` (`category`, `position`),
            INDEX `idx_footer_menu_items_active` (`is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        $pdo->exec($sql);
        echo "✅ footer_menu_items Tabelle erstellt\n";

        // Füge Standarddaten hinzu
        echo "📝 Füge Standard-Footer-Items hinzu...\n";

        $items = [
            ['id' => '00000000-0000-0000-0000-000000000010', 'title' => 'Impressum', 'url' => '/impressum', 'position' => 1, 'category' => 'legal'],
            ['id' => '00000000-0000-0000-0000-000000000011', 'title' => 'Datenschutz', 'url' => '/datenschutz', 'position' => 2, 'category' => 'legal'],
            ['id' => '00000000-0000-0000-0000-000000000012', 'title' => 'AGB', 'url' => '/agb', 'position' => 3, 'category' => 'legal'],
            ['id' => '00000000-0000-0000-0000-000000000013', 'title' => 'Über uns', 'url' => '/ueber-uns', 'position' => 1, 'category' => 'company'],
            ['id' => '00000000-0000-0000-0000-000000000014', 'title' => 'Kontakt', 'url' => '/kontakt', 'position' => 2, 'category' => 'company'],
        ];

        foreach ($items as $item) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO footer_menu_items (id, title, url, position, category, is_active) VALUES (?, ?, ?, ?, ?, 1)");
            $stmt->execute([$item['id'], $item['title'], $item['url'], $item['position'], $item['category']]);
        }

        echo "✅ Standard-Footer-Items hinzugefügt\n";

        // Verifiziere
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM footer_menu_items");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   Neue Anzahl Datensätze: {$result['count']}\n";
    }

    echo "\n🎉 Footer-Tabellen-Check abgeschlossen!\n";

} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>

