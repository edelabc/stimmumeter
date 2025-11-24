# 🚀 Deployment - Schritt für Schritt (Anfängerfreundlich)

## ✅ Schritt 1: Build erfolgreich! 

Sie haben bereits `npm run build` ausgeführt - **perfekt!** ✅

Der Build ist fertig und befindet sich im Ordner `dist/`.

---

## 📦 Schritt 2: Was wurde erstellt?

Nach dem Build finden Sie im `dist/` Ordner:

```
dist/
├── index.html                    ← Hauptdatei
├── assets/                       ← Ordner mit CSS und JS
│   ├── index-us-SgXjw.css        ← Styles
│   ├── index-ClxlLBeb.js         ← Haupt-JavaScript
│   ├── index.es-lXG0ME8t.js     ← Weitere JavaScript
│   ├── google-maps-loader-*.js   ← Google Maps
│   └── html2pdf-*.js             ← PDF-Export
└── _redirects                     ← Für Routing (Netlify)
```

**✅ Das ist alles, was Sie hochladen müssen!**

---

## 🎯 Schritt 3: Wählen Sie Ihre Deployment-Methode

Sie haben **2 Optionen**:

### Option A: Static Hosting (EMPFOHLEN für Anfänger) ⭐
- ✅ **Netlify** - Sehr einfach, kostenlos
- ✅ **Vercel** - Schnell, kostenlos
- ✅ **GitHub Pages** - Kostenlos

### Option B: Eigener Server
- FTP/SSH Upload auf Ihren Web-Server

---

## 🌐 Option A: Netlify (Einfachste Methode)

### Schritt 3.1: Netlify Account erstellen

1. Gehen Sie zu: **https://www.netlify.com**
2. Klicken Sie auf **"Sign up"** (oben rechts)
3. Wählen Sie:
   - **"Sign up with GitHub"** (empfohlen) ODER
   - **"Sign up with Email"**
4. Folgen Sie den Anweisungen

---

### Schritt 3.2: Website hochladen

**Methode 1: Drag & Drop (Schnellste)**

1. Öffnen Sie den Finder (Mac) oder Explorer (Windows)
2. Navigieren Sie zu:
   ```
   /Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist
   ```
3. **WICHTIG:** Wählen Sie den **Inhalt** des `dist/` Ordners:
   - `index.html`
   - `assets/` Ordner
   - `_redirects` Datei
4. Gehen Sie zurück zu Netlify
5. Auf der Netlify-Startseite sehen Sie einen Bereich:
   ```
   Want to deploy a new site without connecting to Git?
   Drag and drop your site output folder here
   ```
6. **Ziehen Sie die Dateien** aus dem `dist/` Ordner in diesen Bereich
7. Warten Sie, bis der Upload fertig ist (ca. 10-30 Sekunden)
8. ✅ **Fertig!** Netlify zeigt Ihnen eine URL wie: `https://random-name-123.netlify.app`

---

### Schritt 3.3: Umgebungsvariablen setzen

**WICHTIG:** Ihre App braucht Zugriff auf Supabase und Google Maps!

1. In Netlify: Klicken Sie auf **"Site settings"** (oben rechts)
2. Klicken Sie auf **"Environment variables"** (links im Menü)
3. Klicken Sie auf **"Add a variable"**
4. Fügen Sie diese Variablen hinzu (eine nach der anderen):

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: Ihre Supabase URL (z.B. `https://xxxxx.supabase.co`)

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: Ihr Supabase Anon Key

   **Variable 3:**
   - Key: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Ihr Google Maps API Key

   **Variable 4 (falls Sie Stripe verwenden):**
   - Key: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: Ihr Stripe Publishable Key

5. Klicken Sie nach jeder Variable auf **"Save"**
6. Gehen Sie zurück zu **"Deploys"** (oben)
7. Klicken Sie auf **"Trigger deploy"** → **"Clear cache and deploy site"**

---

### Schritt 3.4: Website testen

1. Öffnen Sie die URL, die Netlify Ihnen gegeben hat
2. Die Website sollte jetzt funktionieren! 🎉

---

## 🖥️ Option B: Eigener Server (FTP)

### Schritt 3.1: FTP-Programm installieren

**Empfohlene Programme:**
- **FileZilla** (kostenlos): https://filezilla-project.org
- **Cyberduck** (kostenlos): https://cyberduck.io

---

### Schritt 3.2: Mit Server verbinden

1. Öffnen Sie FileZilla (oder Cyberduck)
2. Geben Sie Ihre Server-Daten ein:
   - **Host:** `ftp.ihre-domain.de` (oder IP-Adresse)
   - **Benutzername:** Ihr FTP-Benutzername
   - **Passwort:** Ihr FTP-Passwort
   - **Port:** `21` (Standard)
3. Klicken Sie auf **"Verbinden"**

---

### Schritt 3.3: Dateien hochladen

1. **Links** (lokaler Computer): Navigieren Sie zu:
   ```
   /Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist
   ```

2. **Rechts** (Server): Navigieren Sie zu:
   ```
   public_html/     (oder www/ oder htdocs/)
   ```

3. **WICHTIG:** Wählen Sie den **Inhalt** des `dist/` Ordners:
   - Markieren Sie `index.html`
   - Markieren Sie den `assets/` Ordner
   - Markieren Sie `_redirects` (falls vorhanden)
   - Markieren Sie `.htaccess` (falls vorhanden)

4. **Ziehen Sie die Dateien** von links nach rechts
5. Warten Sie, bis der Upload fertig ist

---

### Schritt 3.4: Konfiguration hochladen

1. Laden Sie auch `config.production.php` hoch (falls Sie PHP verwenden)
2. Öffnen Sie `config.production.php` auf dem Server
3. Passen Sie die Datenbank-Credentials an:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'IhrBenutzername');
   define('DB_PASS', 'IhrPasswort');
   define('DB_NAME', 'wameli');
   ```

---

### Schritt 3.5: Umgebungsvariablen setzen

**Für Apache-Server (.htaccess):**

1. Erstellen Sie eine `.env.production` Datei im `dist/` Ordner:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ihr-anon-key
   VITE_GOOGLE_MAPS_API_KEY=ihr-google-maps-key
   ```

2. ODER: Setzen Sie die Variablen als Server-Umgebungsvariablen (cPanel/Plesk)

---

### Schritt 3.6: Website testen

1. Öffnen Sie: `https://ihre-domain.de`
2. Die Website sollte jetzt funktionieren! 🎉

---

## 📋 Checkliste

Vor dem Deployment:

- [ ] ✅ Build erstellt (`npm run build`)
- [ ] ✅ `dist/` Ordner vorhanden
- [ ] ✅ Supabase URL und Key bereit
- [ ] ✅ Google Maps API Key bereit
- [ ] ✅ Stripe Key bereit (falls verwendet)
- [ ] ✅ Datenbank erstellt (falls benötigt)

Nach dem Deployment:

- [ ] ✅ Dateien hochgeladen
- [ ] ✅ Umgebungsvariablen gesetzt
- [ ] ✅ Website erreichbar
- [ ] ✅ Keine Fehler in der Browser-Konsole (F12)

---

## 🆘 Probleme lösen

### Problem: "404 Not Found"
**Lösung:** 
- Stellen Sie sicher, dass `_redirects` oder `.htaccess` hochgeladen wurde
- Für Netlify: `_redirects` muss im Root sein
- Für Apache: `.htaccess` muss im Root sein

### Problem: "Umgebungsvariablen nicht gefunden"
**Lösung:**
- Prüfen Sie, ob die Variablen korrekt gesetzt sind
- Bei Netlify: Site Settings → Environment Variables
- Bei eigenem Server: `.env.production` Datei prüfen

### Problem: "Datenbank-Verbindungsfehler"
**Lösung:**
- Prüfen Sie `config.production.php`
- Stellen Sie sicher, dass die Datenbank erstellt wurde
- Prüfen Sie Benutzername und Passwort

### Problem: "Google Maps lädt nicht"
**Lösung:**
- Prüfen Sie den Google Maps API Key
- Stellen Sie sicher, dass die Domain in Google Cloud Console eingetragen ist

---

## 🎉 Fertig!

Ihre Website ist jetzt online! 

**Netlify:** `https://ihre-app.netlify.app`  
**Eigener Server:** `https://ihre-domain.de`

---

## 📞 Nächste Schritte

1. ✅ Testen Sie alle Funktionen
2. ✅ Prüfen Sie die Website auf verschiedenen Geräten
3. ✅ Überprüfen Sie die Performance
4. ✅ Setzen Sie ein Custom Domain (optional)

**Viel Erfolg!** 🚀


