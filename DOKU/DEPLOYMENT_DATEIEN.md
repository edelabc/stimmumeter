# 📦 Deployment - Dateien-Liste

## ✅ MUSS hochgeladen werden

### Nach `npm run build`:

```
✅ dist/                    # Kompletter Ordner (Build-Output)
   ├── index.html
   ├── assets/
   │   ├── index-*.js
   │   └── index-*.css
   └── _redirects          # Falls vorhanden
```

### Zusätzlich (falls benötigt):

```
✅ config.production.php    # Nur wenn Backend-PHP verwendet wird
✅ .htaccess                # Nur für Apache-Server
✅ _redirects               # Für Routing (SPA)
```

---

## ❌ NICHT hochladen

```
❌ node_modules/           # NICHT hochladen!
❌ src/                    # NICHT hochladen!
❌ supabase/               # NICHT hochladen!
❌ database/               # NICHT hochladen!
❌ scripts/                # NICHT hochladen!
❌ DOKU/                   # NICHT hochladen!
❌ startsite/              # NICHT hochladen!
❌ config.local.php        # NICHT hochladen!
❌ package.json            # Nur wenn Build auf Server
❌ package-lock.json       # Nur wenn Build auf Server
❌ vite.config.ts         # Nur wenn Build auf Server
❌ tsconfig.json           # Nur wenn Build auf Server
❌ .git/                   # NICHT hochladen!
❌ .env.local              # NICHT hochladen!
❌ .env.development        # NICHT hochladen!
```

---

## 🎯 Kurzfassung

**Für Static Hosting (Netlify, Vercel, etc.):**
- ✅ Nur `dist/` Ordner hochladen

**Für eigenen Server:**
- ✅ `dist/` Ordner Inhalt hochladen
- ✅ `config.production.php` hochladen (falls benötigt)

**NICHT hochladen:**
- ❌ `node_modules/`
- ❌ `src/`
- ❌ `supabase/`
- ❌ `database/`
- ❌ `scripts/`

---

## 📝 Quick Reference

| Datei/Ordner | Hochladen? | Warum? |
|--------------|------------|--------|
| `dist/` | ✅ JA | Build-Output |
| `public/` | ❌ NEIN | Wird in dist/ kopiert |
| `node_modules/` | ❌ NEIN | Zu groß, wird auf Server installiert |
| `src/` | ❌ NEIN | Source Code, wird zu dist/ gebaut |
| `supabase/` | ❌ NEIN | Nur für lokale Entwicklung |
| `database/` | ❌ NEIN | Nur für lokale Entwicklung |
| `scripts/` | ❌ NEIN | Nur für lokale Entwicklung |
| `config.production.php` | ✅ JA | Produktions-Konfiguration |
| `config.local.php` | ❌ NEIN | Lokale Konfiguration |
| `package.json` | ⚠️ OPTIONAL | Nur wenn Build auf Server |
| `.env.*` | ❌ NEIN | Als Umgebungsvariablen setzen |

---

**Einfach gesagt:** Nur `dist/` hochladen! 🚀


