-- ==========================================
-- Legal Pages Table für Production
-- ==========================================
-- 
-- Dieses Script erstellt die legal_pages Tabelle und fügt Standard-Einträge hinzu
-- 
-- Ausführung auf Production-Server:
-- mysql -u TrastimoGmbHsql6 -p wameli < create-legal-pages-production.sql
-- ODER in MySQL:
-- source /path/to/create-legal-pages-production.sql;
-- 
-- ==========================================

USE `wameli`;

-- ==========================================
-- 1. Legal Pages Table erstellen
-- ==========================================
CREATE TABLE IF NOT EXISTS `legal_pages` (
  `id` CHAR(36) PRIMARY KEY,
  `page_type` VARCHAR(50) UNIQUE NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_legal_pages_page_type` (`page_type`),
  INDEX `idx_legal_pages_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. Standard-Einträge einfügen
-- ==========================================

-- AI Terms (KI-Nutzungsbedingungen)
INSERT IGNORE INTO `legal_pages` (`id`, `page_type`, `title`, `content`, `is_active`) VALUES
('00000000-0000-0000-0000-000000000001', 'ai-terms', 'KI-Nutzungsbedingungen', 
'# KI-Nutzungsbedingungen

## Allgemeine Bestimmungen

Diese Nutzungsbedingungen regeln die Verwendung von KI-Diensten (Künstliche Intelligenz) in dieser Anwendung.

### Verantwortlichkeit

Die Nutzung von KI-Diensten erfolgt auf eigene Verantwortung. Die Anwendung übernimmt keine Haftung für:

- Die Richtigkeit oder Vollständigkeit von KI-generierten Inhalten
- Entscheidungen, die auf Basis von KI-Analysen getroffen werden
- Schäden, die durch die Nutzung von KI-Diensten entstehen

### Datenschutz

Bei der Nutzung von KI-Diensten werden Daten an externe Anbieter übermittelt. Bitte beachten Sie:

- Ihre Daten werden gemäß unserer Datenschutzerklärung behandelt
- Externe KI-Anbieter haben Zugriff auf die von Ihnen übermittelten Daten
- Wir haben keinen Einfluss auf die Datenschutzpraktiken externer Anbieter

### Nutzungsbeschränkungen

Die Nutzung von KI-Diensten ist untersagt für:

- Illegale oder rechtswidrige Zwecke
- Die Verbreitung von Fehlinformationen
- Angriffe auf Dritte
- Verletzung von Urheberrechten

### Haftungsausschluss

Die Anwendung stellt KI-Dienste "wie besehen" zur Verfügung. Es wird keine Garantie für:

- Verfügbarkeit oder Zuverlässigkeit der Dienste
- Genauigkeit der Ergebnisse
- Eignung für bestimmte Zwecke

### Änderungen

Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden auf dieser Seite veröffentlicht.

**Stand:** November 2025
', 1);

-- Impressum
INSERT IGNORE INTO `legal_pages` (`id`, `page_type`, `title`, `content`, `is_active`) VALUES
('00000000-0000-0000-0000-000000000002', 'impressum', 'Impressum', 
'# Impressum

## Angaben gemäß § 5 TMG

[Ihre Firmierung]  
[Ihre Straße und Hausnummer]  
[PLZ Ort]

## Kontakt

Telefon: [Ihre Telefonnummer]  
E-Mail: [Ihre E-Mail-Adresse]  
Website: [Ihre Website]

## Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV

[Name des Verantwortlichen]  
[Adresse]

**Stand:** November 2025
', 1);

-- Datenschutz
INSERT IGNORE INTO `legal_pages` (`id`, `page_type`, `title`, `content`, `is_active`) VALUES
('00000000-0000-0000-0000-000000000003', 'datenschutz', 'Datenschutzerklärung', 
'# Datenschutzerklärung

## 1. Datenschutz auf einen Blick

### Allgemeine Hinweise

Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.

### Datenerfassung auf dieser Website

**Wer ist verantwortlich für die Datenerfassung auf dieser Website?**  
Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.

**Wie erfassen wir Ihre Daten?**  
Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.

**Wofür nutzen wir Ihre Daten?**  
Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.

**Welche Rechte haben Sie bezüglich Ihrer Daten?**  
Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.

**Stand:** November 2025
', 1);

-- Cookies
INSERT IGNORE INTO `legal_pages` (`id`, `page_type`, `title`, `content`, `is_active`) VALUES
('00000000-0000-0000-0000-000000000004', 'cookies', 'Cookie-Richtlinie', 
'# Cookie-Richtlinie

## Was sind Cookies?

Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen.

## Wie verwenden wir Cookies?

Wir verwenden Cookies, um:

- Die Funktionalität der Website zu gewährleisten
- Ihre Präferenzen zu speichern
- Die Nutzung der Website zu analysieren

## Cookie-Einstellungen

Sie können Ihre Cookie-Einstellungen jederzeit in den Einstellungen ändern.

**Stand:** November 2025
', 1);

-- ==========================================
-- 3. Verifizierung
-- ==========================================
SELECT 'Legal Pages erfolgreich erstellt!' AS Status;
SELECT COUNT(*) AS 'legal_pages_count' FROM `legal_pages`;
SELECT `page_type`, `title`, `is_active` FROM `legal_pages` ORDER BY `page_type`;



