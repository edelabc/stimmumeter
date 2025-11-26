# 🗄️ Datenbank-Setup - Komplette Anleitung

## 📋 Übersicht

Dieses Projekt verwendet **Supabase (PostgreSQL)** für die Produktion, aber Sie können auch **MySQL-Datenbanken** für Local und Online erstellen.

Die Datenbankstruktur wird aus den Supabase-Migrationen wiederhergestellt.

---

## 🚀 Schnellstart

### Schritt 1: Migrationen konvertieren

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
php scripts/convert-migrations-to-mysql.php
```

Dies erstellt MySQL-kompatible SQL-Dateien in `database/migrations/mysql/`.

---

### Schritt 2a: Lokale Datenbank erstellen

```bash
php scripts/setup-database-local.php
```

**Konfiguration:**
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Passwort: `` (leer)
- Datenbank: `stimmumeter`

---

### Schritt 2b: Produktions-Datenbank erstellen

```bash
php scripts/setup-database-production.php
```

**⚠️ WICHTIG:** Das Script fragt zur Bestätigung!

**Konfiguration:**
- Host: `localhost`
- Port: `3306`
- User: `TrastimoGmbHsql6`
- Passwort: `cmjVKrwdog`
- Datenbank: `wameli`

---

## 📁 Erstellte Dateien

### Konfigurationsdateien:
- ✅ `config.local.php` - Lokale Konfiguration (XAMPP)
- ✅ `config.production.php` - Produktions-Konfiguration

### Scripts:
- ✅ `scripts/convert-migrations-to-mysql.php` - Konvertiert PostgreSQL → MySQL
- ✅ `scripts/setup-database-local.php` - Erstellt lokale DB
- ✅ `scripts/setup-database-production.php` - Erstellt Produktions-DB

### Dokumentation:
- ✅ `DOKU/DATENBANK_SETUP.md` - Detaillierte Anleitung

---

## 🔧 Manuelle Einrichtung (Alternative)

Falls die Scripts nicht funktionieren, können Sie die Datenbanken manuell einrichten:

### 1. Lokale Datenbank (phpMyAdmin):

1. Öffnen Sie phpMyAdmin: http://localhost/phpmyadmin
2. Erstellen Sie eine neue Datenbank: `stimmumeter`
3. Wählen Sie die Datenbank aus
4. Gehen Sie zu "SQL"
5. Kopieren Sie den Inhalt aller Dateien aus `supabase/migrations/` (in chronologischer Reihenfolge)
6. Konvertieren Sie PostgreSQL-Syntax zu MySQL (siehe unten)
7. Führen Sie das SQL aus

### 2. Produktions-Datenbank:

1. Öffnen Sie phpMyAdmin oder verwenden Sie einen MySQL-Client
2. Verbinden Sie sich mit:
   - Host: `localhost`
   - User: `TrastimoGmbHsql6`
   - Passwort: `cmjVKrwdog`
3. Erstellen Sie eine neue Datenbank: `wameli`
4. Führen Sie die konvertierten Migrationen aus

---

## 🔄 PostgreSQL → MySQL Konvertierung

### Wichtige Unterschiede:

| PostgreSQL | MySQL |
|------------|-------|
| `UUID` | `CHAR(36)` |
| `gen_random_uuid()` | `UUID()` |
| `TIMESTAMPTZ` | `DATETIME` |
| `NOW()` | `CURRENT_TIMESTAMP` |
| `JSONB` | `JSON` |
| `NUMERIC(10,8)` | `DECIMAL(10,8)` |
| `INET` | `VARCHAR(45)` |
| `BOOLEAN` | `TINYINT(1)` |
| `true` | `1` |
| `false` | `0` |

### Entfernen:
- ❌ `DO $$ ... $$;` Blöcke
- ❌ `CREATE POLICY` (RLS)
- ❌ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- ❌ `USING GIST(...)` in Indexes
- ❌ `CREATE OR REPLACE FUNCTION` (PostgreSQL-Syntax)

---

## ✅ Was wird erstellt?

Die Migrationen erstellen **48+ Tabellen** mit:

- ✅ Benutzerverwaltung
- ✅ Stimmungserfassung (100+ Standard-Indikatoren)
- ✅ Admin & CMS-System
- ✅ Billing & Abonnements
- ✅ Payment Providers (Stripe)
- ✅ Agreements-System
- ✅ Mood Assessment System
- ✅ AI-Konfigurationen

---

## 🧪 Testen

Nach dem Setup testen Sie die Verbindung:

```php
<?php
require_once 'config.local.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS
    );
    echo "✅ Verbindung erfolgreich!\n";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 Tabellen: " . count($tables) . "\n";
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
}
?>
```

---

## 📝 Nächste Schritte

1. ✅ Datenbanken sind erstellt
2. ✅ Konfiguration ist angepasst
3. ⏭️ Frontend kann jetzt mit der Datenbank arbeiten
4. ⏭️ Standard-Daten werden automatisch importiert

---

**Die Datenbanken sind jetzt bereit!** 🎉




