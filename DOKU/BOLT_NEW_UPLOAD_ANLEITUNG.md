# 🚀 Projekt auf bolt.new hochladen - Schritt-für-Schritt Anleitung

**Ziel:** Stimmumeter-Projekt auf bolt.new verfügbar machen

---

## 📋 Voraussetzungen

✅ **Repository auf GitHub:** https://github.com/edelabc/stimmumeter  
✅ **Branch:** `develop` (oder `main`/`master`)  
✅ **Repository ist öffentlich** (oder Sie haben Zugriff)

---

## 🔧 Schritt 1: Repository-Status prüfen

### 1.1 Prüfen Sie, ob das Repository öffentlich ist

1. Gehen Sie zu: https://github.com/edelabc/stimmumeter
2. Prüfen Sie, ob Sie das Repository sehen können
3. **Wichtig:** bolt.new benötigt **öffentlichen Zugriff** oder Sie müssen Zugangsdaten angeben

### 1.2 Falls Repository privat ist

**Option A: Repository öffentlich machen (empfohlen für bolt.new)**
1. Gehen Sie zu: https://github.com/edelabc/stimmumeter/settings
2. Scrollen Sie nach unten zu "Danger Zone"
3. Klicken Sie auf "Change visibility"
4. Wählen Sie "Make public"
5. Bestätigen Sie

**Option B: Repository bleibt privat**
- Sie müssen bolt.new Zugriff gewähren (siehe Schritt 2)

---

## 🎯 Schritt 2: bolt.new öffnen und Repository klonen

### 2.1 bolt.new öffnen

1. Gehen Sie zu: **https://bolt.new**
2. Melden Sie sich an (falls nötig)

### 2.2 Repository klonen

**Methode 1: Über die UI (empfohlen)**

1. Suchen Sie nach einem Button wie:
   - "Import from Git"
   - "Clone Repository"
   - "New Project from Git"
   - Oder ein "+" Button

2. Geben Sie die Repository-URL ein:
   ```
   https://github.com/edelabc/stimmumeter.git
   ```

3. Wählen Sie den Branch:
   - `develop` (empfohlen, da dort die neuesten Änderungen sind)
   - Oder `main`/`master` falls vorhanden

4. Klicken Sie auf "Clone" oder "Import"

**Methode 2: Über Git Clone (falls verfügbar)**

Falls bolt.new eine Terminal-Eingabe unterstützt:

```bash
git clone https://github.com/edelabc/stimmumeter.git
cd stimmumeter
git checkout develop
```

---

## 🔐 Schritt 3: Authentifizierung (falls Repository privat)

Falls Ihr Repository **privat** ist:

1. **GitHub Personal Access Token erstellen:**
   - Gehen Sie zu: https://github.com/settings/tokens
   - Klicken Sie auf "Generate new token" → "Generate new token (classic)"
   - Geben Sie einen Namen ein (z.B. "bolt.new")
   - Wählen Sie Scopes: `repo` (für privates Repository)
   - Klicken Sie auf "Generate token"
   - **Kopieren Sie den Token** (wird nur einmal angezeigt!)

2. **Token in bolt.new verwenden:**
   - Bei der Repository-Eingabe: `https://<TOKEN>@github.com/edelabc/stimmumeter.git`
   - Oder in einem separaten Authentifizierungsfeld eingeben

---

## ⚙️ Schritt 4: Projekt-Konfiguration in bolt.new

Nach dem Klonen müssen Sie bolt.new mitteilen:

### 4.1 Projekt-Typ
- **Type:** `Node.js` / `React` / `Vite`
- **Framework:** `React` + `TypeScript`
- **Package Manager:** `npm`

### 4.2 Wichtige Dateien für bolt.new

bolt.new sollte automatisch erkennen:
- ✅ `package.json` → Dependencies
- ✅ `vite.config.ts` → Build-Konfiguration
- ✅ `tsconfig.json` → TypeScript-Konfiguration

### 4.3 Umgebungsvariablen (falls nötig)

Falls bolt.new nach Umgebungsvariablen fragt, benötigen Sie:

```env
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=<IHR_ANON_KEY>
```

**Hinweis:** Diese sollten Sie **NICHT** ins Repository committen!  
Erstellen Sie eine `.env.example` Datei (falls noch nicht vorhanden).

---

## 📝 Schritt 5: Was bolt.new benötigt

### 5.1 Repository-Informationen

**URL:**
```
https://github.com/edelabc/stimmumeter.git
```

**Branch:**
```
develop
```

**Vollständiger Clone-Befehl:**
```bash
git clone -b develop https://github.com/edelabc/stimmumeter.git
```

### 5.2 Projekt-Struktur

bolt.new sollte automatisch erkennen:
- ✅ Root-Verzeichnis: `/` (Projekt-Root)
- ✅ Build-Command: `npm run build` (aus package.json)
- ✅ Dev-Command: `npm run dev` (aus package.json)
- ✅ Entry Point: `index.html` (Vite-Projekt)

### 5.3 Dependencies installieren

Nach dem Klonen sollte bolt.new automatisch:
```bash
npm install
```

ausführen.

---

## 🎯 Schritt 6: Vollständige Anleitung für bolt.new

### Was Sie bolt.new mitteilen müssen:

**1. Repository-URL:**
```
https://github.com/edelabc/stimmumeter.git
```

**2. Branch (optional, falls nicht develop):**
```
develop
```

**3. Projekt-Typ:**
- React + TypeScript + Vite
- Node.js Version: 18+ (empfohlen: 20+)

**4. Build-Konfiguration:**
- Build Command: `npm run build`
- Dev Command: `npm run dev`
- Port: `5173` (Vite Standard)

**5. Umgebungsvariablen (falls nötig):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔍 Schritt 7: Nach dem Klonen prüfen

### 7.1 Prüfen Sie, ob alles geladen wurde

1. ✅ `package.json` vorhanden?
2. ✅ `src/` Verzeichnis vorhanden?
3. ✅ `supabase/migrations/` vorhanden?
4. ✅ `node_modules/` installiert?

### 7.2 Dependencies installieren (falls nicht automatisch)

```bash
npm install
```

### 7.3 Projekt starten

```bash
npm run dev
```

---

## ⚠️ Wichtige Hinweise

### 1. Umgebungsvariablen
- **NICHT** ins Repository committen!
- Verwenden Sie `.env.example` als Vorlage
- In bolt.new manuell eingeben

### 2. Supabase-Zugriff
- bolt.new benötigt Zugriff auf Ihre Supabase-Datenbank
- Oder Sie müssen die Migrationen manuell ausführen

### 3. Git-Ignore
- Stellen Sie sicher, dass `.env` in `.gitignore` ist
- `node_modules/` sollte ignoriert sein

### 4. Datenbank-Migrationen
- Die Migrationen sind im Repository (`supabase/migrations/`)
- Müssen in Supabase manuell ausgeführt werden
- Oder bolt.new kann sie ausführen (falls Supabase CLI verfügbar)

---

## 📋 Checkliste für bolt.new

- [ ] Repository-URL bereit: `https://github.com/edelabc/stimmumeter.git`
- [ ] Branch bekannt: `develop`
- [ ] Repository ist öffentlich (oder Token bereit)
- [ ] Umgebungsvariablen bereit (falls nötig)
- [ ] `.env.example` vorhanden (als Vorlage)
- [ ] `package.json` vorhanden
- [ ] `README.md` vorhanden (optional, aber hilfreich)

---

## 🚀 Schnellstart für bolt.new

**Kopieren Sie diese Informationen:**

```
Repository: https://github.com/edelabc/stimmumeter.git
Branch: develop
Type: React + TypeScript + Vite
Build: npm run build
Dev: npm run dev
Port: 5173
```

**Umgebungsvariablen (falls abgefragt):**
```
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=<IHR_KEY>
```

---

## ✅ Nach erfolgreichem Upload

1. ✅ Projekt wird geklont
2. ✅ Dependencies werden installiert
3. ✅ Projekt kann gestartet werden
4. ⚠️ **Wichtig:** Migrationen müssen noch in Supabase ausgeführt werden!

---

**Ende der Anleitung**

