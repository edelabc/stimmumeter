# 🚀 Mood Assessment System - Migration ausführen

**Wichtig:** Diese Migration muss in Supabase ausgeführt werden, damit das neue Stimmungserfassungssystem vollständig funktioniert.

---

## 📋 Migration ausführen

### Option 1: Supabase Dashboard (Empfohlen)

1. **Öffnen Sie das Supabase Dashboard:**
   - Gehen Sie zu [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Wählen Sie Ihr Stimmumeter-Projekt aus
   - Klicken Sie auf **"SQL Editor"** im linken Menü

2. **Migration ausführen:**
   - Öffnen Sie die Datei: `supabase/migrations/20251122000000_create_mood_assessment_system.sql`
   - Kopieren Sie den **gesamten Inhalt** der Datei
   - Fügen Sie ihn in den SQL Editor ein
   - Klicken Sie auf **"Run"** oder drücken Sie `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Warten Sie auf die Bestätigung "Success"

3. **Überprüfung:**
   Führen Sie diese Abfrage aus, um zu prüfen, ob die Tabellen erstellt wurden:

   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'mood_assessments',
     'session_yra',
     'yra_rewards_config',
     'bot_protection_logs'
   )
   ORDER BY table_name;
   ```

   Sie sollten 4 Tabellen sehen.

---

### Option 2: Supabase CLI

Wenn Sie Supabase CLI installiert haben:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
supabase db push
```

Dies führt alle ausstehenden Migrationen automatisch aus.

---

## ⚠️ Wichtige Hinweise

1. **Die Anwendung funktioniert auch ohne Migration** - sie verwendet dann lokale Session-Storage als Fallback
2. **Nach der Migration** werden alle Daten dauerhaft im Backend gespeichert
3. **YRA-Belohnungen** werden nach der Migration korrekt berechnet und gespeichert

---

## ✅ Nach der Migration

Nach erfolgreicher Migration sollten Sie:
- ✅ Keine 404-Fehler mehr in der Browser-Konsole sehen
- ✅ YRA-Belohnungen werden im Backend gespeichert
- ✅ Stimmungseinschätzungen werden dauerhaft gespeichert
- ✅ Bot-Schutz funktioniert vollständig

---

## 🔧 Troubleshooting

### Fehler: "relation does not exist"
- Die Migration wurde noch nicht ausgeführt
- Führen Sie die Migration über das Supabase Dashboard aus

### Fehler: "permission denied"
- Prüfen Sie die RLS-Policies in Supabase
- Die Migration erstellt automatisch die richtigen Policies

### 404-Fehler bleiben bestehen
- Leeren Sie den Browser-Cache
- Hard Refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Prüfen Sie die Browser-Konsole auf weitere Fehler

---

**Die Migration ist erfolgreich, wenn keine 404-Fehler mehr in der Browser-Konsole erscheinen!** 🎉





