# ⚡ bolt.new - Schnellanleitung

## 🎯 Was Sie bolt.new mitteilen müssen

### 1. Repository-URL (wichtigste Information)

```
https://github.com/edelabc/stimmumeter.git
```

### 2. Branch (optional)

```
develop
```

---

## 📋 Schritt-für-Schritt

### Schritt 1: bolt.new öffnen
1. Gehen Sie zu: **https://bolt.new**
2. Melden Sie sich an (falls nötig)

### Schritt 2: Repository klonen

**Option A: Über UI-Button**
1. Suchen Sie nach Button: **"Import from Git"** oder **"Clone Repository"**
2. Geben Sie ein: `https://github.com/edelabc/stimmumeter.git`
3. Wählen Sie Branch: `develop`
4. Klicken Sie auf **"Clone"** oder **"Import"**

**Option B: Über Terminal (falls verfügbar)**
```bash
git clone -b develop https://github.com/edelabc/stimmumeter.git
cd stimmumeter
```

### Schritt 3: Dependencies installieren

bolt.new sollte automatisch `npm install` ausführen. Falls nicht:
```bash
npm install
```

### Schritt 4: Umgebungsvariablen einrichten

Falls bolt.new nach Umgebungsvariablen fragt, erstellen Sie eine `.env` Datei:

```env
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=<IHR_ANON_KEY_HIER>
VITE_APP_URL=http://localhost:5173
```

**Wichtig:** Ersetzen Sie `<IHR_ANON_KEY_HIER>` mit Ihrem echten Supabase Anon Key!

### Schritt 5: Projekt starten

```bash
npm run dev
```

---

## ✅ Was bolt.new automatisch erkennt

- ✅ Projekt-Typ: React + TypeScript + Vite (aus `package.json`)
- ✅ Build-Command: `npm run build`
- ✅ Dev-Command: `npm run dev`
- ✅ Port: `5173` (Vite Standard)

---

## ⚠️ Wichtige Hinweise

1. **Repository muss öffentlich sein** (oder Sie benötigen GitHub Token)
2. **Umgebungsvariablen** müssen manuell eingegeben werden
3. **Datenbank-Migrationen** müssen noch in Supabase ausgeführt werden

---

## 🔗 Repository-Informationen

- **URL:** https://github.com/edelabc/stimmumeter.git
- **Branch:** `develop`
- **Vollständiger Clone-Befehl:**
  ```bash
  git clone -b develop https://github.com/edelabc/stimmumeter.git
  ```

---

**Fertig!** 🎉

