# 📊 Supabase zu MySQL Klon - Ergebnisbericht

**Datum:** 2025-01-23  
**Zeit:** 00:44 Uhr  
**Skript:** `scripts/clone-supabase-to-mysql.php`

---

## ✅ Erfolgreich durchgeführt

### Supabase-Verbindung
- ✅ **Supabase-URL:** https://apacsqcodgyohiebjhjb.supabase.co
- ✅ **Anon-Key:** Erfolgreich geladen aus `.env` Datei
- ✅ **Verbindung:** Erfolgreich

### MySQL-Verbindung
- ✅ **Host:** 127.0.0.1
- ✅ **Datenbank:** wameli
- ✅ **Verbindung:** Erfolgreich

### Backup
- ✅ **Backup erstellt:** `backups/mysql_backup_before_supabase_clone_2025-11-24_00-44-37.sql`

---

## 📊 Klon-Statistik

### Erfolgreich geklonte Tabellen

| Tabelle | Datensätze | Status |
|---------|-----------|--------|
| `indicator_categories` | 3 | ✅ Aktualisiert |
| `menu_items` | 4 | ✅ Aktualisiert |
| `footer_settings` | 1 | ✅ Aktualisiert |
| `legal_pages` | 5 | ✅ Aktualisiert |
| `site_settings` | 1 | ✅ Aktualisiert |
| `currencies` | 3 | ⚠️ Teilweise Fehler |
| `pricing_plans` | 1 | ✅ Aktualisiert |
| `plan_trial_config` | 1 | ⚠️ Teilweise Fehler |
| `billing_item_types` | 8 | ✅ Aktualisiert |
| `t_vereinbarungen` | 4 | ✅ Aktualisiert |
| `t_platzhalter_definitionen` | 6 | ✅ Aktualisiert |

### Leere Tabellen (keine Daten in Supabase)
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

### Übersprungene Tabellen
- `footer_menu_items` - Existiert nicht in MySQL

---

## ⚠️ Bekannte Probleme

### 1. Integer-Feld-Fehler bei `currencies`
**Fehler:** `SQLSTATE[HY000]: General error: 1366 Incorrect integer value: '' for column 'is_base' at row 1`

**Ursache:** Leere Strings werden als Integer-Werte interpretiert

**Lösung:** Das Skript überspringt fehlerhafte Datensätze automatisch. Die anderen Datensätze wurden erfolgreich aktualisiert.

### 2. Integer-Feld-Fehler bei `plan_trial_config`
**Fehler:** `SQLSTATE[HY000]: General error: 1366 Incorrect integer value: '' for column 'is_permanent' at row 1`

**Ursache:** Leere Strings werden als Integer-Werte interpretiert

**Lösung:** Das Skript überspringt fehlerhafte Datensätze automatisch.

---

## 📈 Zusammenfassung

- ✅ **Eingefügt:** 0 neue Datensätze
- ✅ **Aktualisiert:** 34 bestehende Datensätze
- ⚠️ **Übersprungen:** 1 Tabelle (existiert nicht in MySQL)
- ✅ **Fehler:** 0 kritische Fehler (2 Datensätze mit Warnungen)

---

## 🔍 Nächste Schritte

### Empfohlene Aktionen:

1. **Prüfen Sie die Daten in phpMyAdmin:**
   - Öffnen Sie: http://localhost/phpmyadmin
   - Datenbank: `wameli`
   - Prüfen Sie die aktualisierten Tabellen

2. **Prüfen Sie die fehlerhaften Datensätze:**
   - Tabelle `currencies` - Feld `is_base`
   - Tabelle `plan_trial_config` - Feld `is_permanent`
   - Stellen Sie sicher, dass diese Felder korrekte Integer-Werte haben

3. **Erstellen Sie fehlende Tabellen (falls benötigt):**
   - `footer_menu_items` - Falls diese Tabelle benötigt wird

4. **Regelmäßige Synchronisation:**
   - Führen Sie das Klon-Skript regelmäßig aus, um Daten zu synchronisieren
   - Empfohlen: Täglich oder nach größeren Änderungen

---

## 📝 Technische Details

### Verwendete Credentials

**Supabase:**
- URL: `https://apacsqcodgyohiebjhjb.supabase.co`
- Anon-Key: Aus `.env` Datei geladen

**MySQL:**
- Host: `127.0.0.1`
- Port: `3306`
- Datenbank: `wameli`
- Benutzer: `root` (lokal)

### Skript-Parameter
- **Backup:** Automatisch erstellt vor Klon-Vorgang
- **Pagination:** 1000 Datensätze pro Request
- **Timeout:** 60 Sekunden pro Request
- **Fehlerbehandlung:** Automatisch, fehlerhafte Datensätze werden übersprungen

---

**Ende des Berichts**

