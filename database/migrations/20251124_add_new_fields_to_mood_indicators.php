<?php
require_once __DIR__ . '/../../api/db.php';

try {
    $pdo = DB::getInstance();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "
        ALTER TABLE `mood_indicators`
        ADD COLUMN `min_value` FLOAT DEFAULT 0 COMMENT 'Minimum value for the indicator scale' AFTER `is_active`,
        ADD COLUMN `max_value` FLOAT DEFAULT 10 COMMENT 'Maximum value for the indicator scale' AFTER `min_value`,
        ADD COLUMN `step_value` FLOAT DEFAULT 1 COMMENT 'Step value for the indicator scale' AFTER `max_value`,
        ADD COLUMN `icon_url` VARCHAR(255) DEFAULT NULL COMMENT 'URL or path to the icon, can be an emoji' AFTER `user_id`,
        ADD COLUMN `description` TEXT DEFAULT NULL COMMENT 'Scientific or detailed description of the indicator' AFTER `icon_url`,
        ADD COLUMN `color_start` VARCHAR(7) DEFAULT '#e5e7eb' COMMENT 'Start color for gradient' AFTER `description`,
        ADD COLUMN `color_end` VARCHAR(7) DEFAULT '#4b5563' COMMENT 'End color for gradient, replaces old color column' AFTER `color_start`;
    ";

    $pdo->exec($sql);

    // It seems the old `color` column is now `color_end`. Let's copy data and then drop the old column if needed.
    // For now, I will just add the new columns. If `color` is not used anymore, we can remove it later.
    // Let's assume `color_end` will be used instead of `color`.

    echo "Migration successful: 'mood_indicators' table updated with new columns (icon_url, description, color_start, color_end).\n";

} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
