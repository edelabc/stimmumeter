# 🔐 Datenbank-Berechtigungen auf Production-Server einrichten

## Problem

Der Fehler `Access denied for user 'TrastimoGmbHsql6'@'localhost' to database 'wameli'` bedeutet, dass der Datenbankbenutzer keine Berechtigung hat, auf die Datenbank zuzugreifen.

## Lösung

### Schritt 1: Auf dem Production-Server einloggen

SSH-Verbindung zum Server herstellen:
```bash
ssh user@wameli.com
```

### Schritt 2: MySQL als ROOT-Benutzer öffnen

```bash
mysql -u root -p
```
(Passwort eingeben wenn gefordert)

### Schritt 3: SQL-Script ausführen

**Option A: Script direkt ausführen**
```sql
-- Datenbank erstellen falls nicht vorhanden
CREATE DATABASE IF NOT EXISTS `wameli` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Benutzer erstellen falls nicht vorhanden
CREATE USER IF NOT EXISTS 'TrastimoGmbHsql6'@'localhost' IDENTIFIED BY 'cmjVKrwdog';

-- Alle Berechtigungen erteilen
GRANT ALL PRIVILEGES ON `wameli`.* TO 'TrastimoGmbHsql6'@'localhost';

-- Berechtigungen aktivieren
FLUSH PRIVILEGES;

-- Verifizierung
SHOW GRANTS FOR 'TrastimoGmbHsql6'@'localhost';
```

**Option B: SQL-Datei verwenden**

1. Die Datei `database/grant-permissions-production.sql` auf den Server hochladen
2. In MySQL ausführen:
```sql
source /path/to/grant-permissions-production.sql;
```

### Schritt 4: Verifizierung

Prüfen ob die Berechtigungen korrekt gesetzt wurden:
```sql
SHOW GRANTS FOR 'TrastimoGmbHsql6'@'localhost';
```

Die Ausgabe sollte etwa so aussehen:
```
GRANT USAGE ON *.* TO 'TrastimoGmbHsql6'@'localhost'
GRANT ALL PRIVILEGES ON `wameli`.* TO 'TrastimoGmbHsql6'@'localhost'
```

### Schritt 5: Verbindung testen

Als der Anwendungsbenutzer testen:
```bash
mysql -u TrastimoGmbHsql6 -p wameli
```

Passwort eingeben: `cmjVKrwdog`

Falls die Verbindung erfolgreich ist, sollte die MySQL-Prompt erscheinen.

## Alternative: Über phpMyAdmin

Falls Sie Zugriff auf phpMyAdmin haben:

1. **Benutzer erstellen/bearbeiten:**
   - Gehen Sie zu "Benutzerkonten" → "Benutzer hinzufügen"
   - Benutzername: `TrastimoGmbHsql6`
   - Hostname: `localhost`
   - Passwort: `cmjVKrwdog`

2. **Berechtigungen setzen:**
   - Wählen Sie den Benutzer aus
   - Klicken Sie auf "Berechtigungen"
   - Wählen Sie die Datenbank `wameli` aus
   - Setzen Sie alle Berechtigungen (oder wählen Sie "Alle Berechtigungen")
   - Klicken Sie auf "Gehen"

## Troubleshooting

### Fehler: "Access denied for user 'root'@'localhost'"

→ Sie müssen als ROOT-Admin eingeloggt sein oder einen anderen Admin-Benutzer verwenden.

### Fehler: "Database 'wameli' does not exist"

→ Die Datenbank muss zuerst erstellt werden:
```sql
CREATE DATABASE `wameli` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Fehler: "User already exists"

→ Das ist OK, der Benutzer existiert bereits. Fahren Sie mit `GRANT` fort.

## Nach der Einrichtung

Nachdem die Berechtigungen gesetzt wurden, sollten die API-Endpunkte wieder funktionieren:
- ✅ `/api/agreements.php`
- ✅ `/api/menu-items.php`
- ✅ `/api/site-settings.php`
- ✅ `/api/session_manager.php`

## Sicherheitshinweis

⚠️ **WICHTIG:** Die Datei `config.production.php` enthält sensible Datenbankzugangsdaten. 
Stellen Sie sicher, dass diese Datei nicht öffentlich zugänglich ist:
- Dateirechte: `chmod 640 config.production.php`
- Nicht in Git committen (sollte in `.gitignore` sein)



