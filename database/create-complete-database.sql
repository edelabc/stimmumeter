-- ==========================================
-- WAMELI - Komplette Datenbank-Struktur
-- ==========================================
-- Diese Datei erstellt die komplette Datenbank-Struktur
-- Führen Sie diese Datei direkt in phpMyAdmin aus!
--
-- Verwendung:
-- 1. Öffnen Sie phpMyAdmin: http://localhost/phpmyadmin
-- 2. Klicken Sie auf "SQL" im oberen Menü
-- 3. Kopieren Sie den gesamten Inhalt dieser Datei
-- 4. Fügen Sie ihn ein und klicken Sie auf "Ausführen"
-- ==========================================

-- Erstelle Datenbank
CREATE DATABASE IF NOT EXISTS `wameli` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `wameli`;

-- ==========================================
-- TABELLEN ERSTELLEN
-- ==========================================

-- Users Profile
CREATE TABLE IF NOT EXISTS `users_profile` (
  `id` CHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pseudonyms
CREATE TABLE IF NOT EXISTS `pseudonyms` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(7) DEFAULT '#3b82f6',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `age` INT NULL,
  `gender` VARCHAR(50) NULL,
  `weight` DECIMAL(5,2) NULL,
  `height` DECIMAL(5,2) NULL,
  `occupation` VARCHAR(255) NULL,
  `country` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `city_addition` VARCHAR(100) NULL,
  `street` VARCHAR(255) NULL,
  `house_number` VARCHAR(50) NULL,
  `house_number_addition` VARCHAR(50) NULL,
  `language` VARCHAR(10) NULL,
  INDEX `idx_pseudonyms_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mood Indicators
CREATE TABLE IF NOT EXISTS `mood_indicators` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(7) DEFAULT '#3b82f6',
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `min_value` INT DEFAULT 1,
  `max_value` INT DEFAULT 5,
  `step_value` DECIMAL(5,2) DEFAULT 1.0,
  `color_start` VARCHAR(7) DEFAULT '#ef4444',
  `color_end` VARCHAR(7) DEFAULT '#10b981',
  `user_id` CHAR(36) NULL,
  `icon_url` VARCHAR(500) NULL,
  `category_id` CHAR(36) NULL,
  `description` TEXT NULL,
  INDEX `idx_mood_indicators_user_id` (`user_id`),
  INDEX `idx_mood_indicators_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indicator Categories
CREATE TABLE IF NOT EXISTS `indicator_categories` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mood Entries
CREATE TABLE IF NOT EXISTS `mood_entries` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `pseudonym_id` CHAR(36) NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `entry_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `time_of_day` VARCHAR(50) NULL,
  `weather` VARCHAR(100) NULL,
  `weather_code` INT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `temperature` DECIMAL(5,2) NULL,
  `custom_tags` JSON NULL,
  `location` VARCHAR(255) NULL,
  INDEX `idx_mood_entries_pseudonym_id` (`pseudonym_id`),
  INDEX `idx_mood_entries_entry_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mood Indicator Values
CREATE TABLE IF NOT EXISTS `mood_indicator_values` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `mood_entry_id` CHAR(36) NOT NULL,
  `indicator_id` CHAR(36) NOT NULL,
  `value` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mood_indicator_values_entry_id` (`mood_entry_id`),
  INDEX `idx_mood_indicator_values_indicator_id` (`indicator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `user_id` CHAR(36) PRIMARY KEY,
  `role` VARCHAR(50) DEFAULT 'admin',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Menu Items
CREATE TABLE IF NOT EXISTS `admin_menu_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `parent_id` CHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NULL,
  `icon` VARCHAR(100) NULL,
  `sort_order` INT DEFAULT 0,
  `position` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `role_required` VARCHAR(50) NULL,
  `linked_agreement_id` CHAR(36) NULL,
  `slug` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admin_menu_items_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Items (Public)
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `position` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Footer Settings
CREATE TABLE IF NOT EXISTS `footer_settings` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `content` JSON NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legal Pages
CREATE TABLE IF NOT EXISTS `legal_pages` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `page_type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site Settings
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `site_name` VARCHAR(255) DEFAULT 'Stimmumeter',
  `site_description` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Currencies
CREATE TABLE IF NOT EXISTS `currencies` (
  `code` VARCHAR(3) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `symbol` VARCHAR(10) NOT NULL,
  `is_base` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exchange Rates
CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `from_currency` VARCHAR(3) NOT NULL,
  `to_currency` VARCHAR(3) NOT NULL,
  `rate` DECIMAL(20,8) NOT NULL,
  `valid_from` DATETIME NOT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exchange_rates_from_currency` (`from_currency`),
  INDEX `idx_exchange_rates_to_currency` (`to_currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing Plans
CREATE TABLE IF NOT EXISTS `pricing_plans` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `color` VARCHAR(7) NULL,
  `version` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan Trial Config
CREATE TABLE IF NOT EXISTS `plan_trial_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `plan_id` CHAR(36) NOT NULL,
  `is_enabled` TINYINT(1) DEFAULT 0,
  `duration_value` INT NULL,
  `duration_unit` VARCHAR(50) NULL,
  `is_permanent` TINYINT(1) DEFAULT 0,
  INDEX `idx_plan_trial_config_plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan Subscription Config
CREATE TABLE IF NOT EXISTS `plan_subscription_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `plan_id` CHAR(36) NOT NULL,
  `billing_type` VARCHAR(50) NULL,
  `contract_duration_value` INT NULL,
  `contract_duration_unit` VARCHAR(50) NULL,
  `cancellation_period_value` INT NULL,
  `cancellation_period_unit` VARCHAR(50) NULL,
  `billing_cycle` VARCHAR(50) NULL,
  `base_fee_once` DECIMAL(10,2) DEFAULT 0,
  `base_fee_recurring` DECIMAL(10,2) DEFAULT 0,
  INDEX `idx_plan_subscription_config_plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Billing Item Types
CREATE TABLE IF NOT EXISTS `billing_item_types` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(100) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan Billing Items
CREATE TABLE IF NOT EXISTS `plan_billing_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `plan_id` CHAR(36) NOT NULL,
  `item_type_id` CHAR(36) NOT NULL,
  `price_per_unit` DECIMAL(10,2) NOT NULL,
  `currency_code` VARCHAR(3) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  INDEX `idx_plan_billing_items_plan_id` (`plan_id`),
  INDEX `idx_plan_billing_items_item_type_id` (`item_type_id`),
  INDEX `idx_plan_billing_items_currency_code` (`currency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Subscriptions
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `plan_id` CHAR(36) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'active',
  `trial_start_date` DATETIME NULL,
  `trial_end_date` DATETIME NULL,
  `subscription_start_date` DATETIME NULL,
  `subscription_end_date` DATETIME NULL,
  `cancellation_date` DATETIME NULL,
  `auto_renew` TINYINT(1) DEFAULT 1,
  `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ends_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_subscriptions_user_id` (`user_id`),
  INDEX `idx_user_subscriptions_plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage Records
CREATE TABLE IF NOT EXISTS `usage_records` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `subscription_id` CHAR(36) NULL,
  `item_type_id` CHAR(36) NOT NULL,
  `quantity` INT DEFAULT 1,
  `reference_id` CHAR(36) NULL,
  `recorded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `billing_period_start` DATETIME NULL,
  `billing_period_end` DATETIME NULL,
  `is_billed` TINYINT(1) DEFAULT 0,
  INDEX `idx_usage_records_user_id` (`user_id`),
  INDEX `idx_usage_records_subscription_id` (`subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `invoice_number` VARCHAR(255) UNIQUE NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `subscription_id` CHAR(36) NULL,
  `status` VARCHAR(50) DEFAULT 'draft',
  `issue_date` DATETIME NULL,
  `due_date` DATETIME NULL,
  `paid_date` DATETIME NULL,
  `billing_period_start` DATETIME NULL,
  `billing_period_end` DATETIME NULL,
  `subtotal` DECIMAL(10,2) DEFAULT 0,
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(10,2) DEFAULT 0,
  `total_amount` DECIMAL(10,2) DEFAULT 0,
  `currency_code` VARCHAR(3) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_invoices_user_id` (`user_id`),
  INDEX `idx_invoices_subscription_id` (`subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `invoice_id` CHAR(36) NOT NULL,
  `item_type_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` INT DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `line_total` DECIMAL(10,2) NOT NULL,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_invoice_items_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Help Texts
CREATE TABLE IF NOT EXISTS `help_texts` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `code` VARCHAR(255) UNIQUE NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `context` VARCHAR(100) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Providers
CREATE TABLE IF NOT EXISTS `payment_providers` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Provider Webhooks
CREATE TABLE IF NOT EXISTS `payment_provider_webhooks` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `provider_id` CHAR(36) NOT NULL,
  `webhook_secret` TEXT NULL,
  `webhook_url` VARCHAR(500) NULL,
  `events` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payment_provider_webhooks_provider_id` (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `invoice_id` CHAR(36) NULL,
  `provider_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency_code` VARCHAR(3) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `provider_payment_id` VARCHAR(255) NULL,
  `provider_response` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_user_id` (`user_id`),
  INDEX `idx_payments_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Configurations
CREATE TABLE IF NOT EXISTS `ai_configurations` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
  INDEX `idx_ai_configurations_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Account Config
CREATE TABLE IF NOT EXISTS `user_account_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) UNIQUE NOT NULL,
  `current_plan_id` CHAR(36) NULL,
  `prepaid_balance` DECIMAL(10,2) DEFAULT 0,
  `currency_code` VARCHAR(3) DEFAULT 'EUR',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_account_config_user_id` (`user_id`),
  INDEX `idx_user_account_config_current_plan_id` (`current_plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agreements System
CREATE TABLE IF NOT EXISTS `t_vereinbarungstitel` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `titel` VARCHAR(255) NOT NULL,
  `beschreibung` TEXT NULL,
  `erstellt_von_user_id` CHAR(36) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `gesperrt` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vereinbarungstitel_user_id` (`erstellt_von_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_vereinbarungen` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `titel_id` CHAR(36) NOT NULL,
  `inhalt` TEXT NOT NULL,
  `ersteller_user_id` CHAR(36) NULL,
  `empfaenger_user_id` CHAR(36) NULL,
  `status` VARCHAR(50) DEFAULT 'Entwurf',
  `version` INT DEFAULT 1,
  `parent_vereinbarung_id` CHAR(36) NULL,
  `unterzeichnet_am` DATE NULL,
  `bearbeiter_von` VARCHAR(255) NULL,
  `bearbeiter_an` VARCHAR(255) NULL,
  `kurze_zusammenfassung` TEXT NULL,
  `anlagen` TEXT NULL,
  `unterzeichnungsdatum_ersteller` DATE NULL,
  `unterzeichnungsdatum_empfaenger` DATE NULL,
  `gueltigkeit_von` DATE NULL,
  `gueltigkeit_bis` DATE NULL,
  `kuendigungsfrist_wert` INT NULL,
  `kuendigungsfrist_einheit` VARCHAR(50) NULL,
  `slug` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vereinbarungen_titel_id` (`titel_id`),
  INDEX `idx_vereinbarungen_ersteller` (`ersteller_user_id`),
  INDEX `idx_vereinbarungen_empfaenger` (`empfaenger_user_id`),
  UNIQUE INDEX `idx_vereinbarungen_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_vereinbarungs_logs` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `vereinbarung_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `aktion` VARCHAR(255) NOT NULL,
  `details` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vereinbarungs_logs_vereinbarung_id` (`vereinbarung_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_platzhalter_definitionen` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `platzhalter_schluessel` VARCHAR(255) UNIQUE NOT NULL,
  `beschreibung` TEXT NOT NULL,
  `quell_tabelle` VARCHAR(255) NOT NULL,
  `quell_spalte` VARCHAR(255) NOT NULL,
  `zulaessige_rollen` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mood Assessment System
CREATE TABLE IF NOT EXISTS `mood_assessments` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `session_id` VARCHAR(255) NOT NULL,
  `symbol_type` ENUM('woman', 'man', 'child', 'family', 'group') NOT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `mood` ENUM('positive', 'neutral', 'negative') NOT NULL,
  `intensity` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `device_fingerprint` VARCHAR(255) NULL,
  INDEX `idx_mood_assessments_session_id` (`session_id`),
  INDEX `idx_mood_assessments_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS `yra_rewards_config` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `reward_type` VARCHAR(100) UNIQUE NOT NULL,
  `min_amount` INT NOT NULL,
  `max_amount` INT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bot_protection_logs` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `session_id` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `details` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bot_protection_logs_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Agreement Consents
CREATE TABLE IF NOT EXISTS `user_agreement_consents` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `agreement_id` CHAR(36) NOT NULL,
  `agreement_version` INT NOT NULL,
  `consent_type` ENUM('AGB', 'Datenschutz', 'Cookies', 'DSGVO', 'Impressum', 'Widerruf') NOT NULL,
  `consented_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_agreement_consents_user_id` (`user_id`),
  INDEX `idx_user_agreement_consents_agreement_id` (`agreement_id`),
  INDEX `idx_user_agreement_consents_consent_type` (`consent_type`),
  INDEX `idx_user_agreement_consents_consented_at` (`consented_at` DESC),
  UNIQUE KEY `idx_user_agreement_consents_unique` (`user_id`, `agreement_id`, `agreement_version`),
  FOREIGN KEY (`user_id`) REFERENCES `users_profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`agreement_id`) REFERENCES `t_vereinbarungen`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- STANDARD-DATEN EINFÜGEN
-- ==========================================

-- Site Settings
INSERT INTO `site_settings` (`id`, `site_name`, `site_description`) 
VALUES (UUID(), 'WAMELI', 'Erfasse die Stimmung deines Umfelds')
ON DUPLICATE KEY UPDATE `site_name` = `site_name`;

-- Currencies
INSERT INTO `currencies` (`code`, `name`, `symbol`, `is_base`, `is_active`) VALUES
  ('EUR', 'Euro', '€', 1, 1),
  ('USD', 'US Dollar', '$', 0, 1),
  ('YRA', 'YRA Coin', 'YRA', 0, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- YRA Rewards Config
INSERT INTO `yra_rewards_config` (`reward_type`, `min_amount`, `max_amount`, `is_active`) VALUES
  ('mood_assessment', 5, 15, 1),
  ('streak_bonus_3', 10, 20, 1),
  ('streak_bonus_7', 25, 50, 1),
  ('streak_bonus_14', 50, 100, 1)
ON DUPLICATE KEY UPDATE `min_amount` = VALUES(`min_amount`);

-- Indicator Categories
INSERT INTO `indicator_categories` (`id`, `name`, `description`) VALUES
  (UUID(), 'Positive Stimmung (VALENZ POSITIV)', 'Positive Emotionen und Eigenschaften'),
  (UUID(), 'Neutrale / Ambivalente Stimmung (VALENZ NEUTRAL / GEMISCHT)', 'Neutrale oder gemischte Emotionen'),
  (UUID(), 'Negative Stimmung (VALENZ NEGATIV)', 'Negative Emotionen und Eigenschaften')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Billing Item Types
INSERT INTO `billing_item_types` (`code`, `name`, `description`, `icon`, `is_active`, `sort_order`) VALUES
  ('pseudonym', 'Pseudonym', 'Cost per pseudonym created', 'User', 1, 1),
  ('mood_entry', 'Mood Entry', 'Cost per mood entry recorded', 'Heart', 1, 2),
  ('ai_integration', 'AI Integration', 'Cost per AI analysis or forecast', 'Brain', 1, 3),
  ('analysis', 'Analysis', 'Cost per data analysis performed', 'BarChart3', 1, 4),
  ('export', 'Export', 'Cost per data export (PDF, CSV, Image)', 'Download', 1, 5),
  ('import', 'Import', 'Cost per data import', 'Upload', 1, 6),
  ('storage', 'Storage', 'Monthly storage cost', 'Database', 1, 7),
  ('api_call', 'API Call', 'Cost per API request', 'Zap', 1, 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Standard Mood Indicators (erste 30)
INSERT INTO `mood_indicators` (`name`, `color`, `sort_order`, `is_active`, `min_value`, `max_value`, `step_value`, `color_start`, `color_end`, `user_id`) VALUES
  ('Freundlichkeit', '#10b981', 1, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Sympathie', '#3b82f6', 2, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Wut', '#ef4444', 3, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Unnahbarkeit', '#6b7280', 4, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Gerissenheit', '#f59e0b', 5, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Aktiv', '#84cc16', 6, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Ermüdet', '#64748b', 7, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Lustlos', '#78716c', 8, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Sexy', '#ec4899', 9, 1, 0, 10, 0.5, '#ef4444', '#ec4899', NULL),
  ('Lustig', '#eab308', 10, 1, 0, 10, 0.5, '#ef4444', '#eab308', NULL),
  ('Liebevoll', '#f43f5e', 11, 1, 0, 10, 0.5, '#ef4444', '#f43f5e', NULL),
  ('Selbstlos', '#06b6d4', 12, 1, 0, 10, 0.5, '#ef4444', '#06b6d4', NULL),
  ('Passiv', '#9ca3af', 13, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Zurückhaltend', '#6366f1', 14, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Begeistert', '#10b981', 15, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Traurig', '#ef4444', 16, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Optimistisch', '#10b981', 17, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Depressiv', '#6b7280', 18, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Energisch', '#84cc16', 19, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Nervös', '#f59e0b', 20, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Kreativ', '#8b5cf6', 21, 1, 0, 10, 0.5, '#ef4444', '#8b5cf6', NULL),
  ('Geduldig', '#10b981', 22, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Ungeduldig', '#f59e0b', 23, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Empathisch', '#06b6d4', 24, 1, 0, 10, 0.5, '#ef4444', '#06b6d4', NULL),
  ('Rücksichtslos', '#ef4444', 25, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Humorvoll', '#eab308', 26, 1, 0, 10, 0.5, '#ef4444', '#eab308', NULL),
  ('Ernst', '#6b7280', 27, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Gesellig', '#10b981', 28, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Einsam', '#6b7280', 29, 1, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Selbstsicher', '#10b981', 30, 1, 0, 10, 0.5, '#ef4444', '#10b981', NULL)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ==========================================
-- FERTIG!
-- ==========================================

-- ==========================================
-- FERTIG!
-- ==========================================

SELECT '✅ Datenbank-Struktur erfolgreich erstellt!' AS Status;
SELECT COUNT(*) AS 'Anzahl Tabellen' FROM information_schema.tables WHERE table_schema = 'wameli';

-- Zeige alle erstellten Tabellen
SHOW TABLES;

