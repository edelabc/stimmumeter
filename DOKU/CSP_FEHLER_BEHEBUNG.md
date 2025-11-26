# 🔧 CSP-Fehler Behebung - Schritt für Schritt

**Datum:** 2025-01-24  
**Problem:** Content Security Policy blockiert API-Aufrufe auf wameli.com

---

## 🔍 Problem-Analyse

Die Fehlermeldungen zeigen:
- Die Anwendung versucht auf `http://localhost/stimmumeter/api/...` zuzugreifen
- Die CSP (Content Security Policy) erlaubt nur `'self'` und blockiert localhost-Verbindungen
- Die gebaute JavaScript-Datei enthält noch localhost-URLs

**Ursache:** Die Anwendung wurde mit lokalen Einstellungen gebaut und muss für Produktion neu gebaut werden.

---

## ✅ Lösung - Schritt für Schritt

### Schritt 1: `.env.production` Datei erstellen

Erstellen Sie im Projekt-Root eine Datei `.env.production` mit folgendem Inhalt:

```env
# API Base URL für Produktion
VITE_API_BASE_URL=https://wameli.com/api

# App URL für Produktion
VITE_APP_URL=https://wameli.com

# Landing Page Version
VITE_USE_NEW_LANDING_PAGE=true
```

**Wichtig:** Diese Datei wird beim Build automatisch verwendet, wenn Sie `npm run build` mit dem `--mode production` Flag ausführen.

---

### Schritt 2: Anwendung für Produktion neu bauen

Führen Sie im Projekt-Root folgende Befehle aus:

```bash
# 1. Sicherstellen, dass alle Abhängigkeiten installiert sind
npm install

# 2. Anwendung für Produktion bauen
npm run build -- --mode production
```

**Hinweis:** Der `--mode production` Parameter stellt sicher, dass Vite die `.env.production` Datei verwendet.

**Alternative:** Falls der `--mode` Parameter nicht funktioniert, können Sie auch direkt die Umgebungsvariable setzen:

```bash
# Linux/macOS
VITE_API_BASE_URL=https://wameli.com/api npm run build

# Windows (PowerShell)
$env:VITE_API_BASE_URL="https://wameli.com/api"; npm run build
```

---

### Schritt 3: Prüfen der gebauten Dateien

Nach dem Build sollten Sie prüfen, ob die API-URLs korrekt sind:

1. Öffnen Sie die Datei `dist/assets/index-*.js` (die Dateinamen ändern sich bei jedem Build)
2. Suchen Sie nach `localhost` - es sollten KEINE localhost-URLs mehr vorhanden sein
3. Stattdessen sollten Sie `https://wameli.com/api` finden

**Tipp:** Sie können auch in der Browser-Konsole prüfen, welche URL verwendet wird:
- Öffnen Sie die Entwicklertools (F12)
- Gehen Sie zum Tab "Network"
- Laden Sie die Seite neu
- Prüfen Sie die API-Requests - sie sollten auf `https://wameli.com/api/...` zeigen

---

### Schritt 4: Aktualisierte Dateien auf Server hochladen

Laden Sie folgende Dateien/Ordner auf den Server hoch:

1. **Gesamten `dist/` Ordner** (ersetzt den alten)
   - Ziel: `/var/www/html/wameli/dist/` (oder Ihr Web-Root)
   - Wichtig: Die `.htaccess` Datei ist bereits aktualisiert und erlaubt die Domain

2. **Prüfen Sie die `.htaccess` Datei**
   - Die Datei `public/.htaccess` wurde bereits angepasst
   - Sie sollte automatisch beim Build nach `dist/` kopiert werden
   - Falls nicht, kopieren Sie sie manuell: `cp public/.htaccess dist/.htaccess`

---

### Schritt 5: Browser-Cache leeren

Nach dem Upload müssen Sie den Browser-Cache leeren:

**Chrome/Edge:**
- Drücken Sie `Ctrl+Shift+Delete` (Windows) oder `Cmd+Shift+Delete` (Mac)
- Wählen Sie "Cached images and files"
- Klicken Sie auf "Clear data"

**Firefox:**
- Drücken Sie `Ctrl+Shift+Delete` (Windows) oder `Cmd+Shift+Delete` (Mac)
- Wählen Sie "Cache"
- Klicken Sie auf "Clear Now"

**Oder:** Öffnen Sie die Seite im Inkognito/Privat-Modus, um den Cache zu umgehen.

---

### Schritt 6: Prüfung

1. **Öffnen Sie die Website:** `https://wameli.com`
2. **Öffnen Sie die Browser-Konsole** (F12)
3. **Prüfen Sie auf Fehler:**
   - Es sollten KEINE CSP-Fehler mehr erscheinen
   - API-Requests sollten auf `https://wameli.com/api/...` zeigen
   - Keine `localhost`-Verbindungen mehr

4. **Testen Sie die Funktionalität:**
   - Login/Registrierung
   - Mood-Einträge erstellen
   - Agreements laden

---

## 🔍 Fehlerbehebung

### Problem: CSP-Fehler bestehen weiterhin

**Lösung 1:** Prüfen Sie, ob die `.htaccess` Datei korrekt hochgeladen wurde:
```bash
# Auf dem Server prüfen
cat /var/www/html/wameli/dist/.htaccess | grep "Content-Security-Policy"
```

**Lösung 2:** Prüfen Sie die Apache-Konfiguration:
- `mod_headers` muss aktiviert sein: `sudo a2enmod headers`
- Apache neu starten: `sudo systemctl restart apache2`

**Lösung 3:** Prüfen Sie, ob die gebaute JavaScript-Datei die korrekte URL enthält:
```bash
# Auf dem Server
grep -r "localhost" /var/www/html/wameli/dist/assets/
# Sollte keine Ergebnisse liefern
```

---

### Problem: API-Requests schlagen weiterhin fehl

**Lösung 1:** Prüfen Sie die Netzwerk-Tab in den Browser-Entwicklertools:
- Welche URL wird verwendet?
- Welcher HTTP-Status-Code wird zurückgegeben?

**Lösung 2:** Prüfen Sie die Server-Logs:
```bash
tail -f /var/www/html/wameli/logs/php-errors.log
```

**Lösung 3:** Testen Sie die API direkt:
```bash
curl https://wameli.com/api/auth.php?action=user
```

---

### Problem: Build schlägt fehl

**Lösung:** Prüfen Sie die Fehlermeldungen im Terminal:
- Sind alle Abhängigkeiten installiert? → `npm install`
- Gibt es TypeScript-Fehler? → `npm run typecheck`
- Gibt es Linter-Fehler? → `npm run lint`

---

## 📋 Checkliste

- [ ] `.env.production` Datei erstellt mit `VITE_API_BASE_URL=https://wameli.com/api`
- [ ] `npm run build -- --mode production` erfolgreich durchgeführt
- [ ] Gebaute JavaScript-Dateien enthalten keine `localhost`-URLs mehr
- [ ] `dist/` Ordner komplett auf Server hochgeladen
- [ ] `.htaccess` Datei ist in `dist/` vorhanden
- [ ] Browser-Cache geleert
- [ ] Website getestet - keine CSP-Fehler mehr
- [ ] API-Requests funktionieren korrekt

---

## 🎯 Zusammenfassung

Das Problem wurde durch folgende Änderungen behoben:

1. ✅ **CSP in `.htaccess` angepasst** - erlaubt jetzt die aktuelle Domain dynamisch
2. ✅ **`.env.production` Datei** - muss manuell erstellt werden (siehe Schritt 1)
3. ✅ **Anwendung neu bauen** - mit Produktions-URLs (siehe Schritt 2)
4. ✅ **Dateien hochladen** - neue Build-Dateien auf Server (siehe Schritt 4)

**Wichtig:** Nach jedem Code-Update müssen Sie die Anwendung neu bauen und die `dist/` Dateien auf den Server hochladen.

---

**✅ Fertig!** Nach diesen Schritten sollten die CSP-Fehler behoben sein.



