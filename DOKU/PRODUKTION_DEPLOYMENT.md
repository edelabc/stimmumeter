# 🚀 Produktions-Deployment Anleitung

**Datum:** 2025-01-24  
**Version:** 1.0.0

---

## 📋 Übersicht

Diese Anleitung beschreibt, wie die Stimmumeter-Anwendung für den Produktionsbetrieb vorbereitet und deployed wird.

---

## ✅ Voraussetzungen

- ✅ `npm run build` wurde bereits durchgeführt
- ✅ Build-Ordner `dist/` ist vorhanden
- ✅ Produktions-Server ist vorbereitet
- ✅ Datenbank ist konfiguriert

---

## 🔧 Schritt 1: Konfigurationsdateien vorbereiten

### 1.1 config.production.php

Die Datei `config.production.php` ist bereits vorbereitet und enthält:

- ✅ Datenbank-Konfiguration (wameli)
- ✅ Sicherheits-Einstellungen
- ✅ Performance-Optimierungen
- ✅ Logging-Konfiguration

**Wichtig:** Prüfen Sie folgende Werte:

```php
define('APP_URL', 'https://wameli.com'); // ⚠️ Anpassen falls nötig!
define('API_BASE_URL', 'https://wameli.com/api'); // ⚠️ Anpassen falls nötig!
```

### 1.2 .env.production

Erstellen Sie eine `.env.production` Datei basierend auf `.env.production.example`:

```bash
cp .env.production.example .env.production
```

Füllen Sie die Werte aus:

```env
VITE_API_BASE_URL=https://wameli.com/api
VITE_APP_URL=https://wameli.com
```

---

## 📁 Schritt 2: Dateien auf Server hochladen

### 2.1 Struktur auf dem Server

```
/var/www/html/wameli/          # Oder Ihr Web-Root-Verzeichnis
├── api/                       # PHP Backend-API
│   ├── auth.php
│   ├── db.php
│   ├── mood-entries.php
│   └── ...
├── dist/                      # Frontend Build (aus npm run build)
│   ├── index.html
│   ├── assets/
│   ├── .htaccess             # Wichtig!
│   └── _redirects
├── config.production.php      # Umbenennen zu config.php
└── logs/                     # Log-Verzeichnis (wird automatisch erstellt)
```

### 2.2 Upload-Anleitung

1. **Frontend (dist/):**
   ```bash
   # Alle Dateien aus dist/ auf Server hochladen
   # Ziel: /var/www/html/wameli/dist/
   ```

2. **Backend (api/):**
   ```bash
   # Alle PHP-Dateien aus api/ auf Server hochladen
   # Ziel: /var/www/html/wameli/api/
   ```

3. **Konfiguration:**
   ```bash
   # config.production.php hochladen
   # Auf Server umbenennen: mv config.production.php config.php
   ```

---

## 🔒 Schritt 3: Dateirechte setzen

```bash
# Web-Root-Verzeichnis
chmod 755 /var/www/html/wameli

# dist/ Verzeichnis
chmod 755 /var/www/html/wameli/dist

# .htaccess
chmod 644 /var/www/html/wameli/dist/.htaccess

# config.php (sicher!)
chmod 640 /var/www/html/wameli/config.php
chown www-data:www-data /var/www/html/wameli/config.php

# logs/ Verzeichnis
mkdir -p /var/www/html/wameli/logs
chmod 755 /var/www/html/wameli/logs
chown www-data:www-data /var/www/html/wameli/logs
```

---

## 🌐 Schritt 4: Apache-Konfiguration

### 4.1 Virtual Host einrichten

Erstellen Sie eine Apache-Konfiguration (`/etc/apache2/sites-available/wameli.conf`):

```apache
<VirtualHost *:80>
    ServerName wameli.com
    ServerAlias www.wameli.com
    
    # Redirect HTTP zu HTTPS
    Redirect permanent / https://wameli.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName wameli.com
    ServerAlias www.wameli.com
    
    DocumentRoot /var/www/html/wameli/dist
    
    # SSL-Zertifikat
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/wameli_error.log
    CustomLog ${APACHE_LOG_DIR}/wameli_access.log combined
    
    # PHP-Verarbeitung für API
    <Directory /var/www/html/wameli/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Frontend (dist/)
    <Directory /var/www/html/wameli/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # .htaccess aktivieren
    <Directory /var/www/html/wameli>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 4.2 Apache-Module aktivieren

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo a2enmod ssl
sudo systemctl restart apache2
```

---

## ✅ Schritt 5: Prüfungen

### 5.1 Frontend prüfen

1. Öffnen Sie: `https://wameli.com`
2. Prüfen Sie die Browser-Konsole auf Fehler
3. Prüfen Sie die Netzwerk-Tab auf fehlgeschlagene Requests

### 5.2 API prüfen

1. Testen Sie einen API-Endpunkt:
   ```bash
   curl https://wameli.com/api/auth.php?action=user
   ```

2. Prüfen Sie die Logs:
   ```bash
   tail -f /var/www/html/wameli/logs/php-errors.log
   ```

### 5.3 Sicherheits-Header prüfen

Verwenden Sie [SecurityHeaders.com](https://securityheaders.com) oder:

```bash
curl -I https://wameli.com
```

Prüfen Sie auf:
- ✅ `Strict-Transport-Security`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-XSS-Protection`

---

## 🔄 Schritt 6: Updates durchführen

Bei zukünftigen Updates:

1. **Lokaler Build:**
   ```bash
   npm run build
   ```

2. **Dateien hochladen:**
   - Nur geänderte Dateien aus `dist/` hochladen
   - Oder komplett neu hochladen (schneller)

3. **Cache leeren:**
   - Browser-Cache leeren
   - CDN-Cache leeren (falls verwendet)

---

## 🐛 Fehlerbehebung

### Problem: 404 Fehler bei Routen

**Lösung:** Prüfen Sie, ob `.htaccess` korrekt hochgeladen wurde und `mod_rewrite` aktiviert ist.

### Problem: API gibt Fehler zurück

**Lösung:** 
- Prüfen Sie `config.php` (Dateirechte, Pfade)
- Prüfen Sie Datenbankverbindung
- Prüfen Sie Logs: `/var/www/html/wameli/logs/php-errors.log`

### Problem: Assets werden nicht geladen

**Lösung:**
- Prüfen Sie die Pfade in `index.html`
- Prüfen Sie, ob `assets/` Ordner hochgeladen wurde
- Prüfen Sie Browser-Konsole auf 404-Fehler

---

## 📝 Checkliste

- [ ] `npm run build` durchgeführt
- [ ] `config.production.php` angepasst
- [ ] `.env.production` erstellt
- [ ] Dateien auf Server hochgeladen
- [ ] Dateirechte gesetzt
- [ ] Apache-Konfiguration eingerichtet
- [ ] SSL-Zertifikat installiert
- [ ] Frontend getestet
- [ ] API getestet
- [ ] Sicherheits-Header geprüft
- [ ] Logs überprüft

---

## 🔗 Weitere Informationen

- **Datenbank-Setup:** Siehe `DOKU/DATENBANK_SETUP.md`
- **API-Dokumentation:** Siehe `api/` Verzeichnis
- **Lokale Entwicklung:** Siehe `DOKU/ANWENDUNG_STARTEN.md`

---

**✅ Fertig!** Die Anwendung sollte jetzt im Produktionsbetrieb laufen.




