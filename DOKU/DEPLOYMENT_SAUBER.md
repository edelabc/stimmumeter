# 🧹 Sauberes Deployment - Alte Dateien vermeiden

## Problem

Nach jedem Build entstehen neue Dateien mit anderen Hash-Namen:
- Alter Build: `index-C2Hr6jlK.js`
- Neuer Build: `index-koSnDHWQ.js`

Auf dem Server sammeln sich dadurch alte Dateien an, die nicht mehr benötigt werden.

---

## ✅ Lösung: Sauberes Deployment

### Methode 1: Manuell (FTP/File Manager)

**Schritt 1: Alte Dateien löschen**
1. Auf dem Server zum `assets/` Ordner navigieren
2. **Alle Dateien** im `assets/` Ordner löschen
3. **NICHT** den Ordner selbst löschen!

**Schritt 2: Neue Dateien hochladen**
1. Lokalen `dist/assets/` Ordner öffnen
2. **Alle Dateien** auf den Server hochladen

---

### Methode 2: Automatisiert (SSH)

**Verwendung des Deployment-Scripts:**

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter

# Build erstellen
npm run build -- --mode production

# Deployment-Script ausführen
./scripts/deploy-to-production.sh [user] [host] [path]

# Beispiel:
./scripts/deploy-to-production.sh user wameli.com /var/www/html
```

**Was das Script macht:**
1. ✅ Prüft ob Build vorhanden ist
2. ✅ Löscht alte Dateien auf dem Server
3. ✅ Lädt neue Dateien hoch
4. ✅ Lädt API-Dateien hoch (falls geändert)

---

### Methode 3: Via SSH manuell

```bash
# 1. Build erstellen
npm run build -- --mode production

# 2. Auf Server verbinden
ssh user@wameli.com

# 3. Alte Dateien löschen
cd /var/www/html
rm -rf assets/*

# 4. Neue Dateien hochladen (von lokalem Rechner)
# In neuem Terminal:
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
scp -r dist/* user@wameli.com:/var/www/html/
```

---

## 📋 Checkliste für sauberes Deployment

- [ ] Lokalen Build erstellt (`npm run build`)
- [ ] Alte Dateien auf Server gelöscht (`assets/*`)
- [ ] Neue Dateien hochgeladen (`dist/*`)
- [ ] `index.html` aktualisiert
- [ ] API-Dateien aktualisiert (falls geändert)
- [ ] Browser-Cache geleert (Strg+F5)

---

## ⚠️ WICHTIG

**NICHT löschen:**
- ❌ `assets/` Ordner selbst (nur Inhalt)
- ❌ `.htaccess` Dateien
- ❌ `config.production.php`

**IMMER löschen vor Upload:**
- ✅ Alle `.js` Dateien in `assets/`
- ✅ Alle `.css` Dateien in `assets/`
- ✅ Alte `index.html` (wird durch neue ersetzt)

---

## 🔍 Warum ändern sich die Dateinamen?

Die Hash-Namen basieren auf dem Dateiinhalt:
- **Gleicher Code** → gleicher Hash
- **Geänderter Code** → neuer Hash

Das ist **gewollt** und hilft beim Caching:
- Browser laden neue Dateien automatisch
- Alte Dateien werden nicht mehr verwendet
- Cache-Invalidierung funktioniert automatisch

---

## 💡 Tipp: .htaccess für automatische Bereinigung

Falls Sie Apache verwenden, können Sie eine `.htaccess` Regel hinzufügen, die alte Dateien nach X Tagen automatisch löscht (erfordert Cron-Job).

Für die meisten Fälle reicht es aber, vor jedem Deployment die alten Dateien manuell zu löschen.



