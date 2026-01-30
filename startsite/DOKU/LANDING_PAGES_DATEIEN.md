# 📁 Zuständige Dateien für Landing Pages

## Übersicht

Dieses Dokument listet alle Dateien auf, die für die verschiedenen Landing Pages zuständig sind.

---

## 1. 🏠 Standard Landing Page

**URL:** `http://localhost:5173/` (Root-Pfad)

### Hauptkomponente
- **Datei:** `src/components/LandingPageRedesign.tsx`
- **Route:** `'landing'` (Standard-Route)
- **Komponente:** `<LandingPageRedesign />`

### Routing-Logik
**Datei:** `src/App.tsx`
- **Zeile 32:** Standard-Route ist `'landing'`
- **Zeile 98:** Wenn kein spezifischer Pfad, wird `'landing'` gesetzt
- **Zeile 131:** Bei Navigation ohne spezifischen Pfad → `'landing'`
- **Zeile 251-258:** Rendering der LandingPageRedesign Komponente

### Weitere beteiligte Dateien
- **`src/App.tsx`** - Routing-Logik und Rendering
- **`src/components/SEO.tsx`** - SEO-Meta-Tags
- **`src/components/CookieConsent.tsx`** - Cookie-Banner (wenn Supabase konfiguriert)
- **`src/lib/mood-api.ts`** - API-Calls für Mood-Daten (optional)
- **`src/lib/supabase.ts`** - Supabase Client (optional)

### Abhängigkeiten
- Google Maps API Key: `VITE_GOOGLE_MAPS_API_KEY`
- API Base URL: `VITE_API_BASE_URL` (optional)

---

## 2. 🌍 Interactive Earth Landing Page

**URL:** `http://localhost:5173/interactive-earth`  
**Alternative URL:** `http://localhost:5173/interaktive-erde`

### Hauptkomponente
- **Datei:** `src/components/InteractiveEarth.tsx`
- **Route:** `'interactive-earth'`
- **Komponente:** `<InteractiveEarth />`

### Routing-Logik
**Datei:** `src/App.tsx`
- **Zeile 93-94:** Pfad `/interactive-earth` oder `/interaktive-erde` → Route `'interactive-earth'`
- **Zeile 126-127:** Navigation zu `/interactive-earth` → Route `'interactive-earth'`
- **Zeile 281-290:** Rendering der InteractiveEarth Komponente

### Weitere beteiligte Dateien
- **`src/App.tsx`** - Routing-Logik und Rendering
- **`src/components/SEO.tsx`** - SEO-Meta-Tags
- **`src/components/CookieConsent.tsx`** - Cookie-Banner (wenn Supabase konfiguriert)
- **`src/lib/supabase.ts`** - Supabase Client (optional)

### Abhängigkeiten
- **Google Maps API Key:** `VITE_GOOGLE_MAPS_API_KEY` (ERFORDERLICH)
- Google Maps JavaScript API muss geladen werden

### Features
- 3D-Globus mit animierter Kamera
- Heat Map Overlays
- Avatar-System für Stimmungseinschätzungen
- Standort-basierte Features

---

## 3. ❓ Questions First Landing Page

**URL:** `http://localhost:5173/questions-first`  
**Alternative URL:** `http://localhost:5173/fragen-zuerst`

### Hauptkomponente
- **Datei:** `src/components/QuestionsFirst.tsx`
- **Route:** `'questions-first'`
- **Komponente:** `<QuestionsFirst />`

### Routing-Logik
**Datei:** `src/App.tsx`
- **Zeile 95-96:** Pfad `/questions-first` oder `/fragen-zuerst` → Route `'questions-first'`
- **Zeile 128-129:** Navigation zu `/questions-first` → Route `'questions-first'`
- **Zeile 295-304:** Rendering der QuestionsFirst Komponente

### Weitere beteiligte Dateien
- **`src/App.tsx`** - Routing-Logik und Rendering
- **`src/components/SEO.tsx`** - SEO-Meta-Tags
- **`src/components/CookieConsent.tsx`** - Cookie-Banner (wenn Supabase konfiguriert)
- **`src/lib/supabase.ts`** - Supabase Client (optional)

### Abhängigkeiten
- **Google Maps API Key:** `VITE_GOOGLE_MAPS_API_KEY` (ERFORDERLICH)
- Google Maps JavaScript API muss geladen werden

### Features
- Intro-Screen mit animierten Fragen
- 3 Ansichtsmodi (Stimmungs-Ansicht, Heat Map, 3D Globus)
- Live-Stimmungsdaten
- Frage-Karten mit Antworten
- Mood-Finder
- Person-Ticker für Stimmungsverlauf

---

## 📋 Gemeinsame Dateien

### Routing & Navigation
- **`src/App.tsx`** - Haupt-Routing-Logik für alle Seiten
  - `handleInitialRoute()` - Initiales Routing basierend auf URL
  - `navigate()` - Programmgesteuerte Navigation
  - Conditional Rendering basierend auf `appState.route`

### SEO & Meta-Tags
- **`src/components/SEO.tsx`** - Wird für alle Landing Pages verwendet
  - Dynamische Meta-Tags basierend auf Route
  - Site-Settings aus Supabase (optional)

### Cookie Consent
- **`src/components/CookieConsent.tsx`** - Wird für alle Landing Pages verwendet
  - Nur angezeigt wenn Supabase konfiguriert ist
  - Lädt Cookie-Vereinbarungen aus Supabase

### Supabase Integration
- **`src/lib/supabase.ts`** - Supabase Client
  - Wird von CookieConsent, SEO und anderen Komponenten verwendet
  - Kann `null` sein wenn nicht konfiguriert

---

## 🔗 Navigation zwischen den Seiten

### Von Standard Landing Page
- Link zu `/interactive-earth` → InteractiveEarth Komponente
- Link zu `/questions-first` → QuestionsFirst Komponente
- Link zu `/landing-old` → Alte LandingPage Komponente

### Von Interactive Earth
- Navigation zu anderen Landing Pages möglich
- Zurück zur Standard Landing Page

### Von Questions First
- Navigation zu anderen Landing Pages möglich
- Zurück zur Standard Landing Page

---

## 📝 Datei-Struktur

```
src/
├── App.tsx                          # Haupt-Routing-Logik
├── components/
│   ├── LandingPageRedesign.tsx     # Standard Landing Page (/)
│   ├── InteractiveEarth.tsx        # Interactive Earth (/interactive-earth)
│   ├── QuestionsFirst.tsx          # Questions First (/questions-first)
│   ├── LandingPage.tsx             # Alte Landing Page (/landing-old)
│   ├── SEO.tsx                     # SEO für alle Seiten
│   └── CookieConsent.tsx           # Cookie-Banner für alle Seiten
└── lib/
    ├── supabase.ts                 # Supabase Client
    └── mood-api.ts                 # Mood API Service (optional)
```

---

## 🎯 Zusammenfassung

| URL | Route | Hauptkomponente | Datei |
|-----|-------|----------------|-------|
| `/` | `'landing'` | `<LandingPageRedesign />` | `src/components/LandingPageRedesign.tsx` |
| `/interactive-earth` | `'interactive-earth'` | `<InteractiveEarth />` | `src/components/InteractiveEarth.tsx` |
| `/questions-first` | `'questions-first'` | `<QuestionsFirst />` | `src/components/QuestionsFirst.tsx` |

**Alle drei Seiten verwenden:**
- `src/App.tsx` für Routing
- `src/components/SEO.tsx` für SEO
- `src/components/CookieConsent.tsx` für Cookies (optional)

