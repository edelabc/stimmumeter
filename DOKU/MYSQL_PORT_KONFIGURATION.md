# MySQL Port-Konfiguration - Lösung

**Datum:** 2025-11-24

---

## 🔍 Problem-Analyse

### Situation
- **XAMPP MySQL** läuft auf **Port 3308**
- **Homebrew MySQL** läuft auf **Port 3306**
- XAMPP Control Panel versucht MySQL auf Port 3306 zu starten
- Port 3306 ist bereits belegt → MySQL startet nicht über Control Panel

### Lösung
- MySQL läuft bereits erfolgreich auf Port 3308
- Konfiguration wurde angepasst: `my.cnf` → Port 3308 für Client und Server
- Anwendung verwendet Port 3308 → **Alles funktioniert!**

---

## ✅ Aktuelle Konfiguration

### MySQL Ports
- **XAMPP MySQL:** Port 3308 ✅ (läuft)
- **Homebrew MySQL:** Port 3306 ✅ (läuft parallel)

### Konfigurationsdateien

#### `/Applications/XAMPP/xamppfiles/etc/my.cnf`
```ini
[client]
port = 3308

[mysqld]
port = 3308
```

#### `/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/config.local.php`
```php
define('DB_PORT', 3308); // XAMPP MySQL Port
```

---

## 🚀 MySQL starten

### Option 1: Über Terminal (empfohlen)
```bash
/Applications/XAMPP/xamppfiles/mysql/scripts/ctl.sh start
```

### Option 2: Über mysql.server
```bash
/Applications/XAMPP/xamppfiles/bin/mysql.server start
```

### Option 3: XAMPP Control Panel
- **Hinweis:** Control Panel zeigt möglicherweise "Starting..." ohne Erfolgsmeldung
- **Aber:** MySQL läuft trotzdem auf Port 3308
- **Prüfen:** Terminal-Befehl `ps aux | grep mysqld` zeigt laufenden Prozess

---

## ✅ Status prüfen

### MySQL-Prozess prüfen
```bash
ps aux | grep mysqld | grep 3308
```

### Port prüfen
```bash
lsof -i :3308 | grep LISTEN
```

### Verbindung testen
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
php -r "require 'config.local.php'; \$pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME, DB_USER, DB_PASS); echo '✅ Verbindung erfolgreich';"
```

---

## ⚠️ Wichtige Hinweise

### XAMPP Control Panel
- Das Control Panel zeigt möglicherweise keine Erfolgsmeldung
- **Aber:** MySQL läuft trotzdem korrekt auf Port 3308
- **Lösung:** Status über Terminal prüfen

### Port-Konflikt vermeiden
- **Homebrew MySQL** auf Port 3306 → OK
- **XAMPP MySQL** auf Port 3308 → OK
- Beide können parallel laufen

### Berechtigungen
- MySQL läuft als `_mysql` Benutzer
- Normale Benutzer können MySQL-Prozess nicht beenden
- Verwenden Sie `sudo` oder XAMPP Control Panel zum Stoppen

---

## 🧪 Testen

### 1. MySQL-Verbindung
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
php -r "require 'config.local.php'; \$pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME, DB_USER, DB_PASS); echo '✅ OK';"
```

### 2. API testen
```bash
curl 'http://localhost/stimmumeter/api/auth.php?action=user'
# Erwartet: {"error":"Nicht authentifiziert"}
```

### 3. Frontend testen
- Browser öffnen: http://localhost:5173
- Registrierung/Login testen

---

## ✅ Ergebnis

**MySQL läuft erfolgreich auf Port 3308 und die Anwendung funktioniert!**

Das XAMPP Control Panel zeigt möglicherweise keine Erfolgsmeldung, aber MySQL läuft trotzdem korrekt.

---

**Status:** ✅ MySQL läuft und funktioniert




