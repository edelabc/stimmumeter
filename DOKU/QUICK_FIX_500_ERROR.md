# 🚨 Quick Fix: 500 Internal Server Error

## ⚡ Sofort-Lösung

### Schritt 1: `.htaccess` hochladen

**WICHTIG:** Die `.htaccess` Datei muss im **Root-Verzeichnis** liegen!

**Lokaler Pfad:**
```
stimmumeter/.htaccess
```

**Server-Pfad:**
```
/public_html/.htaccess          # Wenn Root-Verzeichnis
ODER
/public_html/stimmumeter/.htaccess   # Wenn Unterverzeichnis
```

### Schritt 2: `config.production.php` absichern

Die Datei wurde bereits aktualisiert und blockiert jetzt direkten Aufruf.

### Schritt 3: Verzeichnisstruktur prüfen

**Korrekte Struktur:**

```
/public_html/                    # Oder /htdocs/ oder /www/
├── .htaccess                   # ← MUSS HIER SEIN!
├── index.html                  # ← Frontend
├── assets/                     # ← Frontend-Assets
├── config.production.php       # ← Konfiguration
└── api/                        # ← API-Ordner
    └── ...
```

### Schritt 4: Testen

1. **Direkt testen:** `https://wameli.com/index.html`
   - Wenn das funktioniert → Routing-Problem behoben
   - Wenn das auch 500 gibt → Weiter zu Schritt 5

2. **PHP-Error-Logs prüfen:**
   - cPanel → Error Logs
   - Oder SSH: `tail -f /var/log/apache2/error.log`

---

## 🔍 Häufige Probleme

### Problem 1: `.htaccess` fehlt oder ist falsch

**Lösung:** Verwenden Sie die bereitgestellte `.htaccess` Datei

### Problem 2: `config.production.php` wird ausgeführt

**Lösung:** Die Datei wurde bereits aktualisiert und blockiert direkten Aufruf

### Problem 3: PHP-Version zu alt

**Lösung:** Prüfen Sie PHP-Version (muss 8.2+ sein)

### Problem 4: mod_rewrite nicht aktiviert

**Lösung:** Kontaktieren Sie Ihren Hosting-Provider

---

## 📋 Checkliste

- [ ] `.htaccess` hochgeladen (im Root-Verzeichnis)
- [ ] `config.production.php` aktualisiert
- [ ] `index.html` existiert
- [ ] `assets/` Ordner existiert
- [ ] PHP-Error-Logs geprüft
- [ ] Dateiberechtigungen korrekt (644 für Dateien, 755 für Ordner)

---

## 🆘 Wenn es immer noch nicht funktioniert

1. **PHP-Error-Logs prüfen** (wichtigste Quelle!)
2. **Test-Datei erstellen:** `test.php` mit `<?php phpinfo(); ?>`
3. **Hosting-Provider kontaktieren** mit Error-Log-Inhalt

---

**Erstellt:** 2025-11-24

