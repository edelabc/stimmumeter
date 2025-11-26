# 🚀 Deployment-Anleitung - Online Deployment

## 📋 Übersicht

Diese Anleitung erklärt, welche Dateien für das Online-Deployment hochgeladen werden müssen.

---

## ✅ MUSS hochgeladen werden

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages, etc.)

**Nur diese Dateien/Ordner:**

```
✅ dist/                    # Build-Output (nach npm run build)
✅ public/                  # Statische Assets (wird in dist/ kopiert)
✅ .htaccess               # Apache-Konfiguration (falls vorhanden)
✅ _redirects              # Redirect-Regeln (falls vorhanden)
```

**Oder:** Nur den `dist/` Ordner nach dem Build!

---

### Option 2: Eigener Server (FTP/SSH)

**Diese Dateien/Ordner:**

```
✅ dist/                    # Build-Output (nach npm run build)
✅ public/                  # Statische Assets
✅ config.production.php    # Produktions-Konfiguration
✅ .htaccess               # Apache-Konfiguration (falls vorhanden)
✅ _redirects              # Redirect-Regeln (falls vorhanden)
```

**Optional (falls Build auf Server):**
```
✅ package.json            # Für npm install
✅ package-lock.json       # Für npm install
✅ vite.config.ts         # Build-Konfiguration
✅ tsconfig.json          # TypeScript-Konfiguration
✅ tailwind.config.js     # Tailwind-Konfiguration
✅ postcss.config.js      # PostCSS-Konfiguration
```

---

## ❌ NICHT hochladen

**Diese Dateien/Ordner NICHT hochladen:**

```
❌ node_modules/          # Wird auf Server installiert (npm install)
❌ src/                   # Source Code (wird zu dist/ gebaut)
❌ .git/                  # Git-Version Control
❌ .env.local             # Lokale Umgebungsvariablen
❌ .env.development       # Development-Umgebungsvariablen
❌ supabase/migrations/   # Nur für lokale Entwicklung
❌ database/              # Nur für lokale Entwicklung
❌ scripts/               # Nur für lokale Entwicklung
❌ DOKU/                  # Dokumentation (optional)
❌ startsite/             # Alte Versionen (optional)
❌ config.local.php       # Lokale Konfiguration
❌ *.md                   # README/Dokumentation (optional)
❌ tsconfig.*.json        # TypeScript-Konfiguration (nur wenn Build auf Server)
❌ eslint.config.js       # Linter-Konfiguration (nur für Development)
```

---

## 🔧 Schritt-für-Schritt Deployment

### Schritt 1: Build erstellen

```bash
# Im Projekt-Verzeichnis
npm run build
```

Dies erstellt den `dist/` Ordner mit allen optimierten Dateien.

---

### Schritt 2: Dateien hochladen

#### Für Static Hosting (Netlify, Vercel, etc.):

1. **Netlify:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Oder: Drag & Drop den `dist/` Ordner

2. **Vercel:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **GitHub Pages:**
   - Upload nur den `dist/` Ordner Inhalt
   - Oder: GitHub Actions verwenden

#### Für eigenen Server (FTP/SSH):

**Via FTP:**
1. Verbinden Sie sich mit Ihrem Server
2. Navigieren Sie zum Web-Root (z.B. `public_html/` oder `www/`)
3. Laden Sie den **Inhalt** des `dist/` Ordners hoch
4. Laden Sie `config.production.php` hoch (falls benötigt)

**Via SSH:**
```bash
# Auf Server verbinden
ssh user@your-server.com

# In Web-Root navigieren
cd /var/www/html/

# Dateien hochladen (von lokalem Rechner)
scp -r dist/* user@your-server.com:/var/www/html/
scp config.production.php user@your-server.com:/var/www/html/
```

---

### Schritt 3: Umgebungsvariablen setzen

**WICHTIG:** Setzen Sie diese Umgebungsvariablen auf dem Server:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

**Für Static Hosting:**
- Netlify: Site Settings → Environment Variables
- Vercel: Project Settings → Environment Variables

**Für eigenen Server:**
- Erstellen Sie `.env.production` Datei im `dist/` Ordner
- Oder: Setzen Sie als Server-Umgebungsvariablen

---

### Schritt 4: Datenbank einrichten

1. **MySQL-Datenbank erstellen:**
   - Verwenden Sie die SQL-Datei: `database/create-complete-database.sql`
   - Führen Sie sie in phpMyAdmin oder MySQL CLI aus

2. **Konfiguration anpassen:**
   - `config.production.php` mit Ihren Datenbank-Credentials

---

## 📁 Dateistruktur nach Upload

### Auf dem Server sollte stehen:

```
public_html/                    # Oder www/ oder htdocs/
├── index.html                 # Aus dist/
├── assets/                    # Aus dist/
│   ├── index-*.js
│   └── index-*.css
├── _redirects                # Falls vorhanden
├── .htaccess                 # Falls vorhanden
└── config.production.php     # Falls benötigt
```

---

## 🔍 Checkliste vor Deployment

- [ ] `npm run build` erfolgreich ausgeführt
- [ ] `dist/` Ordner enthält alle Dateien
- [ ] Umgebungsvariablen sind gesetzt
- [ ] Datenbank ist erstellt und konfiguriert
- [ ] `config.production.php` ist angepasst
- [ ] Google Maps API Key ist gesetzt
- [ ] Supabase Credentials sind gesetzt
- [ ] Stripe Keys sind gesetzt (falls verwendet)

---

## 🆘 Troubleshooting

### Fehler: "Cannot find module"
- **Problem:** `node_modules/` fehlt
- **Lösung:** Führen Sie `npm install` auf dem Server aus (nur wenn Build auf Server)

### Fehler: "404 Not Found"
- **Problem:** Routing funktioniert nicht
- **Lösung:** Stellen Sie sicher, dass `_redirects` oder `.htaccess` hochgeladen wurde

### Fehler: "Environment variables not found"
- **Problem:** Umgebungsvariablen fehlen
- **Lösung:** Setzen Sie die Variablen auf dem Server/Hosting-Provider

### Fehler: "Database connection failed"
- **Problem:** Datenbank-Credentials falsch
- **Lösung:** Prüfen Sie `config.production.php`

---

## 📝 Empfohlene Hosting-Provider

### Static Hosting (Empfohlen für React/Vite):
- ✅ **Netlify** - Einfach, kostenlos, automatisches Deployment
- ✅ **Vercel** - Schnell, optimiert für Vite
- ✅ **GitHub Pages** - Kostenlos, einfach
- ✅ **Cloudflare Pages** - Schnell, kostenlos

### Eigener Server:
- ✅ **cPanel** - Standard Web-Hosting
- ✅ **Plesk** - Alternative zu cPanel
- ✅ **VPS/Cloud Server** - Mehr Kontrolle

---

## 🎯 Schnellstart (Netlify)

1. Gehen Sie zu [netlify.com](https://netlify.com)
2. Klicken Sie auf "Add new site" → "Deploy manually"
3. Drag & Drop den `dist/` Ordner
4. Fertig! 🎉

---

**Die Anwendung ist jetzt online!** 🚀




