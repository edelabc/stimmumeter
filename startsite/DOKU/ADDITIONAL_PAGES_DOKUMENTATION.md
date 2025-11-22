# 📄 Zusätzliche Landing Pages - Dokumentation

## 📋 Übersicht

Das Projekt bietet jetzt **vier verschiedene Landing Pages**:

1. **Neue Landing Page** (Standard) - Mit 3D-Globus und interaktiven Features
2. **Klassische Landing Page** - Die ursprüngliche Startseite
3. **Interaktive Erde** - Interaktive Globus-Ansicht mit Avataren
4. **Fragen zuerst** - Landing Page mit Fragen-Ansatz

Alle Versionen sind parallel verfügbar und können einfach gewechselt werden.

---

## 🚀 Verfügbare Routen

### 1. Neue Landing Page (Standard)
- **URL:** `/` oder `/landing`
- **Komponente:** `LandingPageRedesign`
- **Features:**
  - 3D-Globus mit Google Maps
  - Live-Mood-Daten Visualisierung
  - Interaktive Guess-Funktion
  - Moderne, dunkle Optik

### 2. Klassische Landing Page
- **URL:** `/landing-old` oder `/startseite-alt`
- **Komponente:** `LandingPage`
- **Features:**
  - Klassisches, helles Design
  - Einfache, übersichtliche Struktur
  - Mit Header und Footer

### 3. Interaktive Erde
- **URL:** `/interactive-earth` oder `/interaktive-erde`
- **Komponente:** `InteractiveEarth`
- **Features:**
  - Google Earth Embed
  - Gehende Avatare auf der Karte
  - Standort-basierte Stimmungserfassung
  - YRA-Token-System
  - Heat Map Overlay
  - 14-Tage Prognose (nach Login)

### 4. Fragen zuerst
- **URL:** `/questions-first` oder `/fragen-zuerst`
- **Komponente:** `QuestionsFirst`
- **Features:**
  - Intro-Screen mit Fragen
  - Live-Stimmungsanzeige
  - Mood Finder
  - Person Ticker (Partner/Kind/Kollege)
  - Top Stimmungs-Orte
  - Google Maps Integration

---

## 🔄 Navigation zwischen den Seiten

### Über URL
- **Neue Landing Page:** `http://localhost:5173/` oder `/landing`
- **Klassische Landing Page:** `http://localhost:5173/landing-old` oder `/startseite-alt`
- **Interaktive Erde:** `http://localhost:5173/interactive-earth` oder `/interaktive-erde`
- **Fragen zuerst:** `http://localhost:5173/questions-first` oder `/fragen-zuerst`

### Über Links auf den Seiten
- **Auf der neuen Landing Page:** Links am Ende der Seite
- **Auf der klassischen Landing Page:** Links im CTA-Bereich

---

## 🎨 Unterschiede

| Feature | Neue Landing | Klassisch | Interaktive Erde | Fragen zuerst |
|---------|-------------|-----------|------------------|---------------|
| **Design** | Dunkel, modern | Hell, klassisch | Dunkel, interaktiv | Dunkel, Fragen-fokussiert |
| **3D-Globus** | ✅ Google Maps | ❌ Nein | ✅ Google Earth | ✅ Google Maps |
| **Avatare** | ❌ Nein | ❌ Nein | ✅ Ja (gehend) | ❌ Nein |
| **Standort** | Optional | ❌ Nein | ✅ Erforderlich | ❌ Nein |
| **YRA-System** | ✅ Demo | ❌ Nein | ✅ Vollständig | ❌ Nein |
| **Fragen-Ansatz** | ❌ Nein | ❌ Nein | ❌ Nein | ✅ Ja |
| **Person Ticker** | ❌ Nein | ❌ Nein | ❌ Nein | ✅ Ja |

---

## 🔧 Technische Details

### Interaktive Erde (`InteractiveEarth.tsx`)
- Verwendet Google Earth Embed (iframe)
- Generiert 8-12 zufällige Avatare
- Standort-Erkennung über Browser Geolocation API
- YRA-Token-System mit Belohnungen
- Heat Map Overlay für Stimmungszonen
- Forecast Panel für eingeloggte Benutzer

### Fragen zuerst (`QuestionsFirst.tsx`)
- Intro-Screen mit animierten Fragen
- Google Maps Integration für Stimmungsorte
- Live-Updates alle 5 Sekunden
- Mood Finder mit Filterung
- Person-spezifische Stimmungsverläufe
- Top-Stimmungs-Orte Liste

---

## 📝 Hinweise für Entwickler

### Google Maps API Key

Beide Komponenten verwenden den Google Maps API Key aus der `.env` Datei:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBwFZa1pg3oFWBxtC0CeJ_oae3Bdabym3U
```

### Neue Route hinzufügen

Um eine neue Route hinzuzufügen, bearbeiten Sie `src/App.tsx`:

```typescript
// Route-Typ erweitern
type Route = 'landing' | 'landing-old' | 'interactive-earth' | 'questions-first' | 'neue-route' | ...;

// Route-Handling hinzufügen
if (path === '/neue-route') {
  setAppState({ route: 'neue-route' });
}

// Rendering hinzufügen
if (appState.route === 'neue-route') {
  return <NeueKomponente />;
}
```

---

## ✅ Status

- ✅ Alle vier Landing Pages funktionieren
- ✅ Wechsel zwischen Versionen möglich
- ✅ Links auf beiden Haupt-Landing Pages vorhanden
- ✅ Separate Routen implementiert
- ✅ Google Maps API Key Integration
- ✅ Responsive Design
- ✅ Dokumentation vollständig

---

## 🐛 Bekannte Einschränkungen

### Interaktive Erde
- Google Earth Embed benötigt Internet-Verbindung
- Avatare werden zufällig generiert (Demo-Daten)
- YRA-System funktioniert lokal (keine Backend-Integration)

### Fragen zuerst
- Google Maps benötigt API Key
- Live-Updates verwenden Demo-Daten
- Person-Ticker zeigt statische Daten

---

**Alle Landing Pages sind einsatzbereit! 🎉**

