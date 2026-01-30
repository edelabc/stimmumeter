# 🔧 Migration: is_active Feld zu Dokumenten-Titel hinzufügen

**Problem:** Die Spalte `is_active` fehlt in der Tabelle `t_vereinbarungstitel`  
**Lösung:** Führen Sie diese Migration im Supabase Dashboard aus

---

## 📋 Ihre Projekt-Informationen

**Projekt-ID:** `apacsqcodgyohiebjhjb`  
**Project URL:** `https://apacsqcodgyohiebjhjb.supabase.co`

**Direkter Link (nach Login):**
```
https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb
```

---

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: Bei Supabase einloggen

1. Gehen Sie zu: **https://supabase.com**
2. Klicken Sie oben rechts auf **"Sign In"**
3. Login-Methoden:
   - **Mit GitHub** (empfohlen): "Continue with GitHub"
   - **Mit E-Mail**: E-Mail und Passwort eingeben
   - **Mit Google**: "Continue with Google"

---

### Schritt 2: Projekt öffnen

**Option A: Direkter Link (empfohlen)**
```
https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb
```
Nach dem Login direkt öffnen.

**Option B: Im Dashboard suchen**
1. Nach dem Login sehen Sie das Dashboard
2. Suchen Sie nach einem Projekt mit:
   - **Name:** "stimmumeter" oder ähnlich
   - **Oder ID:** `apacsqcodgyohiebjhjb`
3. Klicken Sie auf das Projekt

---

### Schritt 3: SQL Editor öffnen

1. Klicken Sie im **linken Menü** auf **"SQL Editor"**
2. Klicken Sie auf **"New query"** (oder nutzen Sie das vorhandene Query-Fenster)

---

### Schritt 4: SQL-Script kopieren und ausführen

**Kopieren Sie dieses SQL-Script:**

```sql
-- ============================================
-- MIGRATION: is_active Feld zu t_vereinbarungstitel hinzufügen
-- ============================================

-- Füge is_active Feld hinzu (nur wenn es noch nicht existiert)
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Kommentar hinzufügen
COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);
```

**Dann:**
1. **Fügen Sie** das SQL in den SQL Editor ein
2. **Klicken Sie** auf **"Run"** (oder drücken Sie `Ctrl+Enter` / `Cmd+Enter`)
3. **Warten Sie** auf **"Success"** oder eine Erfolgsmeldung

---

### Schritt 5: Erfolg prüfen

Nach erfolgreicher Migration sollten Sie sehen:
- ✅ **Success** oder eine Erfolgsmeldung
- Die Spalte `is_active` wurde zur Tabelle `t_vereinbarungstitel` hinzugefügt

**Optional - Prüfen Sie die Tabelle:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 't_vereinbarungstitel' 
AND column_name = 'is_active';
```

Sie sollten eine Zeile mit `is_active`, `boolean`, `true` sehen.

---

## 📁 Alternative: SQL-Datei verwenden

Falls Sie die SQL-Datei direkt verwenden möchten:

1. Öffnen Sie die Datei: **`FIX_IS_ACTIVE_COLUMN.sql`** (im Projekt-Root)
2. Kopieren Sie den gesamten Inhalt
3. Fügen Sie ihn in den SQL Editor ein
4. Führen Sie aus (siehe Schritt 4)

---

## ✅ Nach der Migration

Nach erfolgreicher Migration:

1. **Laden Sie die Seite neu** (falls die Anwendung läuft)
2. Der Fehler sollte verschwunden sein
3. Sie können jetzt Dokumenten-Titel **sperren/entsperren** im Admin-Bereich

---

## 🆘 Falls Probleme auftreten

**Fehler: "column already exists"**
- ✅ Das ist OK! Die Migration wurde bereits ausgeführt.
- Die Spalte existiert bereits, keine weitere Aktion erforderlich.

**Fehler: "permission denied"**
- Stellen Sie sicher, dass Sie als **Projekt-Owner** oder **Admin** eingeloggt sind
- Prüfen Sie Ihre Berechtigungen im Projekt

**Fehler: "table does not exist"**
- Führen Sie zuerst die **Hauptmigration** aus: `AGREEMENTS_MIGRATION_COMPLETE.sql`
- Diese erstellt die Tabelle `t_vereinbarungstitel`

---

## 📞 Weitere Hilfe

- **Supabase Dokumentation:** https://supabase.com/docs
- **SQL Editor Guide:** https://supabase.com/docs/guides/database/overview

---

**Viel Erfolg! 🎉**

