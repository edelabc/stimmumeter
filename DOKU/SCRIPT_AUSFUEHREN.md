# 🚀 Scripts ausführen - Anleitung

## 📋 Übersicht

Es gibt **zwei Möglichkeiten**, das automatische Datenbank-Setup auszuführen:

1. **Automatisch** (Empfohlen) - Keine Aktion nötig!
2. **Manuell** - Über Terminal/Command Line

---

## ✅ Option 1: Automatisch (Empfohlen)

### Wie funktioniert es?

**Keine Aktion nötig!** Das System läuft automatisch:

1. **Bei jedem API-Aufruf** wird geprüft:
   - Existiert die Datenbank?
   - Fehlen Tabellen?
   - Gibt es Schema-Änderungen?

2. **Automatisch werden erstellt:**
   - Datenbank (falls nicht vorhanden)
   - Fehlende Tabellen
   - Schema-Anpassungen (neue/geänderte Felder)
   - Backup (vor Änderungen)

### Was Sie tun müssen:

**NICHTS!** 🎉

Einfach die Anwendung verwenden - alles passiert automatisch im Hintergrund!

**Beispiel:**
- Öffnen Sie: `http://localhost:5173`
- Die App macht automatisch einen API-Aufruf
- Das System prüft und erstellt automatisch alles was fehlt

---

## 🔧 Option 2: Manuell (Terminal)

### Script: `scripts/auto-setup-database.php`

**Verwendung:**

```bash
# Lokale Datenbank
php scripts/auto-setup-database.php local

# Produktions-Datenbank
php scripts/auto-setup-database.php production
```

### Schritt-für-Schritt Anleitung

#### 1. Terminal öffnen

**macOS/Linux:**
- Öffnen Sie Terminal
- Navigieren Sie zum Projekt-Verzeichnis:
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
```

**Windows:**
- Öffnen Sie Command Prompt oder PowerShell
- Navigieren Sie zum Projekt-Verzeichnis:
```cmd
cd C:\xampp\htdocs\stimmumeter
```

#### 2. Script ausführen

**Lokale Datenbank:**
```bash
php scripts/auto-setup-database.php local
```

**Produktions-Datenbank:**
```bash
php scripts/auto-setup-database.php production
```

#### 3. Ausgabe verstehen

Das Script zeigt Ihnen:

```
🚀 Automatisches Datenbank-Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Umgebung: LOKAL
Datenbank: wameli
Host: 127.0.0.1:3306

✅ Verbindung zu MySQL erfolgreich

📋 Datenbank 'wameli' existiert bereits

💾 Erstelle Backup...
✅ Backup erstellt

📦 Erstelle fehlende Tabellen...
✅ Erstellte Tabellen: session_yra, mood_assessments

📋 Füge Standard-Daten ein...
✅ Standard-Daten eingefügt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Automatisches Setup abgeschlossen!

📊 Tabellen in Datenbank: 15
```

---

## 🔍 Weitere Scripts

### Backup erstellen

```bash
# Lokales Backup
php scripts/backup-database.php local

# Produktions-Backup
php scripts/backup-database.php production
```

### Alle Tabellen erstellen

```bash
# Lokale Datenbank
php scripts/create-all-tables.php local

# Produktions-Datenbank
php scripts/create-all-tables.php production
```

---

## ⚙️ Voraussetzungen

### PHP muss installiert sein

**Prüfen:**
```bash
php --version
```

**Sollte zeigen:**
```
PHP 8.x.x (cli) ...
```

### MySQL/XAMPP muss laufen

**Prüfen:**
- XAMPP Control Panel → MySQL muss "Running" sein
- Oder: `http://localhost/phpmyadmin` muss erreichbar sein

### Berechtigungen

**Scripts müssen ausführbar sein:**
```bash
chmod +x scripts/*.php
```

---

## 🆘 Troubleshooting

### Problem: "php: command not found"

**Lösung:**
- PHP ist nicht im PATH
- Verwenden Sie vollständigen Pfad:
```bash
/Applications/XAMPP/xamppfiles/bin/php scripts/auto-setup-database.php local
```

### Problem: "Database connection failed"

**Lösung:**
1. Prüfen Sie ob MySQL läuft (XAMPP Control Panel)
2. Prüfen Sie `config.local.php` oder `config.production.php`
3. Prüfen Sie Benutzername und Passwort

### Problem: "Permission denied"

**Lösung:**
```bash
chmod +x scripts/*.php
```

### Problem: "Script läuft nicht"

**Lösung:**
- Prüfen Sie ob Sie im richtigen Verzeichnis sind
- Prüfen Sie ob die Datei existiert:
```bash
ls -la scripts/auto-setup-database.php
```

---

## 📝 Beispiel-Ausführung

### Komplettes Beispiel (macOS):

```bash
# 1. Terminal öffnen
# 2. Zum Projekt navigieren
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter

# 3. Script ausführen
php scripts/auto-setup-database.php local

# 4. Ausgabe:
# 🚀 Automatisches Datenbank-Setup
# ...
# ✅ Automatisches Setup abgeschlossen!
```

### Komplettes Beispiel (Windows):

```cmd
REM 1. Command Prompt öffnen
REM 2. Zum Projekt navigieren
cd C:\xampp\htdocs\stimmumeter

REM 3. Script ausführen
php scripts\auto-setup-database.php local

REM 4. Ausgabe:
REM 🚀 Automatisches Datenbank-Setup
REM ...
REM ✅ Automatisches Setup abgeschlossen!
```

---

## 🎯 Empfehlung

**Für normale Nutzung:**
- ✅ **Automatisch** verwenden (Option 1)
- Keine manuelle Aktion nötig
- System erstellt alles automatisch

**Für manuelle Kontrolle:**
- 🔧 **Manuell** verwenden (Option 2)
- Script ausführen für vollständige Kontrolle
- Nützlich für Debugging oder Initial-Setup

---

## 📚 Weitere Informationen

- **Auto-Setup:** `DOKU/AUTO_SETUP_DATENBANK.md`
- **Schema-Migration:** `DOKU/SCHEMA_MIGRATION_AUTOMATISCH.md`
- **Backup-System:** `DOKU/BACKUP_DATENBANK.md`

---

**Das System funktioniert automatisch - Sie müssen nichts tun!** 🎉

Falls Sie manuell eingreifen möchten, verwenden Sie die Scripts im `scripts/` Ordner.




