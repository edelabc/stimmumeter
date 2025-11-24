# 🤖 Automatisches Datenbank-Setup - Dokumentation

## 📋 Übersicht

Das automatische Datenbank-Setup-System erstellt automatisch:
1. ✅ **Backup** der vorhandenen Datenbank (falls vorhanden)
2. ✅ **Datenbank** (falls nicht vorhanden)
3. ✅ **Fehlende Tabellen** automatisch
4. ✅ **Standard-Daten** werden eingefügt

**Alles vollautomatisch - keine manuelle Eingabe nötig!**

---

## 🎯 Wie funktioniert es?

### Automatische Ausführung

Das System wird automatisch ausgeführt, wenn:

1. **API-Aufruf erfolgt** (`api/session_manager.php` oder andere API-Endpunkte)
2. **Fehlende Tabellen erkannt werden**
3. **Datenbank nicht existiert**

### Ablauf

```
1. API-Aufruf → api/db.php
2. Prüfe: Datenbank existiert?
   ├─ NEIN → Erstelle Datenbank
   └─ JA → Weiter
3. Prüfe: Kritische Tabellen fehlen?
   ├─ JA → Erstelle Backup (falls Tabellen vorhanden)
   │   → Erstelle fehlende Tabellen
   │   → Füge Standard-Daten ein
   └─ NEIN → Weiter
4. Normale API-Verarbeitung
```

---

## 📁 Dateien

### Core-Dateien

1. **`api/db.php`**
   - Haupt-Datenbankverbindung
   - Ruft Auto-Setup auf, wenn Tabellen fehlen
   - Erstellt Datenbank automatisch, falls nicht vorhanden

2. **`api/auto-setup.php`**
   - AutoSetup-Klasse
   - Erstellt Backups
   - Erstellt fehlende Tabellen
   - Fügt Standard-Daten ein

### Scripts

3. **`scripts/auto-setup-database.php`**
   - Manuelles Setup-Script
   - Kann von Terminal ausgeführt werden
   - Erstellt Backup + vollständige Datenbank-Struktur

4. **`scripts/backup-database.php`**
   - Backup-Script
   - Wird automatisch von Auto-Setup aufgerufen

---

## 🔧 Technische Details

### Auto-Setup Klasse

**Hauptmethoden:**

```php
class AutoSetup {
    // Erstellt Backup (falls Datenbank nicht leer)
    public function createBackupIfNeeded(): bool
    
    // Erstellt alle fehlenden Tabellen
    public function createMissingTables(): array
    
    // Fügt Standard-Daten ein
    public function insertDefaultData(): void
}
```

### Tabellen-Erkennung

Das System prüft automatisch auf fehlende Tabellen:

**Kritische Tabellen (werden sofort erstellt):**
- `session_yra` - Session-Verwaltung
- `mood_assessments` - Stimmungseinschätzungen

**Weitere Tabellen:**
- Werden aus `database/create-complete-database.sql` geladen
- Werden automatisch erstellt, wenn sie fehlen

### Backup-Erstellung

**Automatisch erstellt, wenn:**
- Datenbank existiert
- Tabellen vorhanden sind
- Fehlende Tabellen erkannt werden

**Backup-Speicherort:**
```
backups/
└── wameli_auto_backup_2024-11-23_14-30-45.sql
```

---

## 🚀 Verwendung

### Automatisch (Empfohlen)

**Keine Aktion nötig!** Das System erstellt automatisch:
- Datenbank (falls nicht vorhanden)
- Fehlende Tabellen
- Backup (vor Tabellen-Erstellung)

**Einfach die App verwenden** - alles passiert automatisch im Hintergrund!

### Manuell (Optional)

**Vollständiges Setup mit Backup:**

```bash
php scripts/auto-setup-database.php local
```

**Nur Backup:**

```bash
php scripts/backup-database.php local
```

---

## 📊 Was wird erstellt?

### Automatisch erstellte Tabellen

**Kritische Tabellen (sofort):**
- ✅ `session_yra`
- ✅ `mood_assessments`
- ✅ `yra_rewards_config`
- ✅ `bot_protection_logs`

**Weitere Tabellen (aus SQL-Datei):**
- Alle Tabellen aus `database/create-complete-database.sql`
- Werden automatisch erstellt, wenn sie fehlen

### Standard-Daten

**Automatisch eingefügt:**
- ✅ YRA Rewards Config (mood_assessment, streak_bonus_3, etc.)
- ✅ Weitere Standard-Daten (falls in SQL definiert)

---

## 🔍 Logging

Das System protokolliert alle Aktionen:

**PHP Error Log:**
```
✅ Datenbank 'wameli' wurde automatisch erstellt
⚠️ Fehlende Tabellen erkannt: session_yra, mood_assessments
✅ Auto-Backup erstellt: /path/to/backup.sql
✅ Automatisch erstellte Tabellen: session_yra, mood_assessments
```

**Log-Datei:** PHP Error Log (meist `/Applications/XAMPP/xamppfiles/logs/php_error_log`)

---

## ⚙️ Konfiguration

### Umgebungsvariablen

Das System verwendet die Konfiguration aus:
- **Lokal:** `config.local.php`
- **Produktion:** `config.production.php`

**Wichtige Einstellungen:**
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'wameli');
```

### Backup-Verzeichnis

**Standard:** `backups/` (im Projekt-Root)

**Anpassen:** In `api/auto-setup.php`:
```php
$this->backupDir = __DIR__ . '/../backups';
```

---

## 🛡️ Sicherheit

### Backup vor Änderungen

**WICHTIG:** Vor jeder Tabellen-Erstellung wird automatisch ein Backup erstellt!

**Ausnahmen:**
- Datenbank ist leer (keine Tabellen vorhanden)
- Backup-Erstellung schlägt fehl (nicht kritisch)

### Fehlerbehandlung

- ✅ Fehler beim Backup → Setup wird trotzdem fortgesetzt
- ✅ Fehler beim Tabellen-Erstellen → Nur diese Tabelle wird übersprungen
- ✅ Datenbank-Verbindungsfehler → API gibt Fehler zurück

---

## 📋 Checkliste

### Automatisches Setup

- [x] ✅ Datenbank wird automatisch erstellt (falls nicht vorhanden)
- [x] ✅ Backup wird automatisch erstellt (vor Tabellen-Erstellung)
- [x] ✅ Fehlende Tabellen werden automatisch erstellt
- [x] ✅ Standard-Daten werden automatisch eingefügt
- [x] ✅ Logging für alle Aktionen

### Manuelle Kontrolle

- [ ] ✅ Backup-Verzeichnis vorhanden (`backups/`)
- [ ] ✅ Backups werden erstellt
- [ ] ✅ Tabellen werden korrekt erstellt
- [ ] ✅ Standard-Daten sind vorhanden

---

## 🆘 Troubleshooting

### Problem: "Backup wird nicht erstellt"

**Lösung:**
- Prüfen Sie PHP Error Log
- Prüfen Sie Berechtigungen für `backups/` Verzeichnis
- Prüfen Sie ob `mysqldump` verfügbar ist

### Problem: "Tabellen werden nicht erstellt"

**Lösung:**
- Prüfen Sie PHP Error Log
- Prüfen Sie Datenbank-Berechtigungen
- Prüfen Sie ob SQL-Datei existiert: `database/create-complete-database.sql`

### Problem: "Mehrfache Ausführung"

**Lösung:**
- Das System prüft vorher, ob Tabellen existieren
- Verwendet `CREATE TABLE IF NOT EXISTS`
- Kann mehrfach ausgeführt werden ohne Probleme

---

## 📝 Beispiel-Ablauf

### Szenario 1: Neue Installation

```
1. API-Aufruf erfolgt
2. Datenbank existiert nicht → Erstellt
3. Tabellen fehlen → Erstellt alle Tabellen
4. Standard-Daten → Eingefügt
5. ✅ Fertig!
```

### Szenario 2: Bestehende Installation

```
1. API-Aufruf erfolgt
2. Datenbank existiert → OK
3. Tabellen fehlen → Backup erstellt → Tabellen erstellt
4. Standard-Daten → Eingefügt
5. ✅ Fertig!
```

### Szenario 3: Vollständige Datenbank

```
1. API-Aufruf erfolgt
2. Datenbank existiert → OK
3. Alle Tabellen vorhanden → Keine Aktion
4. ✅ Fertig!
```

---

## 🎯 Vorteile

✅ **Vollautomatisch** - Keine manuelle Eingabe nötig  
✅ **Sicher** - Backup vor jeder Änderung  
✅ **Intelligent** - Erstellt nur was fehlt  
✅ **Robust** - Fehlerbehandlung eingebaut  
✅ **Logging** - Alle Aktionen werden protokolliert  

---

## 📚 Weitere Informationen

- **Backup-Anleitung:** `DOKU/BACKUP_DATENBANK.md`
- **Datenbank-Setup:** `DOKU/DATENBANK_SETUP.md`
- **Migrationen:** `DOKU/MIGRATION_AUSFUEHREN.md`

---

**Das automatische Setup-System ist aktiv!** 🤖

Die Datenbank wird automatisch verwaltet - Sie müssen sich keine Sorgen machen! 🎉


