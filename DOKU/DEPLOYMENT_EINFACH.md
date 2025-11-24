# 🚀 Deployment - Super Einfach!

## ✅ Sie haben bereits den Build erstellt - Perfekt!

Der Build ist fertig im Ordner `dist/`.

---

## 🎯 Was Sie jetzt machen müssen:

### **Option 1: Netlify (EMPFOHLEN - Am einfachsten!)** ⭐

#### Schritt 1: Gehen Sie zu Netlify
👉 **https://www.netlify.com**

#### Schritt 2: Account erstellen
- Klicken Sie auf **"Sign up"**
- Wählen Sie **"Sign up with Email"** oder **"Sign up with GitHub"**

#### Schritt 3: Website hochladen
1. Auf der Netlify-Startseite sehen Sie einen großen Bereich:
   ```
   "Want to deploy a new site without connecting to Git?
    Drag and drop your site output folder here"
   ```

2. Öffnen Sie den Finder (Mac) oder Explorer (Windows)

3. Gehen Sie zu diesem Ordner:
   ```
   /Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist
   ```

4. **WICHTIG:** Öffnen Sie den `dist/` Ordner und wählen Sie **alle Dateien** aus:
   - `index.html`
   - `assets/` Ordner (ganzer Ordner)
   - `_redirects` (falls vorhanden)

5. **Ziehen Sie diese Dateien** in den Netlify-Bereich

6. Warten Sie 10-30 Sekunden...

7. ✅ **FERTIG!** Sie erhalten eine URL wie: `https://xyz-123.netlify.app`

#### Schritt 4: Umgebungsvariablen setzen (WICHTIG!)

1. In Netlify: Klicken Sie auf **"Site settings"** (oben rechts)

2. Klicken Sie auf **"Environment variables"** (links)

3. Fügen Sie diese 3 Variablen hinzu:

   **Variable 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://xxxxx.supabase.co
   ```
   → Klicken Sie auf "Save"

   **Variable 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: Ihr Supabase Anon Key
   ```
   → Klicken Sie auf "Save"

   **Variable 3:**
   ```
   Key: VITE_GOOGLE_MAPS_API_KEY
   Value: Ihr Google Maps API Key
   ```
   → Klicken Sie auf "Save"

4. Gehen Sie zurück zu **"Deploys"**

5. Klicken Sie auf **"Trigger deploy"** → **"Clear cache and deploy site"**

6. ✅ **FERTIG!** Ihre Website funktioniert jetzt!

---

### **Option 2: Eigener Server (FTP)**

#### Schritt 1: FileZilla installieren
👉 **https://filezilla-project.org** (kostenlos)

#### Schritt 2: Mit Server verbinden
1. Öffnen Sie FileZilla
2. Geben Sie ein:
   - **Host:** `ftp.ihre-domain.de`
   - **Benutzername:** Ihr FTP-User
   - **Passwort:** Ihr FTP-Passwort
   - **Port:** `21`
3. Klicken Sie auf **"Verbinden"**

#### Schritt 3: Dateien hochladen
1. **Links:** Gehen Sie zu `dist/` Ordner
2. **Rechts:** Gehen Sie zu `public_html/` (oder `www/`)
3. **Wählen Sie aus:**
   - `index.html`
   - `assets/` Ordner
   - `_redirects`
   - `.htaccess`
4. **Ziehen Sie** die Dateien von links nach rechts
5. ✅ **FERTIG!**

---

## 📋 Checkliste

- [ ] ✅ Build erstellt (`npm run build`)
- [ ] ✅ Dateien hochgeladen
- [ ] ✅ Umgebungsvariablen gesetzt
- [ ] ✅ Website getestet

---

## 🆘 Hilfe bei Problemen

**404 Fehler?**  
→ `.htaccess` oder `_redirects` fehlt

**Umgebungsvariablen nicht gefunden?**  
→ Variablen in Netlify/Server setzen

**Datenbank-Fehler?**  
→ `config.production.php` prüfen

---

**Das war's! Ihre Website ist jetzt online!** 🎉

