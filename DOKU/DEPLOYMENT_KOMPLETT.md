# 🚀 Stimmumeter - Komplette Deployment-Anleitung

**Version:** 1.0  
**Datum:** 2025-11-24  
**Status:** Supabase entfernt, vollständig MySQL-basiert

---

## 📋 Übersicht

Diese Anleitung führt Sie Schritt für Schritt durch das Deployment der Stimmumeter-Anwendung auf einen Produktionsserver.

### ✅ Voraussetzungen

- **Webserver:** Apache 2.4+ oder Nginx
- **PHP:** Version 8.2 oder höher
- **MySQL:** Version 8.0 oder höher
- **Node.js:** Version 18+ (für Build)
- **FTP/SSH-Zugang** zum Server

---

## 🔧 Schritt 1: Lokale Vorbereitung

### 1.1 Dependencies installieren

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
npm install
```

### 1.2 Produktions-Build erstellen

```bash
npm run build
```

Dies erstellt den optimierten Build im `dist/` Ordner.

### 1.3 Umgebungsvariablen prüfen

Stellen Sie sicher, dass `.env.production` korrekt konfiguriert ist:

```env
VITE_API_BASE_URL=https://ihre-domain.de/stimmumeter/api
VITE_USE_NEW_LANDING_PAGE=true
```

**WICHTIG:** Entfernen Sie alle Supabase-Variablen (werden nicht mehr benötigt):
- ~~VITE_SUPABASE_URL~~
- ~~VITE_SUPABASE_ANON_KEY~~

---

## 📦 Schritt 2: Dateien für Upload vorbereiten

### 2.1 Dateien die hochgeladen werden müssen

```
stimmumeter/
├── api/                    # PHP API-Endpunkte
│   ├── *.php
│   └── ...
├── dist/                   # Frontend-Build (aus npm run build)
│   ├── index.html
│   ├── assets/
│   └── ...
├── config.production.php   # Produktions-Konfiguration
├── .htaccess              # Apache-Konfiguration (falls vorhanden)
└── public/                # Statische Dateien (falls vorhanden)
```

### 2.2 Dateien die NICHT hochgeladen werden müssen

```
❌ node_modules/
❌ src/                     # TypeScript-Quellcode
❌ .env.local
❌ .env.development
❌ package.json
❌ package-lock.json
❌ vite.config.ts
❌ tsconfig.json
❌ supabase/               # Supabase-Migrationen (nicht mehr benötigt)
```

---

## 🗄️ Schritt 3: Datenbank-Setup auf dem Server

### 3.1 Datenbank erstellen

1. Öffnen Sie **phpMyAdmin** auf dem Server
2. Erstellen Sie eine neue Datenbank: `wameli` (oder Ihren gewünschten Namen)
3. Zeichensatz: `utf8mb4_unicode_ci`

### 3.2 Tabellen importieren

**Option A: Automatisches Setup (empfohlen)**

Die API erstellt Tabellen automatisch beim ersten Aufruf. Stellen Sie sicher, dass `config.production.php` korrekt konfiguriert ist.

**Option B: Manuelles Setup**

1. Öffnen Sie `database/create-complete-database.sql` in phpMyAdmin
2. Führen Sie das SQL-Script aus

### 3.3 Datenbank-Konfiguration

Bearbeiten Sie `config.production.php`:

```php
define('DB_HOST', 'localhost');  // Oder Ihre MySQL-Host-Adresse
define('DB_PORT', 3306);          // Standard MySQL-Port
define('DB_USER', 'ihr_db_user');
define('DB_PASS', 'ihr_db_passwort');
define('DB_NAME', 'wameli');
```

---

## 📤 Schritt 4: Dateien auf Server hochladen

### 4.1 Mit FTP (FileZilla, etc.)

1. Verbinden Sie sich mit dem Server
2. Navigieren Sie zum Webroot-Verzeichnis (z.B. `/public_html/` oder `/htdocs/`)
3. Erstellen Sie einen Ordner `stimmumeter/` (falls nicht vorhanden)
4. Laden Sie folgende Dateien/Ordner hoch:

**WICHTIG: Verzeichnisstruktur auf dem Server**

```
/public_html/stimmumeter/          # Hauptordner
├── api/                           # ← API-Ordner hier hochladen!
│   ├── auth.php
│   ├── db.php
│   └── ... (alle PHP-Dateien)
├── index.html                      # ← Aus dist/index.html
├── assets/                         # ← Aus dist/assets/
│   ├── index-xxx.js
│   └── index-xxx.css
├── config.production.php          # ← Konfigurationsdatei
└── .htaccess                      # ← Optional
```

**Konkrete Schritte:**
- `api/` Ordner → `stimmumeter/api/` hochladen (kompletter Ordner)
- **Inhalt** von `dist/` → `stimmumeter/` hochladen (NICHT den dist-Ordner selbst!)
  - `dist/index.html` → `stimmumeter/index.html`
  - `dist/assets/` → `stimmumeter/assets/`
- `config.production.php` → `stimmumeter/config.production.php`

### 4.2 Mit SSH/SCP

```bash
# Auf lokalem Rechner
# 1. API-Ordner hochladen
scp -r api/ user@server:/path/to/public_html/stimmumeter/

# 2. Frontend-Dateien hochladen (Inhalt von dist/, nicht dist-Ordner selbst!)
scp -r dist/* user@server:/path/to/public_html/stimmumeter/

# 3. Konfigurationsdatei hochladen
scp config.production.php user@server:/path/to/public_html/stimmumeter/
```

**Ergebnis auf Server:**
```
/public_html/stimmumeter/
├── api/              ✅ Kompletter Ordner
├── index.html        ✅ Aus dist/
├── assets/           ✅ Aus dist/assets/
└── config.production.php
```

### 4.3 Dateiberechtigungen setzen

```bash
# Auf dem Server
chmod 644 config.production.php
chmod 755 api/
chmod 644 api/*.php
chmod 755 dist/
chmod 644 dist/*
```

---

## ⚙️ Schritt 5: Server-Konfiguration

### 5.1 Apache-Konfiguration (.htaccess)

Erstellen Sie `.htaccess` im `stimmumeter/` Ordner:

```apache
# Rewrite Engine aktivieren
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /stimmumeter/
    
    # API-Aufrufe direkt weiterleiten
    RewriteCond %{REQUEST_URI} ^/stimmumeter/api/
    RewriteRule ^api/(.*)$ api/$1 [L]
    
    # Frontend-Routing (SPA)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# PHP-Konfiguration
<IfModule mod_php.c>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
</IfModule>

# Sicherheit: Schütze Konfigurationsdateien
<FilesMatch "^(config\.|\.env)">
    Require all denied
</FilesMatch>
```

### 5.2 PHP-Konfiguration prüfen

Stellen Sie sicher, dass folgende PHP-Extensions aktiviert sind:
- `pdo_mysql`
- `json`
- `mbstring`
- `openssl`

### 5.3 CORS-Konfiguration

Die API-Dateien haben bereits CORS-Header eingebaut. Falls Sie zusätzliche Konfiguration benötigen, können Sie in `.htaccess` hinzufügen:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
```

---

## 🔐 Schritt 6: Sicherheit

### 6.1 Konfigurationsdatei schützen

Stellen Sie sicher, dass `config.production.php` nicht öffentlich zugänglich ist:

```apache
<FilesMatch "config\.production\.php">
    Require all denied
</FilesMatch>
```

### 6.2 API-Verzeichnis schützen

Optional: Schützen Sie das `api/` Verzeichnis vor direktem Zugriff (nur über CORS):

```apache
# In api/.htaccess
<IfModule mod_headers.c>
    Header set X-Robots-Tag "noindex, nofollow"
</IfModule>
```

### 6.3 SSL/HTTPS einrichten

**WICHTIG:** Verwenden Sie HTTPS in der Produktion!

1. SSL-Zertifikat installieren (Let's Encrypt empfohlen)
2. HTTP zu HTTPS umleiten:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

3. `config.production.php` aktualisieren:

```php
define('APP_URL', 'https://ihre-domain.de/stimmumeter');
```

---

## ✅ Schritt 7: Testen

### 7.1 API testen

```bash
curl https://ihre-domain.de/stimmumeter/api/auth.php?action=test
```

Erwartete Antwort: JSON mit Status

### 7.2 Frontend testen

1. Öffnen Sie `https://ihre-domain.de/stimmumeter/`
2. Prüfen Sie Browser-Konsole auf Fehler
3. Testen Sie Login/Registrierung
4. Testen Sie Mood-Tracking-Funktionen

### 7.3 Datenbank-Verbindung testen

Erstellen Sie eine Test-Datei `api/test-db.php`:

```php
<?php
require_once __DIR__ . '/db.php';
echo json_encode(['status' => 'success', 'message' => 'Datenbank verbunden']);
?>
```

Aufrufen: `https://ihre-domain.de/stimmumeter/api/test-db.php`

**WICHTIG:** Löschen Sie diese Datei nach dem Test!

---

## 🔄 Schritt 8: Updates deployen

### 8.1 Lokaler Build

```bash
npm run build
```

### 8.2 Dateien hochladen

1. Backup der aktuellen `dist/` Dateien erstellen
2. Neue `dist/` Dateien hochladen
3. `api/` Dateien aktualisieren (falls geändert)
4. `config.production.php` prüfen (falls geändert)

### 8.3 Cache leeren

- Browser-Cache leeren (Strg+Shift+R / Cmd+Shift+R)
- Falls CDN verwendet wird: CDN-Cache invalidieren

---

## 📝 Schritt 9: Wartung

### 9.1 Logs prüfen

- PHP-Error-Logs: `/var/log/apache2/error.log` oder Server-spezifisch
- Application-Logs: `logs/php-errors.log` (falls konfiguriert)

### 9.2 Datenbank-Backup

Regelmäßige Backups einrichten:

```bash
mysqldump -u db_user -p wameli > backup_$(date +%Y%m%d).sql
```

### 9.3 Performance-Monitoring

- Server-Ressourcen überwachen
- Datenbank-Performance prüfen
- API-Response-Zeiten überwachen

---

## 🐛 Fehlerbehebung

### Problem: API gibt 500 Error

**Lösung:**
1. PHP-Error-Logs prüfen
2. `config.production.php` auf korrekte DB-Credentials prüfen
3. PHP-Extensions prüfen (`pdo_mysql`)

### Problem: CORS-Fehler

**Lösung:**
1. Prüfen Sie, ob CORS-Header in API-Dateien gesetzt sind
2. Prüfen Sie `.htaccess` Konfiguration
3. Prüfen Sie Browser-Konsole für Details

### Problem: Frontend lädt nicht

**Lösung:**
1. Prüfen Sie, ob `dist/` Dateien korrekt hochgeladen wurden
2. Prüfen Sie `.htaccess` Rewrite-Regeln
3. Prüfen Sie Browser-Konsole für 404-Fehler

### Problem: Datenbank-Verbindung fehlgeschlagen

**Lösung:**
1. DB-Credentials in `config.production.php` prüfen
2. MySQL-Server erreichbar?
3. Datenbank existiert?
4. Benutzer hat Berechtigungen?

---

## 📚 Zusätzliche Ressourcen

- **API-Dokumentation:** `DOKU/API_DOKUMENTATION.md` (falls vorhanden)
- **Datenbank-Schema:** `database/create-complete-database.sql`
- **Konfiguration:** `config.production.php`

---

## ✅ Checkliste vor Go-Live

- [ ] Build erstellt (`npm run build`)
- [ ] Alle Dateien hochgeladen
- [ ] Datenbank erstellt und konfiguriert
- [ ] `config.production.php` korrekt konfiguriert
- [ ] `.htaccess` eingerichtet
- [ ] SSL/HTTPS aktiviert
- [ ] API getestet
- [ ] Frontend getestet
- [ ] Login/Registrierung funktioniert
- [ ] Datenbank-Backup eingerichtet
- [ ] Logs konfiguriert
- [ ] Supabase-Variablen entfernt
- [ ] Alle Supabase-Abhängigkeiten entfernt

---

## 🎉 Fertig!

Ihre Anwendung sollte jetzt vollständig auf MySQL umgestellt und produktionsbereit sein!

Bei Fragen oder Problemen, prüfen Sie die Logs und die Fehlerbehebungs-Sektion oben.

---

**Letzte Aktualisierung:** 2025-11-24  
**Version:** 1.0

