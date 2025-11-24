-- ==========================================
-- Erstelle session_yra Tabelle
-- ==========================================
-- Diese Datei erstellt nur die session_yra Tabelle
-- Falls die Tabelle bereits existiert, wird sie übersprungen

USE `wameli`;

-- Session YRA Table
CREATE TABLE IF NOT EXISTS `session_yra` (
  `session_id` VARCHAR(255) PRIMARY KEY,
  `yra_balance` INT DEFAULT 0 NOT NULL,
  `assessments_count` INT DEFAULT 0 NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_activity` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` CHAR(36) NULL,
  `yra_transferred` TINYINT(1) DEFAULT 0,
  INDEX `idx_session_yra_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Tabelle session_yra erfolgreich erstellt!' AS Status;


