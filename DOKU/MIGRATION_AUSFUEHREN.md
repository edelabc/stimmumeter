# 🚀 Migration ausführen - Mood Assessment System

## ⚠️ Wichtig: "Bolt Database" existiert nicht!

Es gibt **kein npm-Paket namens "Bolt Database"**. Sie meinen wahrscheinlich die **Supabase CLI**.

---

## ✅ Empfohlene Methode: Supabase Dashboard (Einfachste)

### Schritt 1: Öffnen Sie das Supabase Dashboard
1. Gehen Sie zu: **https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb/editor**
2. Oder: https://supabase.com/dashboard → Wählen Sie Ihr Projekt → "SQL Editor"

### Schritt 2: Migration ausführen
1. Klicken Sie auf **"SQL Editor"** im linken Menü
2. Öffnen Sie die Datei: `supabase/migrations/20251122000000_create_mood_assessment_system.sql`
3. **Kopieren Sie den gesamten Inhalt** der Datei
4. **Fügen Sie ihn in den SQL Editor** ein
5. Klicken Sie auf **"Run"** oder drücken Sie `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
6. Warten Sie auf die Bestätigung **"Success"**

### Schritt 3: Überprüfung
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

Sie sollten **4 Tabellen** sehen.

---

## 🔧 Alternative: Supabase CLI installieren (Optional)

Falls Sie die Supabase CLI verwenden möchten:

### Installation (macOS/Linux):
```bash
# Mit Homebrew (empfohlen)
brew install supabase/tap/supabase

# Oder mit npm
npm install -g supabase
```

### Installation (Windows):
```bash
# Mit Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Oder mit npm
npm install -g supabase
```

### Verwendung:
```bash
# 1. Login
supabase login

# 2. Link zu Ihrem Projekt
supabase link --project-ref apacsqcodgyohiebjhjb

# 3. Migration ausführen
supabase db push
```

---

## 📝 Script verwenden (Zeigt Migration an)

Sie können auch das Script verwenden, das ich erstellt habe:

```bash
node scripts/run-mood-assessment-migration.mjs
```

Dies zeigt Ihnen den SQL-Code an, den Sie dann im Dashboard ausführen können.

---

## ✅ Nach erfolgreicher Migration

Nach der Migration sollten:
- ✅ Keine 404-Fehler mehr in der Browser-Konsole erscheinen
- ✅ YRA-Belohnungen werden im Backend gespeichert
- ✅ Stimmungseinschätzungen werden dauerhaft gespeichert
- ✅ Bot-Schutz funktioniert vollständig

---

## 🆘 Troubleshooting

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

**Die einfachste Methode ist das Supabase Dashboard!** 🎉




