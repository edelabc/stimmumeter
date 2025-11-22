# 📄 Landing Pages Dokumentation

## 📋 Übersicht

Das Projekt bietet jetzt **zwei verschiedene Landing Pages**:

1. **Neue Landing Page** (Standard) - Mit 3D-Globus und interaktiven Features
2. **Klassische Landing Page** - Die ursprüngliche Startseite

Beide Versionen sind parallel verfügbar und können einfach gewechselt werden.

---

## 🚀 Verfügbare Routen

### Neue Landing Page (Standard)
- **URL:** `/` oder `/landing`
- **Komponente:** `LandingPageRedesign`
- **Features:**
  - 3D-Globus mit Google Maps
  - Live-Mood-Daten Visualisierung
  - Interaktive Guess-Funktion
  - Moderne, dunkle Optik

### Klassische Landing Page
- **URL:** `/landing-old` oder `/startseite-alt`
- **Komponente:** `LandingPage`
- **Features:**
  - Klassisches, helles Design
  - Einfache, übersichtliche Struktur
  - Mit Header und Footer

---

## 🔄 Wechseln zwischen den Versionen

### Über URL
- **Zur neuen Version:** `http://localhost:5173/` oder `http://localhost:5173/landing`
- **Zur klassischen Version:** `http://localhost:5173/landing-old` oder `http://localhost:5173/startseite-alt`

### Über Links auf den Seiten
- **Auf der neuen Landing Page:** Link "← Klassische Startseite ansehen" am Ende der Seite
- **Auf der klassischen Landing Page:** Link "Neue Version mit 3D-Globus ansehen →" im CTA-Bereich

---

## ⚙️ Konfiguration

### Standard-Landing Page ändern

Die Standard-Landing Page kann über die Umgebungsvariable gesteuert werden:

```env
# In .env Datei
VITE_USE_NEW_LANDING_PAGE=true  # Neue Version (Standard)
VITE_USE_NEW_LANDING_PAGE=false # Klassische Version
```

**Hinweis:** Diese Variable wird aktuell nicht mehr verwendet, da beide Versionen über separate Routen verfügbar sind.

---

## 📁 Dateien

### Komponenten
- **Neue Landing Page:** `src/components/LandingPageRedesign.tsx`
- **Klassische Landing Page:** `src/components/LandingPage.tsx`

### Routing
- **App.tsx:** Enthält das Routing für beide Versionen
- **Route-Typ:** `'landing' | 'landing-old'`

---

## 🎨 Unterschiede

| Feature | Neue Landing Page | Klassische Landing Page |
|---------|-------------------|------------------------|
| **Design** | Dunkel, modern | Hell, klassisch |
| **3D-Globus** | ✅ Ja | ❌ Nein |
| **Header/Footer** | ❌ Nein (Fullscreen) | ✅ Ja |
| **Interaktive Features** | ✅ Guess-Funktion | ❌ Nein |
| **Responsive** | ✅ Ja | ✅ Ja |
| **Google Maps** | ✅ Erforderlich | ❌ Nicht benötigt |

---

## 🔧 Technische Details

### Neue Landing Page
- Verwendet Google Maps API für 3D-Globus
- Lädt Live-Mood-Daten (mit Fallback zu Demo-Daten)
- Kein Layout-Wrapper (Fullscreen-Design)
- Cookie Consent wird angezeigt

### Klassische Landing Page
- Verwendet Layout-Komponente (Header + Footer)
- Lädt Site-Settings aus Supabase
- Einfache, statische Struktur
- Cookie Consent wird angezeigt

---

## 📝 Hinweise für Entwickler

### Neue Route hinzufügen

Um eine neue Route hinzuzufügen, bearbeiten Sie `src/App.tsx`:

```typescript
// Route-Typ erweitern
type Route = 'landing' | 'landing-old' | 'neue-route' | ...;

// Route-Handling hinzufügen
if (path === '/neue-route') {
  setAppState({ route: 'neue-route' });
}
```

### Links zwischen Landing Pages

Beide Komponenten unterstützen Callback-Funktionen:
- `onNavigateToOld` - Für Navigation zur klassischen Version
- `onNavigateToNew` - Für Navigation zur neuen Version

---

## ✅ Status

- ✅ Beide Landing Pages funktionieren
- ✅ Wechsel zwischen Versionen möglich
- ✅ Links auf beiden Seiten vorhanden
- ✅ Separate Routen implementiert
- ✅ Dokumentation vollständig

---

**Beide Landing Pages sind einsatzbereit! 🎉**

