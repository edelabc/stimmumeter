-- Migration: Add description field to mood_indicators table
-- Datum: 2025-01-24

-- Prüfe ob Spalte bereits existiert und füge sie hinzu falls nicht
SET @dbname = DATABASE();
SET @tablename = 'mood_indicators';
SET @columnname = 'description';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL AFTER category_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

