<?php
/**
 * Create Prepaid Recharge Amounts Table
 * Erstellt die Tabelle für Prepaid-Aufladungsbeträge
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();

    if (!$pdo) {
        die("❌ Datenbankverbindung fehlgeschlagen\n");
    }

    echo "✅ Datenbankverbindung erfolgreich\n";

    // Erstelle prepaid_recharge_amounts Tabelle
    echo "📝 Erstelle prepaid_recharge_amounts Tabelle...\n";

    $sql = "CREATE TABLE IF NOT EXISTS `prepaid_recharge_amounts` (
        `id` CHAR(36) PRIMARY KEY,
        `amount` DECIMAL(10, 2) NOT NULL,
        `currency_code` VARCHAR(3) DEFAULT 'EUR',
        `bonus_percentage` DECIMAL(5, 2) DEFAULT 0.00,
        `is_active` TINYINT(1) DEFAULT 1,
        `sort_order` INT DEFAULT 0,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_prepaid_recharge_amounts_active` (`is_active`),
        INDEX `idx_prepaid_recharge_amounts_sort` (`sort_order`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "✅ prepaid_recharge_amounts Tabelle erstellt\n";

    // Füge Standard-Aufladungsbeträge hinzu
    echo "📝 Füge Standard-Aufladungsbeträge hinzu...\n";

    $amounts = [
        ['id' => '00000000-0000-0000-0000-000000000020', 'amount' => 10.00, 'sort_order' => 1],
        ['id' => '00000000-0000-0000-0000-000000000021', 'amount' => 25.00, 'bonus_percentage' => 5.00, 'sort_order' => 2],
        ['id' => '00000000-0000-0000-0000-000000000022', 'amount' => 50.00, 'bonus_percentage' => 10.00, 'sort_order' => 3],
        ['id' => '00000000-0000-0000-0000-000000000023', 'amount' => 100.00, 'bonus_percentage' => 15.00, 'sort_order' => 4],
        ['id' => '00000000-0000-0000-0000-000000000024', 'amount' => 250.00, 'bonus_percentage' => 20.00, 'sort_order' => 5],
    ];

    foreach ($amounts as $amount) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO prepaid_recharge_amounts (id, amount, currency_code, bonus_percentage, is_active, sort_order) VALUES (?, ?, 'EUR', ?, 1, ?)");
        $stmt->execute([
            $amount['id'],
            $amount['amount'],
            $amount['bonus_percentage'] ?? 0.00,
            $amount['sort_order']
        ]);
    }

    echo "✅ Standard-Aufladungsbeträge hinzugefügt\n";

    // Verifiziere
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM prepaid_recharge_amounts");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Anzahl Datensätze: {$result['count']}\n";

    if ($result['count'] > 0) {
        $stmt = $pdo->query("SELECT id, amount, bonus_percentage, sort_order FROM prepaid_recharge_amounts ORDER BY sort_order LIMIT 5");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "   Beispieldatensätze:\n";
        foreach ($items as $item) {
            echo "     - {$item['amount']} EUR (Bonus: {$item['bonus_percentage']}%, Sort: {$item['sort_order']})\n";
        }
    }

    echo "\n🎉 Prepaid Recharge Amounts Tabelle erfolgreich erstellt!\n";

} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>
