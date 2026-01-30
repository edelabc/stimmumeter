-- ==========================================
-- Berechtigungen für Production-Datenbank
-- ==========================================
-- 
-- WICHTIG: Dieses Script muss als ROOT-Admin ausgeführt werden!
-- 
-- Ausführung:
-- 1. Auf dem Production-Server einloggen
-- 2. MySQL als ROOT-Benutzer öffnen:
--    mysql -u root -p
-- 3. Dieses Script ausführen:
--    source /path/to/grant-permissions-production.sql
--    ODER: Inhalt kopieren und direkt ausführen
-- 
-- ==========================================

-- Prüfe ob Datenbank existiert, falls nicht erstellen
CREATE DATABASE IF NOT EXISTS `wameli` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Prüfe ob Benutzer existiert, falls nicht erstellen
CREATE USER IF NOT EXISTS 'TrastimoGmbHsql6'@'localhost' IDENTIFIED BY 'cmjVKrwdog';

-- Alle Berechtigungen für die Datenbank 'wameli' erteilen
GRANT ALL PRIVILEGES ON `wameli`.* TO 'TrastimoGmbHsql6'@'localhost';

-- Berechtigungen aktivieren
FLUSH PRIVILEGES;

-- Prüfe Berechtigungen (optional - zur Verifizierung)
SHOW GRANTS FOR 'TrastimoGmbHsql6'@'localhost';

-- Status anzeigen
SELECT 'Berechtigungen erfolgreich erteilt!' AS Status;




