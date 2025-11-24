# 💾 Datenbank-Backup - Anleitung

## 📋 Übersicht

**WICHTIG:** Vor jeder Datenbank-Änderung sollte ein Backup erstellt werden!

---

## 🚀 Schnellstart

### Backup erstellen

**Lokale Datenbank:**
```bash
php scripts/backup-database.php local
```

**Produktions-Datenbank:**
```bash
php scripts/backup-database.php production
```

---

## 📁 Backup-Speicherort

Backups werden gespeichert in:
```
backups/
├── wameli_backup_2024-11-23_14-30-45.sql
├── wameli_backup_2024-11-23_14-30-45.sql.gz  (komprimiert)
└── ...
```

---

## 🔄 Automatisches Backup vor Setup

**Mit automatischem Backup:**
```bash
php scripts/setup-database-with-backup.php local
```

Dieses Script:
1. ✅ Erstellt automatisch ein Backup (falls Datenbank existiert)
2. ✅ Führt dann das Datenbank-Setup aus

---

## 📦 Backup wiederherstellen

### Methode 1: phpMyAdmin

1. Öffnen Sie phpMyAdmin: http://localhost/phpmyadmin
2. Wählen Sie die Datenbank `wameli` aus
3. Klicken Sie auf **"Import"**
4. Wählen Sie die Backup-Datei aus (`backups/wameli_backup_*.sql`)
5. Klicken Sie auf **"Ausführen"**

### Methode 2: Terminal

**Unkomprimiertes Backup:**
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root wameli < backups/wameli_backup_2024-11-23_14-30-45.sql
```

**Komprimiertes Backup:**
```bash
gunzip < backups/wameli_backup_2024-11-23_14-30-45.sql.gz | /Applications/XAMPP/xamppfiles/bin/mysql -u root wameli
```

---

## ⚙️ Backup-Details

### Was wird gesichert?

- ✅ Alle Tabellen-Strukturen
- ✅ Alle Daten
- ✅ Indexes
- ✅ Foreign Keys
- ✅ Timestamp der Erstellung

### Backup-Format

- **Unkomprimiert:** `.sql` Datei (lesbar)
- **Komprimiert:** `.sql.gz` Datei (platzsparend)

---

## 🔧 Manuelles Backup

### Über phpMyAdmin

1. Öffnen Sie phpMyAdmin
2. Wählen Sie die Datenbank `wameli`
3. Klicken Sie auf **"Exportieren"**
4. Wählen Sie **"Schnell"** oder **"Benutzerdefiniert"**
5. Klicken Sie auf **"Ausführen"**
6. Speichern Sie die Datei

### Über Terminal

```bash
/Applications/XAMPP/xamppfiles/bin/mysqldump -u root wameli > backup.sql
```

---

## 📋 Best Practices

1. ✅ **Vor jeder Migration:** Backup erstellen
2. ✅ **Vor größeren Änderungen:** Backup erstellen
3. ✅ **Regelmäßig:** Automatische Backups einrichten
4. ✅ **Backups testen:** Regelmäßig Wiederherstellung testen
5. ✅ **Backups aufbewahren:** Mindestens 7 Tage, besser 30 Tage

---

## 🆘 Troubleshooting

### Problem: "mysqldump not found"

**Lösung:**
- Verwenden Sie den vollständigen Pfad: `/Applications/XAMPP/xamppfiles/bin/mysqldump`
- Oder: Fügen Sie XAMPP zum PATH hinzu

### Problem: "Access denied"

**Lösung:**
- Prüfen Sie Benutzername und Passwort in `config.local.php`
- Stellen Sie sicher, dass der Benutzer Backup-Berechtigungen hat

### Problem: "Database doesn't exist"

**Lösung:**
- Normal, wenn die Datenbank noch nicht erstellt wurde
- Das Backup-Script erkennt dies automatisch

---

## ✅ Checkliste

Vor Datenbank-Änderungen:

- [ ] ✅ Backup erstellt
- [ ] ✅ Backup-Datei überprüft (Größe > 0)
- [ ] ✅ Backup-Speicherort notiert
- [ ] ✅ Datenbank-Änderungen geplant

Nach Datenbank-Änderungen:

- [ ] ✅ Änderungen getestet
- [ ] ✅ Backup behalten (falls Rollback nötig)

---

**Backup ist erstellt!** 💾


