<?php
/**
 * Create AI Tables Simple Script
 * Erstellt nur die AI-Tabellen ohne andere Migrationen
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();

    if (!$pdo) {
        die("❌ Datenbankverbindung fehlgeschlagen\n");
    }

    echo "✅ Datenbankverbindung erfolgreich\n";

    // Erstelle ai_configurations Tabelle
    $sql1 = "CREATE TABLE IF NOT EXISTS `ai_configurations` (
        `id` CHAR(36) PRIMARY KEY,
        `user_id` CHAR(36) NOT NULL,
        `nickname` VARCHAR(255) NOT NULL,
        `provider` ENUM('openai', 'gemini', 'claude', 'xai', 'manus') NOT NULL,
        `model` VARCHAR(255) NOT NULL,
        `api_key` TEXT NOT NULL,
        `text_color` VARCHAR(7) DEFAULT '#000000',
        `background_color` VARCHAR(7) DEFAULT '#ffffff',
        `is_active` TINYINT(1) DEFAULT 0,
        `is_enabled` TINYINT(1) DEFAULT 1,
        `system_prompt` TEXT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_ai_configurations_user_id` (`user_id`),
        INDEX `idx_ai_configurations_is_active` (`user_id`, `is_active`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql1);
    echo "✅ ai_configurations Tabelle erstellt\n";

    // Erstelle ai_provider_settings Tabelle
    $sql2 = "CREATE TABLE IF NOT EXISTS `ai_provider_settings` (
        `id` CHAR(36) PRIMARY KEY,
        `provider` ENUM('openai', 'gemini', 'claude', 'xai', 'manus') UNIQUE NOT NULL,
        `is_enabled` TINYINT(1) DEFAULT 1,
        `system_prompt` TEXT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_ai_provider_settings_enabled` (`is_enabled`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql2);
    echo "✅ ai_provider_settings Tabelle erstellt\n";

    // Erstelle ai_terms_acceptance Tabelle
    $sql3 = "CREATE TABLE IF NOT EXISTS `ai_terms_acceptance` (
        `id` CHAR(36) PRIMARY KEY,
        `user_id` CHAR(36) NOT NULL,
        `provider` ENUM('openai', 'gemini', 'claude', 'xai', 'manus') NOT NULL,
        `accepted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `terms_version` VARCHAR(50) DEFAULT '1.0',
        UNIQUE KEY `unique_user_provider` (`user_id`, `provider`),
        INDEX `idx_ai_terms_acceptance_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql3);
    echo "✅ ai_terms_acceptance Tabelle erstellt\n";

    // Füge Standard-Daten ein
    $pdo->exec("INSERT IGNORE INTO `ai_provider_settings` (`id`, `provider`, `is_enabled`, `system_prompt`) VALUES
        ('00000000-0000-0000-0000-000000000001', 'openai', 1, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
        ('00000000-0000-0000-0000-000000000002', 'gemini', 1, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
        ('00000000-0000-0000-0000-000000000003', 'claude', 1, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
        ('00000000-0000-0000-0000-000000000004', 'xai', 1, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
        ('00000000-0000-0000-0000-000000000005', 'manus', 1, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.')");

    echo "✅ Standard-Daten eingefügt\n";

    // Verifizierung
    echo "\n🔍 Verifizierung:\n";

    $tables = ['ai_configurations', 'ai_provider_settings', 'ai_terms_acceptance'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   ✅ $table: {$result['count']} Datensätze\n";
    }

    echo "\n🎉 AI-Tabellen erfolgreich erstellt!\n";

} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>
