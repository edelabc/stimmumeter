/*
  # Add missing columns to payment_providers table
  
  Fügt die fehlenden Spalten hinzu, die für die Stripe-Konfiguration benötigt werden:
  - config (JSON) - Für verschlüsselte API-Keys
  - is_test_mode (TINYINT(1)) - Test/Live-Modus
  - updated_at (DATETIME) - Zeitstempel für Updates
*/

-- Prüfe ob Spalten bereits existieren und füge sie hinzu, falls nicht
SET @dbname = DATABASE();
SET @tablename = "payment_providers";
SET @columnname = "config";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " JSON DEFAULT '{}'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "is_test_mode";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TINYINT(1) DEFAULT 1")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "updated_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Erstelle Index für code falls nicht vorhanden
CREATE INDEX IF NOT EXISTS idx_payment_providers_code ON payment_providers(code);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(is_active);




