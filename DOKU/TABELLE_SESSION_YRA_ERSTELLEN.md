# 🔧 Tabelle session_yra erstellen

## ❌ Problem

Fehler: `Table 'wameli.session_yra' doesn't exist`

Die Tabelle `session_yra` fehlt in der Datenbank.

---

## ✅ Lösung: Tabelle erstellen

### Schritt 1: phpMyAdmin öffnen

1. Öffnen Sie: **http://localhost/phpmyadmin**
2. Wählen Sie die Datenbank `wameli` aus

### Schritt 2: SQL ausführen

1. Klicken Sie auf **"SQL"** im oberen Menü
2. Kopieren Sie diesen Code:

```sql
CREATE TABLE IF NOT EXISTS `session_yra` (
  `session_id` VARCHAR(255) PRIMARY KEY,
  `yra_balance` INT DEFAULT 0 NOT NULL,
  `assessments_count` INT DEFAULT 0 NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_activity` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` CHAR(36) NULL,
  `yra_transferred` TINYINT(1) DEFAULT 0,
  INDEX `idx_session_yra_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

3. Klicken Sie auf **"Ausführen"**
4. ✅ **Fertig!** Die Tabelle ist erstellt!

---

## 🔄 Alternative: SQL-Datei verwenden

1. Öffnen Sie phpMyAdmin
2. Wählen Sie die Datenbank `wameli` aus
3. Klicken Sie auf **"Import"**
4. Wählen Sie die Datei: `database/create-session-yra-table.sql`
5. Klicken Sie auf **"Ausführen"**

---

## ✅ Nach der Erstellung

Die Anwendung sollte jetzt ohne Fehler funktionieren!

**Testen:**
1. Öffnen Sie: http://localhost:5173
2. Die Fehler sollten verschwunden sein
3. Die Session-Verwaltung sollte funktionieren

---

## 🆘 Falls weiterhin Fehler auftreten

**Problem: "Table already exists"**
- Normal, wenn Tabelle bereits vorhanden ist
- Die App sollte jetzt funktionieren

**Problem: "Access denied"**
- Prüfen Sie Benutzername und Passwort in `config.local.php`

---

**Die Tabelle ist jetzt erstellt!** 🎉




