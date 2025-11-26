# 🗄️ Datenbank in phpMyAdmin erstellen

## Schnellste Methode: phpMyAdmin

### Schritt 1: phpMyAdmin öffnen
1. Öffnen Sie: **http://localhost/phpmyadmin**
2. Melden Sie sich an (meist `root` ohne Passwort bei XAMPP)

---

### Schritt 2a: Lokale Datenbank erstellen

**Option A: Über SQL-Tab**

1. Klicken Sie auf **"SQL"** im oberen Menü
2. Kopieren Sie folgenden Code:

```sql
CREATE DATABASE IF NOT EXISTS `stimmumeter` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

3. Klicken Sie auf **"Ausführen"**
4. ✅ Datenbank `stimmumeter` ist erstellt!

**Option B: Über GUI**

1. Klicken Sie auf **"Neu"** im linken Menü
2. Datenbankname: `stimmumeter`
3. Sortierung: `utf8mb4_unicode_ci`
4. Klicken Sie auf **"Erstellen"**
5. ✅ Datenbank ist erstellt!

---

### Schritt 2b: Produktions-Datenbank erstellen (wameli)

**Für die Online-Datenbank:**

1. Öffnen Sie phpMyAdmin auf Ihrem Server
2. Oder verwenden Sie die SQL-Datei: `database/create-database.sql`

**SQL-Code:**

```sql
CREATE DATABASE IF NOT EXISTS `wameli` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

---

## 📋 Nächste Schritte

Nachdem die Datenbank erstellt wurde:

### 1. Migrationen importieren

Die Datenbankstruktur wird aus den Migrationen erstellt. Sie haben zwei Optionen:

**Option A: Automatisch (empfohlen)**

```bash
# 1. Migrationen konvertieren
php scripts/convert-migrations-to-mysql.php

# 2. Datenbank-Setup ausführen
php scripts/setup-database-local.php
```

**Option B: Manuell in phpMyAdmin**

1. Wählen Sie die Datenbank aus (z.B. `stimmumeter` oder `wameli`)
2. Klicken Sie auf **"SQL"**
3. Öffnen Sie die Dateien aus `supabase/migrations/` (in chronologischer Reihenfolge)
4. Kopieren Sie den SQL-Code
5. **WICHTIG:** Konvertieren Sie PostgreSQL → MySQL (siehe unten)
6. Führen Sie das SQL aus

---

## 🔄 PostgreSQL → MySQL Konvertierung

Wenn Sie die Migrationen manuell importieren, müssen Sie folgende Änderungen vornehmen:

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

**Entfernen:**
- ❌ `DO $$ ... $$;` Blöcke
- ❌ `CREATE POLICY` (RLS)
- ❌ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- ❌ `USING GIST(...)` in Indexes

---

## ✅ Überprüfung

Nach dem Erstellen der Datenbank sollten Sie sehen:

1. ✅ Datenbank erscheint in der linken Liste
2. ✅ Sie können die Datenbank auswählen
3. ✅ Tabellen werden nach dem Import der Migrationen sichtbar

---

## 🆘 Troubleshooting

### Fehler: "Access denied"
- Prüfen Sie Benutzername und Passwort
- Bei XAMPP: Standard ist `root` ohne Passwort

### Fehler: "Database already exists"
- Normal, wenn Datenbank bereits vorhanden ist
- Sie können mit `DROP DATABASE` löschen und neu erstellen

### Datenbank erscheint nicht
- Aktualisieren Sie die Seite (F5)
- Prüfen Sie, ob Sie die richtige MySQL-Instanz verwenden

---

**Die Datenbank ist jetzt erstellt!** 🎉




