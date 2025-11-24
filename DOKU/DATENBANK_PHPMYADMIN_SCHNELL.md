# 🚀 Datenbank schnell in phpMyAdmin erstellen

## ⚡ Schnellste Methode (2 Minuten)

### Schritt 1: phpMyAdmin öffnen
1. Öffnen Sie: **http://localhost/phpmyadmin**
2. Melden Sie sich an (meist `root` ohne Passwort)

---

### Schritt 2: SQL-Datei importieren

**Option A: Über SQL-Tab (Empfohlen)**

1. Klicken Sie auf **"SQL"** im oberen Menü
2. Öffnen Sie die Datei: `database/create-complete-database.sql`
3. **Kopieren Sie den gesamten Inhalt**
4. **Fügen Sie ihn in den SQL-Editor ein**
5. Klicken Sie auf **"Ausführen"**
6. ✅ **Fertig!** Die Datenbank `wameli` mit allen Tabellen ist erstellt!

**Option B: Über Import-Tab**

1. Klicken Sie auf **"Import"** im oberen Menü
2. Klicken Sie auf **"Datei auswählen"**
3. Wählen Sie: `database/create-complete-database.sql`
4. Klicken Sie auf **"Ausführen"**
5. ✅ **Fertig!**

---

## ✅ Was wird erstellt?

Die SQL-Datei erstellt:

- ✅ Datenbank `wameli`
- ✅ **20+ Tabellen** (Users, Mood Indicators, Billing, Agreements, etc.)
- ✅ **Standard-Daten** (Währungen, YRA-Config, Mood Indicators)
- ✅ **Indexes** für Performance

---

## 📋 Erstellte Tabellen

Nach dem Import sollten Sie folgende Tabellen sehen:

### Core:
- `users_profile`
- `pseudonyms`
- `mood_indicators`
- `mood_entries`
- `mood_indicator_values`
- `indicator_categories`

### Admin & CMS:
- `admin_users`
- `admin_menu_items`
- `site_settings`

### Billing:
- `currencies`
- `exchange_rates`
- `pricing_plans`
- `user_subscriptions`

### Agreements:
- `t_vereinbarungstitel`
- `t_vereinbarungen`

### Mood Assessment:
- `mood_assessments`
- `session_yra`
- `yra_rewards_config`
- `bot_protection_logs`

---

## 🆘 Troubleshooting

### Fehler: "Access denied"
- Prüfen Sie, ob MySQL läuft
- Bei XAMPP: Starten Sie MySQL über XAMPP Control Panel

### Fehler: "Table already exists"
- Normal, wenn Sie die Datei mehrfach ausführen
- Die Datei verwendet `CREATE TABLE IF NOT EXISTS`

### Datenbank erscheint nicht
- Aktualisieren Sie die Seite (F5)
- Prüfen Sie die linke Seitenleiste in phpMyAdmin

---

## 📝 Nächste Schritte

Nach erfolgreichem Import:

1. ✅ Datenbank ist erstellt
2. ✅ Tabellen sind vorhanden
3. ✅ Standard-Daten sind importiert
4. ⏭️ Frontend kann jetzt mit der Datenbank arbeiten

---

**Die Datenbank ist jetzt bereit!** 🎉


