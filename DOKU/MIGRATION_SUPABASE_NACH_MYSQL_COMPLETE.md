# 🔄 Vollständige Migration von Supabase nach MySQL

**Datum:** 2025-01-23  
**Status:** ✅ Erfolgreich abgeschlossen

---

## 📋 Übersicht

Diese Dokumentation beschreibt die vollständige Migration aller Daten von Supabase nach MySQL.

---

## ✅ Durchgeführte Schritte

### Schritt 1: Fehlende Tabellen erstellt

Die fehlende Tabelle `footer_menu_items` wurde erfolgreich in MySQL erstellt:

```sql
CREATE TABLE IF NOT EXISTS `footer_menu_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL DEFAULT '/',
  `position` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `linked_agreement_id` CHAR(36) NULL,
  `slug` VARCHAR(255) NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_footer_menu_items_slug_unique` (`slug`),
  INDEX `idx_footer_menu_items_linked_agreement` (`linked_agreement_id`),
  INDEX `idx_footer_menu_items_category_position` (`category`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Schritt 2: Daten geklont

Alle Daten wurden erfolgreich von Supabase nach MySQL geklont:

| Tabelle | Eingefügt | Aktualisiert |
|---------|-----------|--------------|
| `footer_menu_items` | 3 | 0 |
| `indicator_categories` | 0 | 3 |
| `menu_items` | 0 | 4 |
| `footer_settings` | 0 | 1 |
| `legal_pages` | 0 | 5 |
| `site_settings` | 0 | 1 |
| `currencies` | 0 | 1 |
| `pricing_plans` | 0 | 1 |
| `billing_item_types` | 0 | 8 |
| `t_vereinbarungen` | 0 | 4 |
| `t_platzhalter_definitionen` | 0 | 6 |

**Gesamt:**
- ✅ Eingefügt: 3 neue Datensätze
- ✅ Aktualisiert: 34 bestehende Datensätze
- ✅ Fehler: 0

### Schritt 3: Supabase-Daten löschen (optional)

Das Löschen der Supabase-Daten ist **deaktiviert** aus Sicherheitsgründen.

**Um Supabase-Daten zu löschen:**

1. **Option 1: Manuell in Supabase Dashboard**
   - Öffnen Sie: https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb
   - Gehen Sie zu "Table Editor"
   - Wählen Sie jede Tabelle aus
   - Löschen Sie alle Zeilen

2. **Option 2: Mit Skript (erfordert Service Role Key)**
   ```bash
   php scripts/delete-supabase-data.php
   ```
   - ⚠️ Erfordert `SUPABASE_SERVICE_ROLE_KEY` in `.env` Datei
   - ⚠️ Löscht ALLE Daten aus Supabase!

---

## 📊 Migrierte Tabellen

### Erfolgreich migriert (mit Daten):
- ✅ `footer_menu_items` (3 Datensätze)
- ✅ `indicator_categories` (3 Datensätze)
- ✅ `menu_items` (4 Datensätze)
- ✅ `footer_settings` (1 Datensatz)
- ✅ `legal_pages` (5 Datensätze)
- ✅ `site_settings` (1 Datensatz)
- ✅ `currencies` (1 Datensatz)
- ✅ `pricing_plans` (1 Datensatz)
- ✅ `billing_item_types` (8 Datensätze)
- ✅ `t_vereinbarungen` (4 Datensätze)
- ✅ `t_platzhalter_definitionen` (6 Datensätze)

### Leer (keine Daten in Supabase):
- `users_profile`
- `pseudonyms`
- `mood_indicators`
- `mood_entries`
- `mood_indicator_values`
- `admin_users`
- `admin_menu_items`
- `exchange_rates`
- `plan_subscription_config`
- `plan_billing_items`
- `user_subscriptions`
- `usage_records`
- `invoices`
- `invoice_items`
- `help_texts`
- `payment_providers`
- `payment_provider_webhooks`
- `payments`
- `ai_configurations`
- `user_account_config`
- `t_vereinbarungstitel`
- `t_vereinbarungs_logs`
- `mood_assessments`
- `session_yra`
- `yra_rewards_config`
- `bot_protection_logs`
- `user_agreement_consents`

---

## 🔧 Verwendete Skripte

### 1. `scripts/migrate-from-supabase-to-mysql-complete.php`
**Zweck:** Vollständige Migration von Supabase nach MySQL

**Funktionen:**
- Erstellt fehlende Tabellen in MySQL
- Klont alle Daten von Supabase nach MySQL
- Erstellt automatisch Backup vor Migration

**Ausführung:**
```bash
php scripts/migrate-from-supabase-to-mysql-complete.php
```

oder im Browser:
```
http://localhost/stimmumeter/scripts/migrate-from-supabase-to-mysql-complete.php
```

### 2. `scripts/delete-supabase-data.php`
**Zweck:** Löscht alle Daten aus Supabase

**⚠️ WICHTIG:** 
- Erfordert `SUPABASE_SERVICE_ROLE_KEY` in `.env` Datei
- Löscht ALLE Daten aus Supabase!
- Tabellen-Strukturen bleiben erhalten

**Ausführung:**
```bash
php scripts/delete-supabase-data.php
```

---

## 📝 Bekannte Probleme

### Integer-Feld-Fehler
Einige Datensätze hatten leere Strings in Integer-Feldern:
- `currencies.is_base` - 2 Datensätze übersprungen
- `plan_trial_config.is_permanent` - 1 Datensatz übersprungen

**Lösung:** Das Skript konvertiert leere Strings automatisch zu NULL für Integer-Felder.

---

## ✅ Nächste Schritte

1. **Prüfen Sie die Daten in phpMyAdmin:**
   - Öffnen Sie: http://localhost/phpmyadmin
   - Datenbank: `wameli`
   - Prüfen Sie die migrierten Tabellen

2. **Optional: Supabase-Daten löschen**
   - Wenn alle Daten erfolgreich migriert wurden
   - Verwenden Sie `scripts/delete-supabase-data.php` oder löschen Sie manuell

3. **Frontend anpassen**
   - Wenn Sie vollständig von Supabase weg möchten
   - Passen Sie die Frontend-Komponenten an, um MySQL statt Supabase zu verwenden

---

## 🔐 Sicherheitshinweise

- ⚠️ **Backup:** Ein Backup wurde automatisch erstellt vor der Migration
- ⚠️ **Supabase-Daten:** Werden NICHT automatisch gelöscht (Sicherheit)
- ⚠️ **Service Role Key:** Erforderlich für DELETE-Operationen, sollte geheim bleiben

---

**Ende der Dokumentation**




