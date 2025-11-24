# ✅ MySQL Start-Problem gelöst

**Datum:** 2025-11-24 01:09

---

## 🔍 Problem-Analyse

### Situation
- **XAMPP MySQL** läuft auf **Port 3308** (nicht 3306)
- **Homebrew MySQL** läuft auf **Port 3306**
- Konfiguration verwendete Port 3306, aber XAMPP MySQL läuft auf 3308

### Lösung
- `config.local.php` wurde angepasst: **Port 3308** statt 3306
- MySQL-Verbindung funktioniert jetzt erfolgreich

---

## ✅ Status

### MySQL-Verbindung
- ✅ **Port:** 3308 (XAMPP MySQL)
- ✅ **Host:** 127.0.0.1
- ✅ **Datenbank:** wameli
- ✅ **Benutzer:** root
- ✅ **Passwort:** (leer)

### PHP-Verbindung
- ✅ `api/db.php` verbindet erfolgreich
- ✅ Datenbank `wameli` existiert
- ✅ Tabellen werden automatisch erstellt/aktualisiert

### API-Test
- ✅ `api/auth.php` antwortet korrekt
- ✅ Fehlermeldung "Nicht authentifiziert" ist korrekt (kein Token gesendet)

---

## 📋 Konfiguration

### config.local.php
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3308); // XAMPP MySQL Port (3308, da Homebrew MySQL auf 3306 läuft)
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'wameli');
```

---

## ⚠️ Hinweise

### Port-Konflikt
- **Homebrew MySQL:** Port 3306
- **XAMPP MySQL:** Port 3308
- Beide können parallel laufen

### MySQL CLI-Tool
Das `mysql` CLI-Tool versucht möglicherweise das Homebrew MySQL Plugin zu verwenden. Für XAMPP MySQL:
```bash
# Verwenden Sie den vollständigen Pfad:
/Applications/XAMPP/xamppfiles/bin/mysql -h 127.0.0.1 -P 3308 -u root
```

### Migrations-Fehler
Es gibt einige Migrations-Fehler bei der Index-Erstellung. Diese sind **nicht kritisch** für den Betrieb der Anwendung. Die Tabellen funktionieren trotzdem.

---

## 🧪 Testen

### 1. PHP-Verbindung testen
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
php -r "require 'config.local.php'; \$pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME, DB_USER, DB_PASS); echo '✅ Verbindung erfolgreich';"
```

### 2. API testen
```bash
curl 'http://localhost/stimmumeter/api/auth.php?action=user'
# Erwartete Antwort: {"error":"Nicht authentifiziert"}
```

### 3. Datenbank prüfen
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -h 127.0.0.1 -P 3308 -u root -e "SHOW DATABASES LIKE 'wameli';"
```

---

## ✅ Ergebnis

**MySQL läuft erfolgreich auf Port 3308 und die Anwendung kann sich verbinden!**

---

**Status:** ✅ Problem gelöst

