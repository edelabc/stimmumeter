# ✅ Upload-Checkliste für wameli.com

## 📤 Dateien die hochgeladen werden MÜSSEN

### 1. `.htaccess` (WICHTIG!)

**Lokaler Pfad:**
```
stimmumeter/.htaccess
```

**Server-Pfad:**
```
/public_html/.htaccess
```

**WICHTIG:** Diese Datei muss im **Root-Verzeichnis** liegen, nicht in `stimmumeter/`!

---

### 2. Frontend-Dateien (aus `dist/`)

**Lokaler Pfad:**
```
stimmumeter/dist/index.html
stimmumeter/dist/assets/
```

**Server-Pfad:**
```
/public_html/index.html
/public_html/assets/
```

**WICHTIG:** Laden Sie den **Inhalt** von `dist/` hoch, nicht den `dist/`-Ordner selbst!

---

### 3. API-Ordner

**Lokaler Pfad:**
```
stimmumeter/api/          # Kompletter Ordner
```

**Server-Pfad:**
```
/public_html/api/         # Kompletter Ordner
```

**Dateien im api/ Ordner:**
- auth.php
- db.php
- mood-indicators.php
- pseudonyms.php
- mood-entries.php
- ... (alle anderen PHP-Dateien)

---

### 4. Konfigurationsdatei

**Lokaler Pfad:**
```
stimmumeter/config.production.php
```

**Server-Pfad:**
```
/public_html/config.production.php
```

**WICHTIG:** Nach dem Upload die Datenbank-Credentials anpassen!

---

## 📁 Finale Struktur auf Server

```
/public_html/
├── .htaccess              ✅ MUSS SEIN!
├── index.html             ✅ Frontend
├── assets/                ✅ Frontend-Assets
│   ├── index-xxx.js
│   └── index-xxx.css
├── config.production.php  ✅ Konfiguration
└── api/                   ✅ API-Ordner
    ├── auth.php
    ├── db.php
    └── ... (alle PHP-Dateien)
```

---

## ⚠️ Häufige Fehler

### ❌ Falsch: dist-Ordner hochgeladen

```
/public_html/
└── dist/              ❌ Falsch!
    ├── index.html
    └── assets/
```

**Problem:** URLs funktionieren nicht

---

### ❌ Falsch: .htaccess im falschen Ordner

```
/public_html/
├── stimmumeter/
│   └── .htaccess      ❌ Falsch! Zu tief verschachtelt
└── index.html
```

**Problem:** Apache findet .htaccess nicht

---

### ✅ Richtig: Struktur wie oben

```
/public_html/
├── .htaccess          ✅ Korrekt!
├── index.html         ✅ Korrekt!
├── assets/            ✅ Korrekt!
└── api/               ✅ Korrekt!
```

---

## 🔧 Nach dem Upload

1. **Dateiberechtigungen setzen:**
   ```bash
   chmod 644 .htaccess
   chmod 644 index.html
   chmod 644 config.production.php
   chmod 755 api/
   chmod 644 api/*.php
   chmod 755 assets/
   chmod 644 assets/*
   ```

2. **config.production.php anpassen:**
   - Datenbank-Credentials prüfen
   - APP_URL prüfen

3. **Testen:**
   - `https://wameli.com/` → Sollte Frontend zeigen
   - `https://wameli.com/api/auth.php?action=test` → Sollte JSON zurückgeben

---

**Erstellt:** 2025-11-24

