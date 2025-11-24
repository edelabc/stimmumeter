# 📁 Verzeichnisstruktur für Deployment

## 🎯 Ziel-Struktur auf dem Server

### Option 1: Als Unterverzeichnis (empfohlen)

```
/public_html/                          # Oder /htdocs/ oder /www/
└── stimmumeter/                       # Hauptordner Ihrer Anwendung
    ├── api/                           # ← API-Ordner hier!
    │   ├── auth.php
    │   ├── db.php
    │   ├── mood-indicators.php
    │   ├── pseudonyms.php
    │   └── ... (alle anderen PHP-Dateien)
    ├── index.html                      # Frontend (aus dist/)
    ├── assets/                        # Frontend-Assets (aus dist/assets/)
    │   ├── index-xxx.js
    │   ├── index-xxx.css
    │   └── ...
    ├── config.production.php          # Konfigurationsdatei
    └── .htaccess                      # Apache-Konfiguration
```

**URLs:**
- Frontend: `https://ihre-domain.de/stimmumeter/`
- API: `https://ihre-domain.de/stimmumeter/api/auth.php`

---

### Option 2: Als Root-Verzeichnis

```
/public_html/                          # Oder /htdocs/ oder /www/
├── api/                               # ← API-Ordner hier!
│   ├── auth.php
│   ├── db.php
│   └── ...
├── index.html                         # Frontend
├── assets/                            # Frontend-Assets
├── config.production.php
└── .htaccess
```

**URLs:**
- Frontend: `https://ihre-domain.de/`
- API: `https://ihre-domain.de/api/auth.php`

---

## 📤 Konkrete Upload-Anleitung

### Schritt 1: Ordnerstruktur auf Server erstellen

**Mit FTP (FileZilla):**
1. Verbinden Sie sich mit dem Server
2. Navigieren Sie zu `/public_html/` (oder `/htdocs/` oder `/www/`)
3. Erstellen Sie Ordner `stimmumeter/` (falls nicht vorhanden)
4. Erstellen Sie darin Ordner `api/`

**Mit SSH:**
```bash
mkdir -p /path/to/public_html/stimmumeter/api
```

---

### Schritt 2: API-Dateien hochladen

**Lokaler Pfad:**
```
/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/api/
```

**Server-Pfad:**
```
/public_html/stimmumeter/api/
```

**Dateien die hochgeladen werden müssen:**
```
api/
├── admin-users.php
├── agreements.php
├── ai-configurations.php
├── assessments.php
├── auth-helper.php
├── auth.php
├── auto-setup.php
├── billing.php
├── db.php
├── legal-pages.php
├── master-data.php
├── menu-items.php
├── mood-entries.php
├── mood-indicators.php
├── payment-providers.php
├── pseudonyms.php
├── schema-migrator.php
├── session_manager.php
├── site-settings.php
├── users.php
└── test.php (optional, nur für Tests)
```

---

### Schritt 3: Frontend-Dateien hochladen

**Lokaler Pfad (nach Build):**
```
/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist/
```

**Server-Pfad:**
```
/public_html/stimmumeter/
```

**Wichtig:** Laden Sie den **Inhalt** von `dist/` hoch, nicht den Ordner selbst!

**Dateien:**
- `index.html` → `stimmumeter/index.html`
- `assets/` → `stimmumeter/assets/`
- `_redirects` → `stimmumeter/_redirects` (falls vorhanden)

---

### Schritt 4: Konfigurationsdatei hochladen

**Lokaler Pfad:**
```
/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/config.production.php
```

**Server-Pfad:**
```
/public_html/stimmumeter/config.production.php
```

**Wichtig:** Bearbeiten Sie diese Datei auf dem Server und passen Sie die Datenbank-Credentials an!

---

## 🔍 Verifizierung der Struktur

Nach dem Upload sollte die Struktur so aussehen:

```
/public_html/stimmumeter/
├── api/                    ✅ Muss existieren
│   ├── auth.php           ✅ Muss existieren
│   ├── db.php             ✅ Muss existieren
│   └── ...                ✅ Alle anderen PHP-Dateien
├── index.html             ✅ Muss existieren
├── assets/                ✅ Muss existieren
│   ├── index-xxx.js
│   └── index-xxx.css
├── config.production.php ✅ Muss existieren
└── .htaccess             ✅ Optional, aber empfohlen
```

---

## 🧪 Testen der Struktur

### Test 1: API erreichbar?

```
https://ihre-domain.de/stimmumeter/api/auth.php?action=test
```

**Erwartete Antwort:** JSON mit Status

### Test 2: Frontend erreichbar?

```
https://ihre-domain.de/stimmumeter/
```

**Erwartetes Ergebnis:** Frontend lädt

### Test 3: API-Pfad korrekt?

Öffnen Sie Browser-Konsole (F12) und prüfen Sie:
- Keine 404-Fehler für API-Aufrufe
- API-URLs sollten sein: `https://ihre-domain.de/stimmumeter/api/...`

---

## ⚠️ Häufige Fehler

### ❌ Falsch: API im falschen Ordner

```
/public_html/
├── api/              ❌ Falsch! Zu weit oben
└── stimmumeter/
    └── index.html
```

**Problem:** Frontend findet API nicht (404-Fehler)

---

### ❌ Falsch: dist-Ordner hochgeladen

```
/public_html/stimmumeter/
├── api/
└── dist/             ❌ Falsch! dist-Ordner sollte nicht existieren
    ├── index.html
    └── assets/
```

**Problem:** URLs funktionieren nicht, Frontend lädt nicht

---

### ✅ Richtig: Struktur wie oben beschrieben

```
/public_html/stimmumeter/
├── api/              ✅ Korrekt!
├── index.html        ✅ Korrekt! (aus dist/)
├── assets/           ✅ Korrekt! (aus dist/assets/)
└── config.production.php
```

---

## 📝 Zusammenfassung

**API-Ordner:**
- **Lokal:** `stimmumeter/api/`
- **Server:** `public_html/stimmumeter/api/` (oder `htdocs/stimmumeter/api/`)

**Frontend:**
- **Lokal:** `stimmumeter/dist/` (Inhalt)
- **Server:** `public_html/stimmumeter/` (Inhalt von dist/)

**Wichtig:**
- API-Ordner muss **parallel** zu `index.html` sein
- Beide müssen im **gleichen** `stimmumeter/` Ordner sein
- Die API-URL wird automatisch erkannt: `/stimmumeter/api/`

---

**Letzte Aktualisierung:** 2025-11-24

