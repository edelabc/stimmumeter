# 🚀 Setup-Anleitung für die neue Landing Page mit 3D-Globus

## 📋 Übersicht

Diese Anleitung beschreibt, wie die neue Landing Page mit 3D-Globus-Integration eingerichtet wird.

---

## 🔑 Schritt 1: Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Projekt-Root (falls noch nicht vorhanden) und fügen Sie folgende Variablen hinzu:

```env
# Bestehende Supabase-Variablen (falls vorhanden)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API Key (aus auralium/immobilien Projekt)
# Der Key ist bereits in der .env Datei konfiguriert
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBwFZa1pg3oFWBxtC0CeJ_oae3Bdabym3U

# Google Maps Map ID (optional, für erweiterte Features)
VITE_GOOGLE_MAPS_MAP_ID=

# Backend API Base URL (optional, für Live-Mood-Daten)
# Falls leer, werden Demo-Daten verwendet
VITE_API_BASE_URL=

# Landing Page Version (optional)
# Setze auf 'false', um die alte Landing Page zu verwenden
VITE_USE_NEW_LANDING_PAGE=true

# App URL
VITE_APP_URL=http://localhost:5173
```

**Hinweis:** Der Google Maps API Key wurde bereits aus dem auralium/immobilien Projekt übernommen und ist in der `.env` Datei konfiguriert.

---

## 🗺️ Schritt 2: Google Maps API Key

**✅ Bereits konfiguriert!**

Der Google Maps API Key wurde bereits aus dem auralium/immobilien Projekt übernommen und ist in der `.env` Datei eingetragen:

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBwFZa1pg3oFWBxtC0CeJ_oae3Bdabym3U
```

**Hinweis:** Falls Sie einen eigenen Key verwenden möchten oder der Key nicht funktioniert, können Sie einen neuen Key erstellen:

### 2.1 Google Cloud Projekt erstellen

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Klicken Sie auf "Projekt erstellen" oder wählen Sie ein bestehendes Projekt
3. Notieren Sie die Projekt-ID

### 2.2 APIs aktivieren

Aktivieren Sie folgende APIs im Cloud Console:
- **Maps JavaScript API** (für die 3D-Karte)
- **Maps Embed API** (optional für Embeds)
- **Geocoding API** (für Standort-Auflösung)

### 2.3 API-Key erstellen

1. Navigieren Sie zu "APIs & Services" → "Anmeldedaten"
2. Klicken Sie auf "+ ANMELDEDATEN ERSTELLEN" → "API-Schlüssel"
3. **WICHTIG: Beschränken Sie den Key:**
   - HTTP-Referrer: `https://www.wameli.com/*` und `http://localhost:*/*`
   - API-Beschränkungen: Nur die aktivierten Maps APIs

### 2.4 Map ID für 3D-Features erstellen (optional)

1. Gehen Sie zu "Google Maps Platform" → "Map Management"
2. Erstellen Sie eine neue Map ID mit:
   - Map type: **JavaScript**
   - Raster: **Vector**
   - Features: **Tilt**, **Rotation**, **3D Buildings**

---

## 🔧 Schritt 3: Projekt starten

Nach dem Einrichten der Umgebungsvariablen:

```bash
# Dependencies installieren (falls noch nicht geschehen)
npm install

# Entwicklungsserver starten
npm run dev
```

Die neue Landing Page sollte jetzt unter `http://localhost:5173` verfügbar sein.

---

## 📊 Schritt 4: Backend API (optional)

Falls Sie Live-Mood-Daten vom Backend verwenden möchten:

1. **Backend-Server starten:**
   - Siehe `backend-api.ts` für eine Beispiel-Implementation
   - Der Server sollte auf Port 3001 laufen (oder passen Sie `VITE_API_BASE_URL` an)

2. **API-Endpoints:**
   - `GET /api/mood/live?time_window=15m&zoom=5` - Lädt Live-Mood-Daten
   - `POST /api/mood/guess` - Verifiziert User-Guesses

Falls das Backend nicht verfügbar ist, verwendet die Landing Page automatisch Demo-Daten.

---

## 🎨 Schritt 5: Anpassungen

### Zur alten Landing Page wechseln

Setzen Sie in der `.env` Datei:
```env
VITE_USE_NEW_LANDING_PAGE=false
```

### Demo-Modus (ohne Google Maps)

Lassen Sie `VITE_GOOGLE_MAPS_API_KEY` leer oder entfernen Sie es. Die Seite funktioniert dann im Demo-Modus mit statischen Daten.

---

## ✅ Checkliste

- [ ] `.env` Datei erstellt
- [ ] Google Maps API Key erstellt und eingetragen
- [ ] Google Maps APIs aktiviert
- [ ] (Optional) Map ID erstellt
- [ ] (Optional) Backend API konfiguriert
- [ ] Projekt gestartet und getestet

---

## 🐛 Fehlerbehebung

### "Google Maps API Key nicht gefunden"
- Prüfen Sie, ob `VITE_GOOGLE_MAPS_API_KEY` in der `.env` Datei gesetzt ist
- Stellen Sie sicher, dass die `.env` Datei im Projekt-Root liegt
- Starten Sie den Dev-Server neu nach Änderungen an der `.env` Datei

### "API Error: 403"
- Prüfen Sie die API-Beschränkungen des Google Maps API Keys
- Stellen Sie sicher, dass die Maps JavaScript API aktiviert ist
- Prüfen Sie die HTTP-Referrer-Beschränkungen

### Karte wird nicht angezeigt
- Öffnen Sie die Browser-Konsole auf Fehler
- Prüfen Sie, ob die Google Maps API korrekt geladen wird
- Im Demo-Modus (ohne API Key) wird die Karte nicht angezeigt, aber Demo-Daten werden verwendet

---

## 📚 Weitere Informationen

- **API-Dokumentation:** Siehe `API_DOCUMENTATION.md`
- **Backend-Implementation:** Siehe `backend-api.ts`
- **Komponente:** `src/components/LandingPageRedesign.tsx`
- **API-Service:** `src/lib/mood-api.ts`

---

**Viel Erfolg! 🚀**

