# ⚡ Deployment Quickstart

## 🚀 In 3 Schritten online

### Schritt 1: Build erstellen

```bash
npm run build
```

✅ Erstellt `dist/` Ordner mit allen optimierten Dateien

---

### Schritt 2: Dateien hochladen

#### Option A: Static Hosting (Netlify/Vercel) - EMPFOHLEN

**Netlify:**
1. Gehen Sie zu [netlify.com](https://netlify.com)
2. Drag & Drop den `dist/` Ordner
3. Fertig! ✅

**Vercel:**
1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Importieren Sie das Git-Repository
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Fertig! ✅

#### Option B: Eigener Server (FTP/SSH)

**Via FTP:**
1. Verbinden Sie sich mit Ihrem Server
2. Navigieren Sie zu `public_html/` oder `www/`
3. Laden Sie den **Inhalt** von `dist/` hoch:
   - `index.html`
   - `assets/` Ordner
   - `_redirects` (für Netlify)
   - `.htaccess` (für Apache)
4. Laden Sie `config.production.php` hoch (falls benötigt)

**Via SSH:**
```bash
# Von lokalem Rechner
scp -r dist/* user@your-server.com:/var/www/html/
scp config.production.php user@your-server.com:/var/www/html/
```

---

### Schritt 3: Umgebungsvariablen setzen

**WICHTIG:** Setzen Sie diese auf dem Server/Hosting:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

**Netlify:** Site Settings → Environment Variables  
**Vercel:** Project Settings → Environment Variables  
**Eigener Server:** `.env.production` Datei oder Server-Umgebungsvariablen

---

## 📦 Was hochladen?

### ✅ MUSS hochgeladen werden:

```
dist/                    # Kompletter Ordner
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css
├── _redirects          # Für Netlify
└── .htaccess           # Für Apache (wird automatisch kopiert)
```

### ❌ NICHT hochladen:

```
❌ node_modules/        # Zu groß!
❌ src/                 # Source Code
❌ supabase/           # Nur lokal
❌ database/           # Nur lokal
❌ scripts/            # Nur lokal
❌ config.local.php    # Nur lokal
```

---

## ✅ Checkliste

- [ ] `npm run build` erfolgreich
- [ ] `dist/` Ordner vorhanden
- [ ] Dateien hochgeladen
- [ ] Umgebungsvariablen gesetzt
- [ ] Datenbank erstellt (falls benötigt)
- [ ] Website funktioniert: `https://your-domain.com`

---

## 🆘 Probleme?

**404 Fehler:**  
→ `.htaccess` oder `_redirects` fehlt

**Umgebungsvariablen nicht gefunden:**  
→ Variablen auf Server setzen

**Datenbank-Fehler:**  
→ `config.production.php` prüfen

---

**Fertig! Ihre App ist jetzt online!** 🎉


