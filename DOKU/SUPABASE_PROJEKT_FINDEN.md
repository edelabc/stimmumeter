# 🔍 Supabase-Projekt finden - Schnellanleitung

**Ihr Supabase-Projekt:** `apacsqcodgyohiebjhjb`

---

## 🎯 Schritt 1: Bei Supabase einloggen

1. Gehen Sie zu: **https://supabase.com**
2. Klicken Sie oben rechts auf **"Sign In"**
3. Loggen Sie sich ein mit:
   - **GitHub** (empfohlen)
   - **E-Mail** (falls Sie sich mit E-Mail registriert haben)
   - **Google**

---

## 🔍 Schritt 2: Projekt finden

### Option A: Projekt direkt öffnen
1. Nach dem Login sehen Sie das **Dashboard**
2. Suchen Sie nach einem Projekt mit der **ID:** `apacsqcodgyohiebjhjb`
3. Oder suchen Sie nach einem Projekt mit dem Namen **"stimmumeter"** oder ähnlich

### Option B: Über URL direkt öffnen
Versuchen Sie diese URL (nach dem Login):
```
https://supabase.com/dashboard/project/apacsqcodgyohiebjhjb
```

### Option C: Alle Projekte durchsuchen
1. Im Dashboard sehen Sie eine Liste aller Projekte
2. Klicken Sie auf jedes Projekt, um die Details zu sehen
3. Prüfen Sie die **Project URL** in Settings → API
4. Suchen Sie nach: `https://apacsqcodgyohiebjhjb.supabase.co`

---

## ✅ Schritt 3: Projekt identifizieren

Wenn Sie das richtige Projekt gefunden haben, sollten Sie sehen:

**Project URL:**
```
https://apacsqcodgyohiebjhjb.supabase.co
```

**Anon Key beginnt mit:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWNzcWNvZGd5b2hpZWJqaGIi...
```

---

## 🆕 Falls Projekt nicht gefunden wird

### Option 1: Neues Projekt erstellen (empfohlen)

1. Klicken Sie auf **"New Project"**
2. Name: `stimmumeter`
3. Erstellen Sie ein sicheres Database-Passwort
4. Wählen Sie Region
5. Klicken Sie auf **"Create new project"**

**Dann:**
1. Gehen Sie zu **Settings → API**
2. Kopieren Sie die **Project URL** und **anon public key**
3. Aktualisieren Sie Ihre `.env` Datei mit den neuen Credentials

### Option 2: Projekt von bolt.new finden

Falls bolt.new ein Projekt erstellt hat:

1. **In bolt.new prüfen:**
   - Öffnen Sie bolt.new
   - Suchen Sie nach **Environment Variables** oder **Supabase Config**
   - Dort sollten die Credentials stehen

2. **In Supabase prüfen:**
   - Gehen Sie zu: https://supabase.com/dashboard
   - Prüfen Sie **alle Projekte**
   - Suchen Sie nach einem Projekt, das bolt.new erstellt haben könnte

---

## 🗄️ Schritt 4: Migrationen ausführen

Sobald Sie das Projekt gefunden/erstellt haben:

1. Gehen Sie zu **"SQL Editor"** (im linken Menü)
2. Klicken Sie auf **"New query"**
3. Öffnen Sie: `AGREEMENTS_MIGRATION_COMPLETE.sql`
4. **Kopieren Sie den gesamten Inhalt**
5. **Fügen Sie ihn in den SQL Editor ein**
6. Klicken Sie auf **"Run"**
7. Warten Sie auf **"Success"**

---

## 📋 Ihre aktuellen Credentials (aus .env)

```
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWNzcWNvZGd5b2hpZWJqaGIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2MTY4MTY5MCwiZXhwIjoyMDc3MjU3NjkwfQ.kO4pA7lYA2zz-7rsxm6senq7y_Th9iDYW3W6CA5PN2o
```

**Projekt-ID:** `apacsqcodgyohiebjhjb`

---

## 🆘 Falls Sie sich nicht einloggen können

### Passwort vergessen?
1. Gehen Sie zu: https://supabase.com/auth/reset-password
2. Geben Sie Ihre E-Mail ein
3. Prüfen Sie Ihr E-Mail-Postfach

### Mit GitHub einloggen (empfohlen)
1. Klicken Sie auf **"Continue with GitHub"**
2. Autorisiere Supabase
3. Sie werden automatisch eingeloggt

### Neues Konto erstellen
1. Gehen Sie zu: https://supabase.com
2. Klicken Sie auf **"Start your project"**
3. Registrieren Sie sich
4. Erstellen Sie ein neues Projekt

---

## ✅ Erfolgsprüfung

Nach dem Login sollten Sie:
- ✅ Das Projekt `apacsqcodgyohiebjhjb` sehen
- ✅ Auf das Projekt klicken können
- ✅ Die Settings → API sehen können
- ✅ Die Migrationen ausführen können

---

**Viel Erfolg!** 🎉

