# 🗄️ Datenbank-Setup - Local & Online

## Übersicht

Dieses Projekt verwendet **Supabase (PostgreSQL)** für die Produktion, aber Sie können auch **MySQL-Datenbanken** für Local und Online erstellen.

---

## 📋 Voraussetzungen

### Local (XAMPP):
- ✅ XAMPP installiert und MySQL läuft
- ✅ Port 3306 verfügbar
- ✅ Standard-Benutzer: `root` (Passwort meist leer)

### Online (Produktion):
- ✅ MySQL-Server verfügbar
- ✅ Zugangsdaten:
  - Host: `localhost`
  - Datenbank: `wameli`
  - Benutzer: `TrastimoGmbHsql6`
  - Passwort: `cmjVKrwdog`
  - Port: `3306`

---

## 🚀 Schnellstart

### Schritt 1: Migrationen konvertieren

Die Supabase-Migrationen (PostgreSQL) müssen zu MySQL konvertiert werden:

```bash
php scripts/convert-migrations-to-mysql.php
```

Dies erstellt MySQL-kompatible SQL-Dateien in `database/migrations/mysql/`.

---

### Schritt 2a: Lokale Datenbank erstellen

```bash
php scripts/setup-database-local.php
```

**Konfiguration (config.local.php):**
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

**⚠️ WICHTIG:** Das Script fragt zur Bestätigung, da es die Produktions-DB betrifft!

**Konfiguration (config.production.php):**
- Host: `localhost`
- Port: `3306`
- User: `TrastimoGmbHsql6`
- Passwort: `cmjVKrwdog`
- Datenbank: `wameli`

---

## 📁 Dateistruktur

```
stimmumeter/
├── config.local.php              # Lokale Konfiguration
├── config.production.php         # Produktions-Konfiguration
├── scripts/
│   ├── convert-migrations-to-mysql.php  # Konvertiert PostgreSQL → MySQL
│   ├── setup-database-local.php         # Erstellt lokale DB
│   └── setup-database-production.php    # Erstellt Produktions-DB
└── database/
    └── migrations/
        └── mysql/                # MySQL-konvertierte Migrationen
```

---

## ⚙️ Konfiguration anpassen

### Lokale Konfiguration (`config.local.php`):

```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'stimmumeter');
```

### Produktions-Konfiguration (`config.production.php`):

```php
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_USER', 'TrastimoGmbHsql6');
define('DB_PASS', 'cmjVKrwdog');
define('DB_NAME', 'wameli');
```

---

## 🔄 Was wird erstellt?

Die Migrationen erstellen folgende Tabellen:

### Core-Tabellen:
- ✅ `users_profile` - Benutzerprofile
- ✅ `pseudonyms` - Pseudonyme für Stimmungserfassung
- ✅ `mood_indicators` - Stimmungsindikatoren (100+ Standard-Indikatoren)
- ✅ `mood_entries` - Stimmungseinträge
- ✅ `mood_indicator_values` - Werte für Indikatoren
- ✅ `indicator_categories` - Kategorien für Indikatoren

### Admin & CMS:
- ✅ `admin_users` - Admin-Benutzer
- ✅ `admin_menu_items` - Menü-Items
- ✅ `site_settings` - Website-Einstellungen

### Billing-System:
- ✅ `currencies` - Währungen (EUR, USD, YRA)
- ✅ `exchange_rates` - Wechselkurse
- ✅ `pricing_plans` - Preispläne
- ✅ `user_subscriptions` - Benutzer-Abonnements
- ✅ `invoices` - Rechnungen
- ✅ `payments` - Zahlungen

### Agreements-System:
- ✅ `t_vereinbarungstitel` - Vereinbarungstitel
- ✅ `t_vereinbarungen` - Vereinbarungen
- ✅ `t_vereinbarungs_logs` - Logs
- ✅ `t_platzhalter_definitionen` - Platzhalter

### Mood Assessment System:
- ✅ `mood_assessments` - Stimmungseinschätzungen
- ✅ `session_yra` - Session-basierte YRA-Balance
- ✅ `yra_rewards_config` - YRA-Belohnungskonfiguration
- ✅ `bot_protection_logs` - Bot-Schutz-Logs

### Payment Providers:
- ✅ `payment_providers` - Zahlungsanbieter
- ✅ `payment_provider_webhooks` - Webhooks

### AI-Konfiguration:
- ✅ `ai_configurations` - AI-Konfigurationen

---

## ⚠️ Bekannte Einschränkungen

### PostgreSQL → MySQL Konvertierung:

1. **RLS (Row Level Security):**
   - MySQL hat kein RLS
   - Policies werden entfernt
   - Zugriffskontrolle muss auf Anwendungsebene implementiert werden

2. **Functions & Triggers:**
   - PostgreSQL-Functions werden entfernt
   - Müssen manuell in MySQL-Syntax konvertiert werden

3. **UUID:**
   - PostgreSQL: `UUID` mit `gen_random_uuid()`
   - MySQL: `CHAR(36)` mit `UUID()`

4. **JSONB:**
   - PostgreSQL: `JSONB` (binär)
   - MySQL: `JSON` (textbasiert, aber funktional ähnlich)

5. **TIMESTAMPTZ:**
   - PostgreSQL: `TIMESTAMPTZ` (mit Zeitzone)
   - MySQL: `DATETIME` (ohne Zeitzone, Zeitzone wird in App gehandhabt)

---

## 🧪 Testen

Nach dem Setup können Sie die Datenbankverbindung testen:

```php
<?php
require_once 'config.local.php'; // oder config.production.php

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    echo "✅ Datenbankverbindung erfolgreich!\n";
    
    // Prüfe Tabellen
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 Tabellen: " . count($tables) . "\n";
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
}
?>
```

---

## 🔧 Troubleshooting

### Fehler: "Access denied"
- Prüfen Sie Benutzername und Passwort
- Prüfen Sie, ob der Benutzer die Berechtigung hat, Datenbanken zu erstellen

### Fehler: "Table already exists"
- Normal, wenn Migrationen mehrfach ausgeführt werden
- Script ignoriert diese Fehler automatisch

### Fehler: "Unknown column type"
- Einige PostgreSQL-Datentypen wurden möglicherweise nicht korrekt konvertiert
- Prüfen Sie die konvertierte SQL-Datei in `database/migrations/mysql/`

### Fehler: "Syntax error"
- PostgreSQL-spezifische Syntax wurde möglicherweise nicht entfernt
- Prüfen Sie die konvertierte SQL-Datei und passen Sie sie manuell an

---

## 📝 Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Datenbankstruktur ist erstellt
2. ✅ Standard-Daten sind importiert (100+ Mood Indicators, etc.)
3. ✅ Konfiguration ist angepasst
4. ⏭️ Frontend kann jetzt mit der Datenbank arbeiten

---

**Die Datenbanken sind jetzt bereit für Local und Online!** 🎉


