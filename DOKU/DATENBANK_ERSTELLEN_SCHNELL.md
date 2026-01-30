# 🗄️ Datenbank schnell erstellen - Fehler beheben

## ❌ Problem

Fehler: `Unknown database 'wameli'`

Die Datenbank existiert noch nicht. Hier ist die schnellste Lösung:

---

## ✅ Lösung: Datenbank in phpMyAdmin erstellen

### Schritt 1: phpMyAdmin öffnen

1. Öffnen Sie: **http://localhost/phpmyadmin**
2. Melden Sie sich an (meist `root` ohne Passwort)

### Schritt 2: Datenbank erstellen

**Option A: Über SQL-Tab (Schnellste)**

1. Klicken Sie auf **"SQL"** im oberen Menü
2. Kopieren Sie diesen Code:

```sql
CREATE DATABASE IF NOT EXISTS `wameli` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

3. Klicken Sie auf **"Ausführen"**
4. ✅ Datenbank `wameli` ist erstellt!

**Option B: Über GUI**

1. Klicken Sie auf **"Neu"** im linken Menü
2. Datenbankname: `wameli`
3. Sortierung: `utf8mb4_unicode_ci`
4. Klicken Sie auf **"Erstellen"**

### Schritt 3: Tabellen erstellen

1. Wählen Sie die Datenbank `wameli` aus
2. Klicken Sie auf **"SQL"**
3. Öffnen Sie die Datei: `database/create-complete-database.sql`
4. **Kopieren Sie den gesamten Inhalt**
5. **Fügen Sie ihn in den SQL-Editor ein**
6. Klicken Sie auf **"Ausführen"**
7. ✅ **Fertig!** Alle Tabellen sind erstellt!

---

## 🔧 Alternative: Über Terminal

```bash
# Datenbank erstellen
/Applications/XAMPP/xamppfiles/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS wameli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Tabellen importieren
/Applications/XAMPP/xamppfiles/bin/mysql -u root wameli < database/create-complete-database.sql
```

---

## ✅ Nach der Erstellung

Die Anwendung sollte jetzt ohne Fehler funktionieren!

**Testen:**
1. Öffnen Sie: http://localhost:5173
2. Die Fehler sollten verschwunden sein
3. Die Session-Verwaltung sollte funktionieren

---

## 🆘 Falls weiterhin Fehler auftreten

**Problem: "Table doesn't exist"**
- Lösung: Führen Sie `database/create-complete-database.sql` aus

**Problem: "Access denied"**
- Lösung: Prüfen Sie Benutzername und Passwort in `config.local.php`

**Problem: "Connection refused"**
- Lösung: Stellen Sie sicher, dass MySQL in XAMPP läuft

---

**Die Datenbank ist jetzt erstellt!** 🎉





