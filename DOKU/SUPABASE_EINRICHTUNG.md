# 🔐 Supabase Einrichtung - Schritt-für-Schritt Anleitung

**Problem:** Sie sehen nicht die Datenbank, die bolt.new angelegt hat

---

## 🎯 Lösung: Neues Supabase-Projekt erstellen

Da bolt.new möglicherweise ein eigenes Supabase-Projekt erstellt hat, sollten Sie **Ihr eigenes Supabase-Projekt** erstellen und verwenden.

---

## 📋 Schritt 1: Bei Supabase einloggen

### 1.1 Supabase öffnen
1. Gehen Sie zu: **https://supabase.com**
2. Klicken Sie auf **"Sign In"** (oben rechts)

### 1.2 Einloggen
- **Option A:** Mit GitHub-Account (empfohlen)
  - Klicken Sie auf "Continue with GitHub"
  - Autorisiere Supabase
- **Option B:** Mit E-Mail
  - Geben Sie Ihre E-Mail und Passwort ein
  - Falls Sie sich nicht erinnern: "Forgot password" verwenden

---

## 🆕 Schritt 2: Neues Projekt erstellen

### 2.1 Projekt erstellen
1. Nach dem Login sehen Sie das **Dashboard**
2. Klicken Sie auf **"New Project"** (grüner Button)
3. Oder: **"Create a new project"**

### 2.2 Projekt-Details eingeben

**Name:**
```
stimmumeter
```

**Database Password:**
- Erstellen Sie ein **sicheres Passwort**
- **WICHTIG:** Notieren Sie sich dieses Passwort! Sie benötigen es später.
- Beispiel: `MeinSicheresPasswort123!`

**Region:**
- Wählen Sie die **nächste Region** (z.B. "West Europe" für Deutschland)
- Oder lassen Sie die Standard-Region

**Pricing Plan:**
- Wählen Sie **"Free"** (für Entwicklung)
- Oder "Pro" falls Sie bereits bezahlen

### 2.3 Projekt erstellen
1. Klicken Sie auf **"Create new project"**
2. Warten Sie **2-3 Minuten** (Supabase richtet die Datenbank ein)

---

## 🔑 Schritt 3: Supabase-Credentials finden

### 3.1 Projekt öffnen
1. Nach der Erstellung sehen Sie Ihr Projekt im Dashboard
2. Klicken Sie auf das Projekt **"stimmumeter"**

### 3.2 API-Keys finden
1. Im linken Menü: **"Settings"** (Zahnrad-Icon)
2. Klicken Sie auf **"API"**
3. Sie sehen:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

**service_role key:** (NICHT öffentlich verwenden!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

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

Erstellen Sie eine `.env` Datei im Projekt-Root:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
```

**Wichtig:** Ersetzen Sie `xxxxxxxxxxxxx` mit Ihrer tatsächlichen Projekt-ID!

### 4.2 bolt.new Projekt

Falls Sie das Projekt auf bolt.new verwenden:

1. Öffnen Sie die **Umgebungsvariablen** in bolt.new
2. Fügen Sie hinzu:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI6IkpXVCJ9...
   ```

---

## 🗄️ Schritt 5: Datenbank-Migrationen ausführen

### 5.1 SQL Editor öffnen
1. Im Supabase Dashboard: **"SQL Editor"** (im linken Menü)
2. Klicken Sie auf **"New query"**

### 5.2 Migration ausführen
1. Öffnen Sie die Datei: `AGREEMENTS_MIGRATION_COMPLETE.sql`
2. **Kopieren Sie den GESAMTEN Inhalt**
3. **Fügen Sie ihn in den SQL Editor ein**
4. Klicken Sie auf **"Run"** (oder `Ctrl+Enter` / `Cmd+Enter`)
5. Warten Sie auf **"Success"**

### 5.3 Erfolgsprüfung
Führen Sie diese Abfrage aus:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('t_vereinbarungstitel', 't_vereinbarungen', 't_vereinbarungs_logs', 't_platzhalter_definitionen')
ORDER BY table_name;
```

Sie sollten **4 Tabellen** sehen.

---

## 🔍 Schritt 6: Bestehende Projekte finden

### Falls bolt.new bereits ein Projekt erstellt hat:

**Option A: In bolt.new finden**
1. Öffnen Sie bolt.new
2. Suchen Sie nach **Supabase-Konfiguration**
3. Dort sollten die Credentials stehen

**Option B: In Supabase Dashboard prüfen**
1. Gehen Sie zu: https://supabase.com/dashboard
2. Prüfen Sie alle Projekte in der Liste
3. Suchen Sie nach einem Projekt, das bolt.new erstellt haben könnte

**Option C: Neues Projekt verwenden (empfohlen)**
- Erstellen Sie einfach ein neues Projekt (siehe Schritt 2)
- Verwenden Sie dieses für Ihr lokales Projekt

---

## 📝 Checkliste

- [ ] Bei Supabase eingeloggt
- [ ] Neues Projekt erstellt
- [ ] Projekt-URL notiert
- [ ] Anon Key notiert
- [ ] Database-Passwort notiert
- [ ] `.env` Datei erstellt
- [ ] Migrationen ausgeführt
- [ ] Tabellen geprüft

---

## 🆘 Troubleshooting

### Problem: "Invalid API key"
- **Lösung:** Prüfen Sie, ob Sie den **anon public key** verwenden (nicht service_role!)
- Prüfen Sie, ob die URL korrekt ist (mit `https://`)

### Problem: "Project not found"
- **Lösung:** Prüfen Sie, ob Sie im richtigen Projekt sind
- Prüfen Sie die Projekt-URL in den Settings

### Problem: "Connection refused"
- **Lösung:** Prüfen Sie, ob das Projekt vollständig erstellt wurde (2-3 Minuten warten)
- Prüfen Sie die Region-Einstellung

---

## ✅ Nach erfolgreicher Einrichtung

1. ✅ Supabase-Projekt erstellt
2. ✅ Credentials in `.env` eingetragen
3. ✅ Migrationen ausgeführt
4. ✅ Projekt funktioniert lokal und auf bolt.new

---

**Ende der Anleitung**

