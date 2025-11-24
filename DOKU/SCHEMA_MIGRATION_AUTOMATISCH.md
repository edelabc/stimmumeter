# 🔄 Automatische Schema-Migration - Dokumentation

## 📋 Übersicht

Das automatische Schema-Migrations-System erkennt und passt **automatisch** Datenbank-Schema-Änderungen an:

✅ **Neue Felder hinzufügen**  
✅ **Felder ändern** (Typ, Constraints, Default-Werte)  
⚠️ **Felder löschen** (optional, standardmäßig deaktiviert)  

**Alles vollautomatisch - keine manuelle Eingabe nötig!**

---

## 🎯 Wie funktioniert es?

### Automatische Schema-Erkennung

Das System vergleicht automatisch:

1. **Aktuelle Datenbank-Struktur** (aus MySQL)
2. **Gewünschte Struktur** (aus `database/create-complete-database.sql`)

**Erkannte Unterschiede werden automatisch angepasst!**

### Ablauf

```
1. API-Aufruf → api/db.php
2. Prüfe: Tabellen existieren?
   ├─ NEIN → Erstelle Tabellen ✅
   └─ JA → Weiter
3. Prüfe: Schema-Änderungen?
   ├─ Neue Felder → ALTER TABLE ADD COLUMN ✅
   ├─ Geänderte Felder → ALTER TABLE MODIFY COLUMN ✅
   └─ Gelöschte Felder → ALTER TABLE DROP COLUMN (optional) ⚠️
4. Backup vor Änderungen ✅
5. Schema-Migration durchführen ✅
```

---

## 📁 Dateien

### Core-Dateien

1. **`api/schema-migrator.php`**
   - SchemaMigrator-Klasse
   - Erkennt Schema-Änderungen
   - Führt ALTER TABLE Statements aus
   - Erstellt Backups vor Änderungen

2. **`api/auto-setup.php`** (erweitert)
   - Ruft Schema-Migrator auf
   - Integriert Schema-Migration in Tabellen-Erstellung

---

## 🔧 Technische Details

### SchemaMigrator Klasse

**Hauptmethoden:**

```php
class SchemaMigrator {
    // Migriert alle Tabellen
    public function migrateAllTables(): array
    
    // Setzt ob Spalten gelöscht werden dürfen
    public function setAllowDropColumns($allow): void
    
    // Erstellt Backup vor Migration
    public function createBackupBeforeMigration($tableName): bool
}
```

### Unterstützte Änderungen

**Automatisch erkannt und angepasst:**

✅ **Neue Spalten hinzufügen**
- Mit korrekter Position (AFTER, FIRST)
- Mit allen Constraints (NOT NULL, DEFAULT, etc.)

✅ **Spalten ändern**
- Datentyp ändern (z.B. VARCHAR(50) → VARCHAR(100))
- Constraints ändern (NULL → NOT NULL)
- Default-Werte ändern
- AUTO_INCREMENT hinzufügen/entfernen

⚠️ **Spalten löschen** (optional)
- Standardmäßig **DEAKTIVIERT** (Sicherheit)
- Kann aktiviert werden: `$migrator->setAllowDropColumns(true)`

---

## 🚀 Verwendung

### Automatisch (Empfohlen)

**Keine Aktion nötig!** Das System erkennt automatisch:

1. **Neue Felder** in `database/create-complete-database.sql`
2. **Geänderte Felder** (Typ, Constraints)
3. **Gelöschte Felder** (nur wenn aktiviert)

**Einfach SQL-Datei aktualisieren** - alles passiert automatisch!

### Beispiel: Neues Feld hinzufügen

**Vorher (`database/create-complete-database.sql`):**
```sql
CREATE TABLE IF NOT EXISTS `users_profile` (
  `id` CHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Nachher (neues Feld `phone` hinzugefügt):**
```sql
CREATE TABLE IF NOT EXISTS `users_profile` (
  `id` CHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,  -- NEUES FELD
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Ergebnis:**
- ✅ Feld `phone` wird automatisch hinzugefügt
- ✅ Backup wird erstellt
- ✅ Keine manuelle Aktion nötig!

### Beispiel: Feld ändern

**Vorher:**
```sql
`email` VARCHAR(255) NOT NULL,
```

**Nachher (Länge erhöht):**
```sql
`email` VARCHAR(500) NOT NULL,
```

**Ergebnis:**
- ✅ Feld `email` wird automatisch auf VARCHAR(500) geändert
- ✅ Backup wird erstellt
- ✅ Bestehende Daten bleiben erhalten!

---

## 🛡️ Sicherheit

### Backup vor Änderungen

**WICHTIG:** Vor jeder Schema-Änderung wird automatisch ein Backup erstellt!

**Backup-Speicherort:**
```
backups/
└── wameli_schema_backup_users_profile_2024-11-23_14-30-45.sql
```

### Spalten löschen (Standard: DEAKTIVIERT)

**Sicherheit:** Spalten werden **standardmäßig NICHT gelöscht**!

**Grund:** Verhindert versehentlichen Datenverlust.

**Aktivieren (nur wenn nötig):**
```php
$migrator = new SchemaMigrator($pdo);
$migrator->setAllowDropColumns(true);
```

---

## 📊 Was wird migriert?

### Automatisch erkannt

**Neue Spalten:**
- ✅ Werden automatisch hinzugefügt
- ✅ Mit korrekter Position (AFTER, FIRST)
- ✅ Mit allen Constraints

**Geänderte Spalten:**
- ✅ Datentyp-Änderungen
- ✅ Constraint-Änderungen (NULL/NOT NULL)
- ✅ Default-Wert-Änderungen
- ✅ AUTO_INCREMENT-Änderungen

**Gelöschte Spalten:**
- ⚠️ Nur wenn `setAllowDropColumns(true)` gesetzt ist
- ⚠️ Standardmäßig **DEAKTIVIERT**

---

## 🔍 Logging

Das System protokolliert alle Schema-Änderungen:

**PHP Error Log:**
```
🔄 Prüfe Schema-Änderungen...
✅ Neue Spalten hinzugefügt: users_profile.phone, users_profile.address
✅ Spalten geändert: users_profile.email
⚠️ Spalten gelöscht: users_profile.old_field
```

**Log-Datei:** PHP Error Log (meist `/Applications/XAMPP/xamppfiles/logs/php_error_log`)

---

## ⚙️ Konfiguration

### Spalten löschen aktivieren

**Standard:** Deaktiviert (Sicherheit)

**Aktivieren (in `api/auto-setup.php`):**
```php
$migrator = new SchemaMigrator($pdo);
$migrator->setAllowDropColumns(true); // VORSICHT: Löscht Spalten!
```

### SQL-Datei

**Standard:** `database/create-complete-database.sql`

**Anpassen:** In `api/schema-migrator.php`:
```php
$sqlFile = __DIR__ . '/../database/create-complete-database.sql';
```

---

## 📋 Checkliste

### Automatische Migration

- [x] ✅ Neue Felder werden automatisch hinzugefügt
- [x] ✅ Geänderte Felder werden automatisch angepasst
- [x] ✅ Backup wird vor Änderungen erstellt
- [x] ✅ Logging für alle Änderungen
- [x] ✅ Fehlerbehandlung eingebaut

### Sicherheit

- [x] ✅ Backup vor jeder Änderung
- [x] ✅ Spalten löschen standardmäßig deaktiviert
- [x] ✅ Fehlerbehandlung für fehlgeschlagene Migrationen

---

## 🆘 Troubleshooting

### Problem: "Spalte wird nicht hinzugefügt"

**Lösung:**
- Prüfen Sie PHP Error Log
- Prüfen Sie ob SQL-Datei korrekt ist
- Prüfen Sie Datenbank-Berechtigungen

### Problem: "Spalte wird nicht geändert"

**Lösung:**
- Prüfen Sie ob Definition in SQL-Datei korrekt ist
- Prüfen Sie PHP Error Log für Fehlermeldungen
- Manuelle Migration kann nötig sein (bei komplexen Änderungen)

### Problem: "Spalte wird nicht gelöscht"

**Lösung:**
- Standardmäßig deaktiviert (Sicherheit)
- Aktivieren: `$migrator->setAllowDropColumns(true)`
- **VORSICHT:** Kann Datenverlust verursachen!

---

## 📝 Beispiel-Ablauf

### Szenario 1: Neues Feld hinzufügen

```
1. SQL-Datei aktualisiert (neues Feld)
2. API-Aufruf erfolgt
3. Schema-Migration erkennt neues Feld
4. Backup erstellt ✅
5. ALTER TABLE ADD COLUMN ausgeführt ✅
6. ✅ Fertig!
```

### Szenario 2: Feld ändern

```
1. SQL-Datei aktualisiert (Feld-Typ geändert)
2. API-Aufruf erfolgt
3. Schema-Migration erkennt Änderung
4. Backup erstellt ✅
5. ALTER TABLE MODIFY COLUMN ausgeführt ✅
6. ✅ Fertig!
```

### Szenario 3: Feld löschen (aktiviert)

```
1. SQL-Datei aktualisiert (Feld entfernt)
2. API-Aufruf erfolgt
3. Schema-Migration erkennt fehlendes Feld
4. Backup erstellt ✅
5. ALTER TABLE DROP COLUMN ausgeführt ✅
6. ⚠️ Datenverlust möglich!
```

---

## 🎯 Vorteile

✅ **Vollautomatisch** - Keine manuelle Migration nötig  
✅ **Sicher** - Backup vor jeder Änderung  
✅ **Intelligent** - Erkennt nur echte Änderungen  
✅ **Robust** - Fehlerbehandlung eingebaut  
✅ **Logging** - Alle Änderungen werden protokolliert  

---

## 📚 Weitere Informationen

- **Auto-Setup:** `DOKU/AUTO_SETUP_DATENBANK.md`
- **Backup-System:** `DOKU/BACKUP_DATENBANK.md`
- **Datenbank-Setup:** `DOKU/DATENBANK_SETUP.md`

---

## ⚠️ Wichtige Hinweise

1. **Backup vor Änderungen:** Immer aktiviert
2. **Spalten löschen:** Standardmäßig deaktiviert (Sicherheit)
3. **Komplexe Migrationen:** Können manuelle Anpassung erfordern
4. **Datenverlust:** Möglich bei Feld-Löschung (nur wenn aktiviert)

---

**Das automatische Schema-Migrations-System ist aktiv!** 🔄

Die Datenbank-Struktur wird automatisch angepasst - Sie müssen sich keine Sorgen machen! 🎉


