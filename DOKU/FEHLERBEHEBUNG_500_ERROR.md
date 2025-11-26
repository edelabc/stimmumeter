# 🔧 Fehlerbehebung: 500 Internal Server Error

## 🚨 Problem

```
GET https://wameli.com/ 500 (Internal Server Error)
GET https://wameli.com/favicon.ico 500 (Internal Server Error)
```

---

## 🔍 Mögliche Ursachen

### 1. ❌ `config.production.php` wird als `index.php` interpretiert

**Problem:** Wenn `config.production.php` im Root-Verzeichnis liegt und PHP-Header sendet, kann dies zu Fehlern führen.

**Lösung:** Prüfen Sie, ob `config.production.php` im Root liegt und ob sie versehentlich ausgeführt wird.

---

### 2. ❌ Fehlende oder falsche `.htaccess`

**Problem:** Apache weiß nicht, welche Datei als Standard-Datei geladen werden soll.

**Lösung:** Erstellen Sie eine `.htaccess` im Root-Verzeichnis.

---

### 3. ❌ PHP-Fehler in `config.production.php`

**Problem:** `config.production.php` sendet Header, bevor Output gesendet wird.

**Lösung:** Prüfen Sie PHP-Error-Logs.

---

### 4. ❌ Falsche Verzeichnisstruktur

**Problem:** Dateien liegen im falschen Verzeichnis.

**Lösung:** Prüfen Sie die Struktur.

---

## ✅ Schritt-für-Schritt Lösung

### Schritt 1: `.htaccess` erstellen/korrigieren

Erstellen Sie eine `.htaccess` Datei im **Root-Verzeichnis** (`/public_html/` oder `/htdocs/`):

```apache
# Stimmumeter - Apache Konfiguration

# DirectoryIndex setzen
DirectoryIndex index.html index.php

# PHP-Dateien nur aus api/ Verzeichnis ausführen
<FilesMatch "\.php$">
    <If "%{REQUEST_URI} !~ m#^/api/#">
        Require all denied
    </If>
</FilesMatch>

# React/Vite SPA Routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # API-Aufrufe direkt weiterleiten
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ api/$1 [L]
    
    # Frontend-Routing (SPA)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# Sicherheit: Schütze Konfigurationsdateien
<FilesMatch "^(config\.|\.env)">
    Require all denied
</FilesMatch>

# PHP-Konfiguration
<IfModule mod_php.c>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
</IfModule>
```

**WICHTIG:** Diese `.htaccess` muss im **Root-Verzeichnis** liegen, nicht in `stimmumeter/`!

---

### Schritt 2: Verzeichnisstruktur prüfen

**Korrekte Struktur:**

```
/public_html/                    # Oder /htdocs/ oder /www/
├── .htaccess                   # ← HIER! (Root-Verzeichnis)
├── index.html                  # ← Frontend (aus dist/)
├── assets/                     # ← Frontend-Assets (aus dist/assets/)
├── config.production.php       # ← Konfiguration
└── api/                        # ← API-Ordner
    ├── auth.php
    └── ...
```

**ODER wenn in Unterverzeichnis:**

```
/public_html/
└── stimmumeter/
    ├── .htaccess              # ← HIER! (im stimmumeter/ Ordner)
    ├── index.html
    ├── assets/
    ├── config.production.php
    └── api/
```

---

### Schritt 3: `config.production.php` prüfen

**Problem:** `config.production.php` sendet Header, die zu Konflikten führen können.

**Lösung:** Stellen Sie sicher, dass `config.production.php` **NICHT** automatisch ausgeführt wird.

Fügen Sie am Anfang von `config.production.php` hinzu:

```php
<?php
// Diese Datei sollte NUR von anderen PHP-Dateien eingebunden werden
// NICHT direkt aufgerufen werden
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access forbidden');
}
```

---

### Schritt 4: PHP-Error-Logs prüfen

**Auf dem Server:**

1. **cPanel:** Error Logs im cPanel öffnen
2. **SSH:** 
   ```bash
   tail -f /var/log/apache2/error.log
   # Oder
   tail -f /var/log/php_errors.log
   ```

**Häufige Fehler:**
- `Cannot modify header information` → Header werden nach Output gesendet
- `Call to undefined function` → PHP-Extension fehlt
- `Failed to open stream` → Datei nicht gefunden

---

### Schritt 5: Test-Datei erstellen

Erstellen Sie `test.php` im Root:

```php
<?php
phpinfo();
?>
```

Aufrufen: `https://wameli.com/test.php`

**Erwartetes Ergebnis:** PHP-Info-Seite wird angezeigt

**Wenn auch das 500 gibt:** PHP-Problem auf Server-Ebene

---

### Schritt 6: `index.html` direkt testen

1. Öffnen Sie `https://wameli.com/index.html` direkt
2. Wenn das funktioniert → Routing-Problem
3. Wenn das auch 500 gibt → PHP-Problem

---

## 🔧 Schnell-Fix

### Option A: Minimal `.htaccess` (empfohlen)

```apache
DirectoryIndex index.html

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # API weiterleiten
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ api/$1 [L]
    
    # SPA Routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ index.html [L]
</IfModule>
```

### Option B: PHP-Fehler anzeigen (nur zum Debuggen!)

**Temporär in `.htaccess`:**

```apache
php_flag display_errors On
php_value error_reporting E_ALL
```

**WICHTIG:** Nach dem Debuggen wieder entfernen!

---

## 📋 Checkliste

- [ ] `.htaccess` existiert im Root-Verzeichnis
- [ ] `DirectoryIndex index.html` ist gesetzt
- [ ] `index.html` existiert und ist lesbar
- [ ] `assets/` Ordner existiert und ist lesbar
- [ ] PHP-Error-Logs geprüft
- [ ] `config.production.php` wird nicht direkt aufgerufen
- [ ] Dateiberechtigungen korrekt (644 für Dateien, 755 für Ordner)

---

## 🆘 Wenn nichts hilft

1. **Kontaktieren Sie Ihren Hosting-Provider**
   - Fragen Sie nach PHP-Version
   - Fragen Sie nach aktivierten Extensions
   - Fragen Sie nach Error-Log-Pfad

2. **Prüfen Sie Server-Logs**
   - Apache Error Log
   - PHP Error Log
   - cPanel Error Log

3. **Testen Sie mit minimaler Konfiguration**
   - Nur `index.html` hochladen
   - Schrittweise weitere Dateien hinzufügen

---

**Letzte Aktualisierung:** 2025-11-24



