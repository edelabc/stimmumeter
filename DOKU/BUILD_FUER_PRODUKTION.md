# 🔨 Build für Produktion - Schritt für Schritt

**Datum:** 2025-01-24  
**Problem:** Gebaute Dateien enthalten noch `localhost`-URLs

---

## ⚠️ WICHTIG: Vor dem Build

Die Anwendung **MUSS** mit der Produktions-URL gebaut werden, damit keine `localhost`-Verbindungen mehr enthalten sind.

---

## ✅ Schritt 1: `.env.production` Datei erstellen

Erstellen Sie im Projekt-Root (`/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/`) eine Datei `.env.production`:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
nano .env.production
```

**Inhalt der Datei:**

```env
VITE_API_BASE_URL=https://wameli.com/api
VITE_APP_URL=https://wameli.com
VITE_USE_NEW_LANDING_PAGE=true
```

**Speichern:** `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

---

## ✅ Schritt 2: Alten Build löschen

Löschen Sie den alten `dist/` Ordner, um sicherzustellen, dass keine alten Dateien übrig bleiben:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
rm -rf dist
```

---

## ✅ Schritt 3: Anwendung für Produktion bauen

**WICHTIG:** Verwenden Sie einen der folgenden Befehle, um sicherzustellen, dass die Umgebungsvariablen verwendet werden:

### Option A: Mit `--mode production` (empfohlen)

```bash
npm run build -- --mode production
```

### Option B: Mit Umgebungsvariable direkt

```bash
VITE_API_BASE_URL=https://wameli.com/api npm run build
```

### Option C: Beide kombinieren (sicherste Methode)

```bash
VITE_API_BASE_URL=https://wameli.com/api npm run build -- --mode production
```

---

## ✅ Schritt 4: Prüfen der gebauten Dateien

Nach dem Build prüfen Sie, ob keine `localhost`-URLs mehr vorhanden sind:

```bash
# Prüfen auf localhost in gebauten Dateien
grep -r "localhost" dist/assets/*.js | head -5
```

**Erwartetes Ergebnis:** Keine Treffer (oder nur Kommentare/Code-Kommentare, keine echten URLs)

**Alternative Prüfung:**

```bash
# Prüfen, ob wameli.com enthalten ist
grep -r "wameli.com" dist/assets/*.js | head -3
```

**Erwartetes Ergebnis:** Sollte `wameli.com` finden (falls die Umgebungsvariable verwendet wurde)

---

## ✅ Schritt 5: Prüfen der API-URL-Logik

Die `getApiBaseUrl()` Funktion sollte zur Laufzeit dynamisch funktionieren. Prüfen Sie die gebaute Datei:

```bash
# Öffnen Sie eine der gebauten JS-Dateien
grep -A 10 "getApiBaseUrl\|VITE_API_BASE_URL" dist/assets/*.js | head -20
```

**Erwartetes Ergebnis:** 
- Die Funktion sollte `import.meta.env.VITE_API_BASE_URL` prüfen
- Falls gesetzt, sollte sie `https://wameli.com/api` zurückgeben
- Falls nicht gesetzt, sollte sie zur Laufzeit die aktuelle Domain verwenden

---

## ✅ Schritt 6: Auf Server hochladen

Nach erfolgreichem Build:

1. **Gesamten `dist/` Ordner hochladen:**
   ```bash
   # Lokal: dist/ Ordner komprimieren oder direkt hochladen
   # Ziel auf Server: /var/www/html/wameli/dist/ (oder Ihr Web-Root)
   ```

2. **Prüfen Sie die `.htaccess` Datei:**
   - Die `.htaccess` sollte automatisch beim Build nach `dist/` kopiert werden
   - Falls nicht, kopieren Sie sie manuell: `cp public/.htaccess dist/.htaccess`

---

## ✅ Schritt 7: Browser-Cache leeren

Nach dem Upload:

1. **Browser-Cache leeren** (siehe `CSP_FEHLER_BEHEBUNG.md`)
2. **Oder:** Öffnen Sie die Seite im Inkognito-Modus

---

## ✅ Schritt 8: Testen

1. Öffnen Sie `https://wameli.com`
2. Öffnen Sie die Browser-Konsole (F12)
3. Prüfen Sie:
   - ✅ Keine CSP-Fehler mehr
   - ✅ API-Requests zeigen auf `https://wameli.com/api/...`
   - ✅ Keine `localhost`-Verbindungen mehr

---

## 🔍 Fehlerbehebung

### Problem: Build enthält weiterhin localhost

**Lösung 1:** Prüfen Sie, ob die `.env.production` Datei existiert:
```bash
ls -la .env.production
cat .env.production
```

**Lösung 2:** Prüfen Sie, ob Vite die Datei verwendet:
```bash
# Beim Build sollten Sie sehen:
# "Using .env.production file"
```

**Lösung 3:** Verwenden Sie die Umgebungsvariable direkt:
```bash
VITE_API_BASE_URL=https://wameli.com/api npm run build
```

---

### Problem: Build schlägt fehl

**Lösung:** Prüfen Sie die Fehlermeldungen:
```bash
# Alle Abhängigkeiten installiert?
npm install

# TypeScript-Fehler?
npm run typecheck

# Linter-Fehler?
npm run lint
```

---

### Problem: API-URLs funktionieren nicht zur Laufzeit

**Lösung:** Die `getApiBaseUrl()` Funktion sollte zur Laufzeit die aktuelle Domain verwenden. Prüfen Sie:

1. Öffnen Sie die Browser-Konsole
2. Führen Sie aus: `window.location.hostname`
3. Sollte `wameli.com` sein (nicht `localhost`)

Die Funktion verwendet zur Laufzeit `window.location`, daher sollte sie automatisch die richtige Domain verwenden, auch wenn die Umgebungsvariable nicht gesetzt wurde.

---

## 📋 Checkliste

- [ ] `.env.production` Datei erstellt mit `VITE_API_BASE_URL=https://wameli.com/api`
- [ ] Alter `dist/` Ordner gelöscht
- [ ] `npm run build -- --mode production` erfolgreich durchgeführt
- [ ] Prüfung: Keine `localhost`-URLs in gebauten Dateien
- [ ] `dist/` Ordner auf Server hochgeladen
- [ ] `.htaccess` Datei ist in `dist/` vorhanden
- [ ] Browser-Cache geleert
- [ ] Website getestet - keine CSP-Fehler mehr
- [ ] API-Requests funktionieren korrekt

---

## 🎯 Zusammenfassung

**Das Problem:** Die Anwendung wurde mit lokalen Einstellungen gebaut und enthält noch `localhost`-URLs.

**Die Lösung:** 
1. `.env.production` Datei erstellen
2. Anwendung mit `--mode production` neu bauen
3. Gebaute Dateien auf Server hochladen

**Wichtig:** Nach jedem Code-Update müssen Sie die Anwendung neu bauen und die `dist/` Dateien auf den Server hochladen.

---

**✅ Fertig!** Nach diesen Schritten sollten die gebauten Dateien keine `localhost`-URLs mehr enthalten.

