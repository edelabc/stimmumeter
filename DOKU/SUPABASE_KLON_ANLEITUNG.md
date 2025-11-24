# 🔄 Supabase zu MySQL Klon-Anleitung

## 📋 Übersicht

Diese Anleitung zeigt, wie Sie alle Daten aus Supabase in Ihre lokale MySQL-Datenbank klonen können.

---

## 🎯 Warum klonen?

- **Supabase nicht erreichbar:** Falls Ihr Supabase-Projekt gelöscht oder pausiert wurde
- **Lokale Entwicklung:** Arbeiten Sie lokal ohne Internet-Verbindung
- **Backup:** Erstellen Sie ein lokales Backup Ihrer Daten
- **Migration:** Wechseln Sie von Supabase zu MySQL

---

## 🚀 Methode 1: Automatisches Klonen (Empfohlen)

### Schritt 1: Supabase-Credentials prüfen

Erstellen Sie eine `.env` Datei im Projekt-Root (falls nicht vorhanden):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Wo finde ich die Credentials?**
- Falls Supabase erreichbar: Dashboard → Settings → API
- Falls nicht erreichbar: Prüfen Sie alte `.env` Dateien oder Konfigurationsdateien

### Schritt 2: Script ausführen

**Option A: Im Terminal**
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
php scripts/clone-supabase-to-mysql.php
```

**Option B: Im Browser**
```
http://localhost/stimmumeter/scripts/clone-supabase-to-mysql.php
```

### Schritt 3: Ergebnis prüfen

Das Script zeigt:
- ✅ Anzahl eingefügter Datensätze
- 🔄 Anzahl aktualisierter Datensätze
- ❌ Fehler (falls vorhanden)

**Dann in phpMyAdmin prüfen:**
```
http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=wameli&table=t_vereinbarungen
```

---

## 📥 Methode 2: Manueller JSON-Import

Falls Supabase nicht erreichbar ist, können Sie Daten manuell importieren:

### Schritt 1: Daten aus Browser exportieren

1. Öffnen Sie die Admin-Oberfläche: `http://localhost:5173/admin`
2. Öffnen Sie die Browser-Entwicklertools (F12)
3. Gehen Sie zu **Network** Tab
4. Laden Sie die Vereinbarungen neu
5. Suchen Sie nach API-Aufrufen zu Supabase
6. Kopieren Sie die JSON-Antworten

### Schritt 2: JSON-Datei erstellen

Erstellen Sie: `backups/supabase_export.json`

```json
{
  "t_vereinbarungen": [
    {
      "id": "...",
      "titel_id": "...",
      "inhalt": "...",
      ...
    }
  ],
  "t_vereinbarungstitel": [...],
  "menu_items": [...],
  "footer_menu_items": [...]
}
```

### Schritt 3: Import ausführen

```bash
php scripts/import-supabase-json.php
```

---

## 🔍 Welche Tabellen werden geklont?

Das Script klont folgende Tabellen:

1. **`t_vereinbarungstitel`** - Dokumententitel
2. **`t_vereinbarungen`** - Vereinbarungen
3. **`t_vereinbarungs_logs`** - Protokolle
4. **`t_platzhalter_definitionen`** - Platzhalter
5. **`menu_items`** - Menü-Einträge
6. **`footer_menu_items`** - Footer-Menü-Einträge
7. **`user_agreement_consents`** - Benutzer-Zustimmungen

---

## ⚠️ Wichtige Hinweise

### Backup wird erstellt

Vor dem Klonen wird automatisch ein Backup erstellt:
```
backups/mysql_backup_before_supabase_clone_YYYY-MM-DD_HH-MM-SS.sql
```

### Duplikate werden vermieden

- Existierende Datensätze werden **aktualisiert** (UPDATE)
- Neue Datensätze werden **eingefügt** (INSERT)
- Basierend auf der Primary Key

### Fehlerbehandlung

Falls Supabase nicht erreichbar ist:
- ❌ Script zeigt Fehlermeldung
- ⚠️ Verwenden Sie Methode 2 (JSON-Import)
- ℹ️ Prüfen Sie Ihre Internet-Verbindung

---

## 🛠️ Troubleshooting

### Problem: "Supabase-Credentials nicht gefunden"

**Lösung:**
1. Erstellen Sie `.env` Datei im Projekt-Root
2. Fügen Sie `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` hinzu

### Problem: "HTTP 401" oder "HTTP 403"

**Lösung:**
- Supabase-Projekt ist gelöscht/pausiert
- Verwenden Sie Methode 2 (JSON-Import)

### Problem: "Tabelle existiert nicht"

**Lösung:**
1. Führen Sie zuerst die automatische Schema-Migration aus:
   ```bash
   # Einfach die API aufrufen (triggert Migration)
   curl http://localhost/stimmumeter/api/db.php
   ```

### Problem: "cURL Fehler"

**Lösung:**
- Prüfen Sie Internet-Verbindung
- Prüfen Sie Firewall-Einstellungen
- Verwenden Sie Methode 2 (JSON-Import)

---

## ✅ Erfolgsprüfung

Nach dem Klonen sollten Sie in phpMyAdmin sehen:

```sql
SELECT COUNT(*) FROM t_vereinbarungen;
SELECT COUNT(*) FROM t_vereinbarungstitel;
SELECT COUNT(*) FROM menu_items;
```

Alle sollten > 0 sein (falls Daten vorhanden waren).

---

## 📝 Nächste Schritte

Nach erfolgreichem Klonen:

1. ✅ **Prüfen Sie die Daten** in phpMyAdmin
2. ✅ **Testen Sie die Admin-Oberfläche** - Vereinbarungen sollten sichtbar sein
3. ✅ **Optional:** Passen Sie das Frontend an, um MySQL statt Supabase zu verwenden

---

**Viel Erfolg beim Klonen!** 🎉


