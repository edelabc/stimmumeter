# 🔐 Supabase Login & Projekt-Einrichtung - Schritt-für-Schritt

**Problem:** Sie sehen nicht die Datenbank, die bolt.new angelegt hat

**Lösung:** Erstellen Sie Ihr eigenes Supabase-Projekt (empfohlen) oder finden Sie das bolt.new-Projekt

---

## 🎯 Schritt 1: Bei Supabase einloggen

### 1.1 Supabase öffnen
1. Gehen Sie zu: **https://supabase.com**
2. Klicken Sie oben rechts auf **"Sign In"**

### 1.2 Login-Methoden

**Option A: Mit GitHub (empfohlen)**
1. Klicken Sie auf **"Continue with GitHub"**
2. Autorisiere Supabase
3. Sie werden automatisch eingeloggt

**Option B: Mit E-Mail**
1. Geben Sie Ihre **E-Mail-Adresse** ein
2. Geben Sie Ihr **Passwort** ein
3. Falls Sie sich nicht erinnern: Klicken Sie auf **"Forgot password"**

**Option C: Mit Google**
1. Klicken Sie auf **"Continue with Google"**
2. Wählen Sie Ihr Google-Konto

---

## 🆕 Schritt 2: Neues Supabase-Projekt erstellen (empfohlen)

### 2.1 Projekt erstellen
1. Nach dem Login sehen Sie das **Dashboard**
2. Klicken Sie auf den grünen Button **"New Project"**
   - Oder: **"Create a new project"**
   - Oder: **"Add new project"**

### 2.2 Projekt-Details eingeben

**Name:**
```
stimmumeter
```
(oder ein anderer Name Ihrer Wahl)

**Database Password:**
- **WICHTIG:** Erstellen Sie ein **sicheres Passwort**
- **Notieren Sie sich dieses Passwort!** Sie benötigen es später.
- Beispiel: `MeinSicheresPasswort123!@#`
- Mindestens 12 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen

**Region:**
- Wählen Sie die **nächste Region** zu Ihnen:
  - **West Europe** (Frankfurt) - für Deutschland/Österreich/Schweiz
  - **Central US** - für USA
  - Oder lassen Sie die Standard-Region

**Pricing Plan:**
- Wählen Sie **"Free"** (für Entwicklung und kleine Projekte)
- Oder **"Pro"** falls Sie bereits bezahlen

### 2.3 Projekt erstellen
1. Klicken Sie auf **"Create new project"**
2. **Warten Sie 2-3 Minuten** - Supabase richtet die Datenbank ein
3. Sie sehen eine Fortschrittsanzeige

---

## 🔑 Schritt 3: Supabase-Credentials finden

### 3.1 Projekt öffnen
1. Nach der Erstellung sehen Sie Ihr Projekt im Dashboard
2. Klicken Sie auf das Projekt **"stimmumeter"**

### 3.2 API-Keys finden
1. Im **linken Menü** klicken Sie auf **"Settings"** (Zahnrad-Icon ⚙️)
2. Klicken Sie auf **"API"** (unter Settings)
3. Sie sehen jetzt:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
(Kopieren Sie diese URL!)

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
(Kopieren Sie diesen Key - das ist der **wichtigste** Key!)

**service_role key:** 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
⚠️ **NICHT öffentlich verwenden!** Nur für Backend/Server!

### 3.3 Database-Passwort finden
1. Im linken Menü: **"Settings"**
2. Klicken Sie auf **"Database"**
3. Unter **"Connection string"** finden Sie:
   - **Host:** `db.xxxxxxxxxxxxx.supabase.co`
   - **Database name:** `postgres`
   - **Port:** `5432`
   - **User:** `postgres`
   - **Password:** Das Passwort, das Sie bei der Projekt-Erstellung eingegeben haben

---

## ⚙️ Schritt 4: Credentials in Projekt eintragen

### 4.1 Lokales Projekt (.env Datei)

Erstellen/aktualisieren Sie die `.env` Datei im Projekt-Root:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
```

**Wichtig:** 
- Ersetzen Sie `xxxxxxxxxxxxx` mit Ihrer tatsächlichen Projekt-ID!
- Ersetzen Sie den Anon Key mit Ihrem echten Key!

**Beispiel:**
```env
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWNzcWNvZGd5b2hpZWJqaGIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxxxxxxxxxxxx
VITE_APP_URL=http://localhost:5173
```

### 4.2 bolt.new Projekt

Falls Sie das Projekt auf bolt.new verwenden:

1. Öffnen Sie die **Umgebungsvariablen** in bolt.new
2. Suchen Sie nach **"Environment Variables"** oder **".env"**
3. Fügen Sie hinzu:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🗄️ Schritt 5: Datenbank-Migrationen ausführen

### 5.1 SQL Editor öffnen
1. Im Supabase Dashboard: Klicken Sie auf **"SQL Editor"** (im linken Menü)
2. Klicken Sie auf **"New query"** (oben rechts)

### 5.2 Migration ausführen
1. Öffnen Sie die Datei: `AGREEMENTS_MIGRATION_COMPLETE.sql`
2. **Kopieren Sie den GESAMTEN Inhalt** der Datei
3. **Fügen Sie ihn in den SQL Editor ein**
4. Klicken Sie auf **"Run"** (oder drücken Sie `Ctrl+Enter` / `Cmd+Enter`)
5. Warten Sie auf die Meldung **"Success"**

### 5.3 Erfolgsprüfung
Führen Sie diese Abfrage im SQL Editor aus:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('t_vereinbarungstitel', 't_vereinbarungen', 't_vereinbarungs_logs', 't_platzhalter_definitionen')
ORDER BY table_name;
```

Sie sollten **4 Tabellen** sehen:
- `t_platzhalter_definitionen`
- `t_vereinbarungen`
- `t_vereinbarungs_logs`
- `t_vereinbarungstitel`

---

## 🔍 Schritt 6: Bestehende Projekte finden (falls bolt.new bereits eines erstellt hat)

### Option A: In bolt.new finden
1. Öffnen Sie bolt.new
2. Suchen Sie nach **Supabase-Konfiguration** oder **Environment Variables**
3. Dort sollten die Credentials stehen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option B: In Supabase Dashboard prüfen
1. Gehen Sie zu: https://supabase.com/dashboard
2. Prüfen Sie **alle Projekte** in der Liste
3. Suchen Sie nach einem Projekt, das bolt.new erstellt haben könnte
   - Name könnte sein: "bolt-project", "stimmumeter", oder ähnlich

### Option C: Neues Projekt verwenden (empfohlen)
- **Empfehlung:** Erstellen Sie einfach ein **neues Projekt** (siehe Schritt 2)
- Verwenden Sie dieses für Ihr lokales Projekt und bolt.new
- So haben Sie die volle Kontrolle

---

## 📋 Checkliste

- [ ] Bei Supabase eingeloggt
- [ ] Neues Projekt erstellt (oder bestehendes gefunden)
- [ ] Projekt-URL notiert: `https://xxxxxxxxxxxxx.supabase.co`
- [ ] Anon Key notiert: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Database-Passwort notiert (falls benötigt)
- [ ] `.env` Datei erstellt/aktualisiert
- [ ] Migrationen ausgeführt (`AGREEMENTS_MIGRATION_COMPLETE.sql`)
- [ ] Tabellen geprüft (4 Tabellen sollten existieren)
- [ ] Projekt funktioniert lokal
- [ ] Projekt funktioniert auf bolt.new

---

## 🆘 Troubleshooting

### Problem: "Invalid API key"
- **Lösung:** 
  - Prüfen Sie, ob Sie den **anon public key** verwenden (nicht service_role!)
  - Prüfen Sie, ob die URL korrekt ist (mit `https://`)
  - Prüfen Sie, ob keine Leerzeichen am Anfang/Ende sind

### Problem: "Project not found"
- **Lösung:** 
  - Prüfen Sie, ob Sie im richtigen Projekt sind
  - Prüfen Sie die Projekt-URL in Settings → API
  - Stellen Sie sicher, dass das Projekt vollständig erstellt wurde

### Problem: "Connection refused"
- **Lösung:** 
  - Prüfen Sie, ob das Projekt vollständig erstellt wurde (2-3 Minuten warten)
  - Prüfen Sie die Region-Einstellung
  - Prüfen Sie, ob die URL korrekt ist

### Problem: "Table does not exist"
- **Lösung:** 
  - Führen Sie die Migrationen aus (Schritt 5)
  - Prüfen Sie, ob die Migration erfolgreich war
  - Führen Sie die Erfolgsprüfung aus (Schritt 5.3)

---

## ✅ Nach erfolgreicher Einrichtung

1. ✅ Supabase-Projekt erstellt
2. ✅ Credentials in `.env` eingetragen
3. ✅ Migrationen ausgeführt
4. ✅ Tabellen existieren
5. ✅ Projekt funktioniert lokal
6. ✅ Projekt funktioniert auf bolt.new

---

## 📝 Schnellreferenz

**Wo finde ich die Credentials?**
- Supabase Dashboard → Projekt → Settings → API

**Welche Credentials brauche ich?**
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_ANON_KEY` → anon public key

**Wo trage ich sie ein?**
- Lokal: `.env` Datei im Projekt-Root
- bolt.new: Environment Variables in den Projekteinstellungen

---

**Ende der Anleitung**

