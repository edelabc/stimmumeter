# 📤 FileZilla Deployment - Schritt für Schritt

## 🎯 Übersicht

Diese Anleitung zeigt Ihnen genau, wie Sie Ihre Website mit FileZilla auf Ihren Server hochladen.

---

## 📥 Schritt 1: FileZilla installieren

### 1.1 FileZilla herunterladen

1. Gehen Sie zu: **https://filezilla-project.org**
2. Klicken Sie auf **"Download FileZilla Client"**
3. Wählen Sie Ihre Version:
   - **Mac:** "Download FileZilla Client for macOS"
   - **Windows:** "Download FileZilla Client for Windows"
4. Laden Sie die Datei herunter

### 1.2 FileZilla installieren

**Mac:**
1. Öffnen Sie die heruntergeladene `.dmg` Datei
2. Ziehen Sie FileZilla in den Applications-Ordner
3. Öffnen Sie FileZilla aus dem Applications-Ordner

**Windows:**
1. Öffnen Sie die heruntergeladene `.exe` Datei
2. Folgen Sie dem Installations-Assistenten
3. Öffnen Sie FileZilla

---

## 🔌 Schritt 2: Mit Ihrem Server verbinden

### 2.1 FileZilla öffnen

Nach dem Öffnen sehen Sie FileZilla mit zwei Bereichen:

```
┌─────────────────────────────────────────┐
│  Host: [                    ]           │
│  Username: [                ]           │
│  Password: [                ]           │
│  Port: [21]                             │
│  [Quickconnect]                         │
└─────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐
│ Lokale Site  │  │ Remote Site  │
│ (Ihr PC)     │  │ (Server)     │
└──────────────┘  ┌──────────────┘
```

### 2.2 Server-Daten eingeben

**Sie benötigen diese Informationen von Ihrem Hosting-Provider:**

1. **Host:** 
   - Meist: `ftp.ihre-domain.de` ODER
   - `ftp.ihre-domain.com` ODER
   - Eine IP-Adresse wie `123.456.789.012`

2. **Benutzername:**
   - Ihr FTP-Benutzername (meist ähnlich wie Ihre Domain)

3. **Passwort:**
   - Ihr FTP-Passwort

4. **Port:**
   - Meist `21` (Standard-FTP)
   - Oder `22` (SFTP)

**Wo finde ich diese Daten?**

- **cPanel:** cPanel → "FTP Accounts"
- **Plesk:** Websites & Domains → "FTP Access"
- **E-Mail vom Hosting-Provider:** Meist in der Willkommens-E-Mail

### 2.3 Verbindung herstellen

1. Geben Sie die Daten oben in FileZilla ein:
   ```
   Host: ftp.ihre-domain.de
   Username: ihr-benutzername
   Password: ihr-passwort
   Port: 21
   ```

2. Klicken Sie auf **"Quickconnect"**

3. **Warten Sie...** FileZilla verbindet sich jetzt

4. ✅ **Erfolg!** Sie sehen jetzt:
   - **Links:** Ihre lokalen Dateien
   - **Rechts:** Dateien auf dem Server

---

## 📁 Schritt 3: Ordner finden

### 3.1 Lokaler Ordner (links)

**Navigieren Sie zu Ihrem `dist/` Ordner:**

1. **Links oben** sehen Sie einen Pfad wie:
   ```
   /Users/IhrName/...
   ```

2. Klicken Sie auf das **Ordner-Symbol** oder navigieren Sie manuell zu:
   ```
   /Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist
   ```

3. **Tipp:** Sie können auch den Pfad oben eingeben und Enter drücken

4. ✅ Sie sollten jetzt sehen:
   ```
   dist/
   ├── index.html
   ├── assets/
   └── _redirects
   ```

### 3.2 Server-Ordner (rechts)

**Navigieren Sie zum Web-Root:**

1. **Rechts oben** sehen Sie einen Pfad wie:
   ```
   /home/username/...
   ```

2. Navigieren Sie zu einem dieser Ordner:
   - `public_html/` ← **Meist dieser!**
   - `www/`
   - `htdocs/`
   - `httpdocs/`

3. **Tipp:** Der Ordner heißt oft wie Ihre Domain oder "public_html"

4. ✅ Sie sollten jetzt einen **leeren** oder fast leeren Ordner sehen

---

## 📤 Schritt 4: Dateien hochladen

### 4.1 Dateien auswählen

**WICHTIG:** Wählen Sie den **Inhalt** des `dist/` Ordners aus!

1. **Links** (Ihr Computer): Stellen Sie sicher, dass Sie **im** `dist/` Ordner sind

2. **Wählen Sie diese Dateien/Ordner aus:**
   - ✅ `index.html` (klicken Sie darauf)
   - ✅ `assets/` Ordner (klicken Sie darauf)
   - ✅ `_redirects` Datei (falls vorhanden)
   - ✅ `.htaccess` Datei (falls vorhanden)

   **Tipp:** Halten Sie `Cmd` (Mac) oder `Strg` (Windows) gedrückt, um mehrere Dateien auszuwählen

### 4.2 Dateien hochladen

**Methode 1: Drag & Drop (Einfachste)**

1. **Markieren Sie** die Dateien links (wie oben beschrieben)

2. **Ziehen Sie** die markierten Dateien von **links nach rechts**

3. Lassen Sie die Dateien über dem **rechten Bereich** (Server) los

4. ✅ FileZilla beginnt jetzt mit dem Upload

**Methode 2: Rechtsklick-Menü**

1. **Markieren Sie** die Dateien links

2. **Rechtsklick** auf die markierten Dateien

3. Wählen Sie **"Upload"**

4. ✅ FileZilla beginnt jetzt mit dem Upload

### 4.3 Upload überwachen

**Unten in FileZilla** sehen Sie den Upload-Status:

```
┌─────────────────────────────────────────┐
│ Queued files: 5                          │
│ Successful transfers: 3                  │
│ Failed transfers: 0                      │
│ [Datei1.html] 100%                      │
│ [Datei2.js] 75%                         │
└─────────────────────────────────────────┘
```

**Warten Sie**, bis alle Dateien hochgeladen sind!

**✅ Fertig, wenn:**
- "Successful transfers" = Anzahl der Dateien
- "Failed transfers" = 0
- Keine Dateien mehr in der Warteschlange

---

## ⚙️ Schritt 5: Konfiguration hochladen

### 5.1 config.production.php hochladen

1. **Links:** Navigieren Sie zum Hauptverzeichnis:
   ```
   /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
   ```

2. **Suchen Sie** die Datei `config.production.php`

3. **Rechts:** Stellen Sie sicher, dass Sie im gleichen Ordner sind wie `index.html`

4. **Ziehen Sie** `config.production.php` von links nach rechts

5. ✅ Datei ist hochgeladen

### 5.2 config.production.php anpassen

**WICHTIG:** Passen Sie die Datenbank-Credentials an!

1. **Rechts:** Suchen Sie `config.production.php` auf dem Server

2. **Rechtsklick** auf `config.production.php`

3. Wählen Sie **"View/Edit"**

4. FileZilla öffnet die Datei in einem Editor

5. **Passen Sie diese Zeilen an:**
   ```php
   define('DB_HOST', 'localhost');        // Meist "localhost"
   define('DB_USER', 'IhrBenutzername');  // Ihr MySQL-Benutzername
   define('DB_PASS', 'IhrPasswort');      // Ihr MySQL-Passwort
   define('DB_NAME', 'wameli');           // Datenbank-Name
   define('DB_PORT', 3306);                // Meist 3306
   ```

6. **Speichern Sie** die Datei (`Cmd+S` oder `Strg+S`)

7. FileZilla fragt: **"File has been modified, upload changes to server?"**
   - Klicken Sie auf **"Yes"**

---

## 🌐 Schritt 6: Umgebungsvariablen setzen

### Option A: .env.production Datei erstellen

1. **Erstellen Sie** eine neue Datei namens `.env.production` auf Ihrem Computer

2. **Fügen Sie** diese Zeilen ein:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ihr-anon-key
   VITE_GOOGLE_MAPS_API_KEY=ihr-google-maps-key
   VITE_STRIPE_PUBLISHABLE_KEY=ihr-stripe-key
   ```

3. **Ersetzen Sie** die Platzhalter mit Ihren echten Keys

4. **Laden Sie** die Datei auf den Server hoch (wie in Schritt 4)

### Option B: cPanel/Plesk Umgebungsvariablen

**Falls Sie cPanel haben:**

1. Gehen Sie zu cPanel → **"Environment Variables"**

2. Fügen Sie die Variablen hinzu:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`

---

## ✅ Schritt 7: Website testen

### 7.1 Dateien prüfen

**Rechts in FileZilla** sollten Sie jetzt sehen:

```
public_html/ (oder www/)
├── index.html
├── assets/
│   ├── index-ClxlLBeb.js
│   ├── index-us-SgXjw.css
│   └── ...
├── _redirects
├── .htaccess (falls vorhanden)
└── config.production.php
```

### 7.2 Website öffnen

1. Öffnen Sie Ihren Browser

2. Geben Sie ein: **`https://ihre-domain.de`**

3. ✅ **Die Website sollte jetzt funktionieren!**

### 7.3 Fehler prüfen

**Falls etwas nicht funktioniert:**

1. **Öffnen Sie die Browser-Konsole:**
   - Mac: `Cmd + Option + I`
   - Windows: `F12`

2. **Prüfen Sie auf Fehler:**
   - Rote Fehlermeldungen?
   - "404 Not Found"?
   - "Umgebungsvariablen nicht gefunden"?

3. **Siehe Troubleshooting unten**

---

## 🆘 Troubleshooting

### Problem: "Connection refused" oder "Could not connect"

**Lösung:**
- Prüfen Sie Host, Benutzername und Passwort
- Prüfen Sie den Port (21 für FTP, 22 für SFTP)
- Prüfen Sie Ihre Firewall-Einstellungen
- Kontaktieren Sie Ihren Hosting-Provider

### Problem: "Permission denied"

**Lösung:**
- Stellen Sie sicher, dass Sie im richtigen Ordner sind (`public_html/`)
- Prüfen Sie die Dateiberechtigungen (Rechtsklick → File permissions)
- Setzen Sie Ordner auf `755` und Dateien auf `644`

### Problem: "404 Not Found" auf der Website

**Lösung:**
- Stellen Sie sicher, dass `index.html` im Root-Ordner ist
- Prüfen Sie, ob `.htaccess` hochgeladen wurde
- Prüfen Sie die `.htaccess` Datei auf Fehler

### Problem: "Umgebungsvariablen nicht gefunden"

**Lösung:**
- Stellen Sie sicher, dass `.env.production` hochgeladen wurde
- Prüfen Sie, ob die Variablen korrekt geschrieben sind
- Bei cPanel: Setzen Sie die Variablen als Server-Umgebungsvariablen

### Problem: Dateien werden nicht hochgeladen

**Lösung:**
- Prüfen Sie die Verbindung (oben in FileZilla)
- Stellen Sie sicher, dass genug Speicherplatz vorhanden ist
- Prüfen Sie die Dateiberechtigungen

---

## 📋 Checkliste

Vor dem Upload:
- [ ] ✅ FileZilla installiert
- [ ] ✅ Server-Daten bereit (Host, User, Passwort)
- [ ] ✅ `dist/` Ordner vorhanden
- [ ] ✅ Supabase Keys bereit
- [ ] ✅ Google Maps API Key bereit

Während des Uploads:
- [ ] ✅ Mit Server verbunden
- [ ] ✅ Lokaler `dist/` Ordner gefunden
- [ ] ✅ Server `public_html/` Ordner gefunden
- [ ] ✅ Dateien ausgewählt
- [ ] ✅ Upload gestartet
- [ ] ✅ Upload erfolgreich abgeschlossen

Nach dem Upload:
- [ ] ✅ `config.production.php` hochgeladen und angepasst
- [ ] ✅ Umgebungsvariablen gesetzt
- [ ] ✅ Website getestet
- [ ] ✅ Keine Fehler in Browser-Konsole

---

## 🎉 Fertig!

Ihre Website ist jetzt online unter: **`https://ihre-domain.de`**

**Viel Erfolg!** 🚀

---

## 💡 Tipps

- **Speichern Sie die Verbindung:** In FileZilla: File → Site Manager → "New Site" → Daten eingeben → "OK"
- **Backup erstellen:** Laden Sie regelmäßig Backups der Website herunter
- **Dateiberechtigungen:** Ordner = 755, Dateien = 644


