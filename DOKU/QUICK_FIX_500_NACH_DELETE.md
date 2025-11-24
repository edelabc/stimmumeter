# 🚨 Quick Fix: 500 Error nach versehentlichem Löschen

## Problem

Nach versehentlichem Löschen aller Dateien auf dem Server und erneutem Deployment:
```
GET https://wameli.com/app 500 (Internal Server Error)
GET https://wameli.com/favicon.ico 500 (Internal Server Error)
```

---

## ✅ Lösung: Dateien hochladen

### Schritt 1: Notwendige Dateien prüfen

Auf dem Server müssen folgende Dateien/Ordner vorhanden sein:

```
/public_html/ (oder /htdocs/ oder /www/)
├── .htaccess          ← WICHTIG! Muss vorhanden sein
├── index.html         ← Aus dist/
├── assets/            ← Aus dist/assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
├── api/               ← Kompletter Ordner
│   ├── db.php
│   ├── ai-configurations.php
│   └── ...
└── config.production.php
```

---

### Schritt 2: Dateien hochladen

#### Option A: Via FTP/File Manager

1. **`.htaccess` hochladen**
   - Lokale Datei: `dist/.htaccess` (wurde gerade erstellt)
   - Auf Server: Root-Verzeichnis (gleiche Ebene wie `index.html`)

2. **Frontend-Dateien hochladen**
   - `dist/index.html` → Root-Verzeichnis
   - `dist/assets/` → Root-Verzeichnis (kompletter Ordner)

3. **API-Dateien hochladen**
   - `api/` → Root-Verzeichnis (kompletter Ordner)

4. **Config-Datei hochladen**
   - `config.production.php` → Root-Verzeichnis

#### Option B: Via SSH

```bash
# 1. Auf Server verbinden
ssh user@wameli.com

# 2. Zum Web-Root navigieren
cd /var/www/html  # oder /public_html/ oder /htdocs/

# 3. Dateien hochladen (von lokalem Rechner)
# In neuem Terminal:
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter

# .htaccess hochladen
scp dist/.htaccess user@wameli.com:/var/www/html/

# Frontend-Dateien hochladen
scp -r dist/* user@wameli.com:/var/www/html/

# API-Dateien hochladen
scp -r api/ user@wameli.com:/var/www/html/

# Config-Datei hochladen
scp config.production.php user@wameli.com:/var/www/html/
```

---

### Schritt 3: Dateiberechtigungen setzen

```bash
# Auf dem Server
chmod 644 .htaccess
chmod 644 index.html
chmod 644 config.production.php
chmod 755 assets/
chmod 644 assets/*
chmod 755 api/
chmod 644 api/*.php
```

---

### Schritt 4: Verifizierung

1. **Prüfen Sie die Dateien auf dem Server:**
   ```bash
   ls -la /var/www/html/
   ```
   
   Sollte zeigen:
   - `.htaccess` ✅
   - `index.html` ✅
   - `assets/` Ordner ✅
   - `api/` Ordner ✅
   - `config.production.php` ✅

2. **Testen Sie die Website:**
   - Öffnen Sie: `https://wameli.com`
   - Sollte jetzt funktionieren!

---

## 🔍 Troubleshooting

### Problem: `.htaccess` wird nicht erkannt

**Lösung:**
- Stellen Sie sicher, dass die Datei `.htaccess` heißt (mit Punkt am Anfang)
- Prüfen Sie, ob Apache `.htaccess` Dateien erlaubt
- Prüfen Sie Apache Error-Logs: `/var/log/apache2/error.log`

### Problem: Weiterhin 500 Error

**Lösung:**
1. Prüfen Sie Apache Error-Logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```
   
2. Prüfen Sie PHP Error-Logs:
   ```bash
   tail -f /var/log/php/error.log
   ```

3. Prüfen Sie, ob `mod_rewrite` aktiviert ist:
   ```bash
   apache2ctl -M | grep rewrite
   ```
   
   Falls nicht aktiviert:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

### Problem: "Forbidden" Error

**Lösung:**
- Prüfen Sie Dateiberechtigungen (siehe Schritt 3)
- Prüfen Sie, ob der Webserver-User (meist `www-data`) Leserechte hat

---

## 📋 Checkliste

- [ ] `.htaccess` hochgeladen (im Root-Verzeichnis)
- [ ] `index.html` hochgeladen
- [ ] `assets/` Ordner hochgeladen (komplett)
- [ ] `api/` Ordner hochgeladen (komplett)
- [ ] `config.production.php` hochgeladen
- [ ] Dateiberechtigungen gesetzt
- [ ] Website getestet
- [ ] Keine 500 Errors mehr

---

## ⚠️ WICHTIG

**Die `.htaccess` Datei ist KRITISCH!**
- Ohne sie funktioniert das SPA-Routing nicht
- Ohne sie gibt es 500 Errors für alle Routes
- Sie muss im Root-Verzeichnis liegen (gleiche Ebene wie `index.html`)

