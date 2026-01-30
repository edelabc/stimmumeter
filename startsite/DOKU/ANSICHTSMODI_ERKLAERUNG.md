# 🗺️ Ansichtsmodi - Erklärung

## Übersicht

Die **QuestionsFirst** Komponente bietet drei verschiedene Ansichtsmodi für die interaktive Karte. Jeder Modus zeigt die Stimmungsdaten auf unterschiedliche Weise und ist für verschiedene Anwendungsfälle optimiert.

---

## 1. 🗺️ Stimmungs-Ansicht (Standard)

### Beschreibung
Die **Standard-Ansicht** zeigt die Karte in einer klassischen Satellitenansicht mit interaktiven Markern für Stimmungsdaten.

### Technische Details
- **Karten-Typ:** Satellitenansicht (Satellite)
- **Neigung (Tilt):** 0° (flach, von oben)
- **Rotation:** Keine automatische Rotation
- **Zoom:** 5 (Übersicht über größeres Gebiet)

### Visuelle Elemente
- **Marker:** Farbcodierte Punkte auf der Karte
  - 🟢 Grün: Sehr positive Stimmung (z.B. Barcelona 87%)
  - 🔵 Blau: Positive Stimmung (z.B. Amsterdam 84%, München 79%)
  - 🟡 Gelb: Neutrale Stimmung (z.B. Berlin 65%)
- **Info-Karten:** Schwebende Overlays mit Details zu Städten
- **Klarheit:** Beste Übersicht für detaillierte Informationen

### Verwendungszweck
- ✅ Detaillierte Stimmungsinformationen einzelner Städte
- ✅ Vergleich verschiedener Standorte
- ✅ Präzise Datenanalyse
- ✅ Interaktion mit einzelnen Markern

### Beispiel
```
Barcelona: 87% Positiv 😄
Amsterdam: 84% Positiv 😊
München: 79% Positiv 😌
```

---

## 2. 🔥 Heat Map

### Beschreibung
Die **Heat Map Ansicht** zeigt Stimmungszonen als farbige, verschwommene Bereiche auf der Karte. Diese Ansicht macht regionale Stimmungstrends auf einen Blick sichtbar.

### Technische Details
- **Karten-Typ:** Satellitenansicht (Satellite)
- **Neigung (Tilt):** 0° (flach, von oben)
- **Rotation:** Keine automatische Rotation
- **Overlays:** Farbige Radial-Gradienten mit Blur-Effekt

### Visuelle Elemente
- **Grüne Zonen:** 
  - Position: 20% von oben, 30% von links
  - Größe: 200px × 200px
  - Bedeutung: Sehr positive Stimmungsgebiete
  - Opacity: 30% mit Blur-Effekt
  - Animation: Pulse (Atmungseffekt)

- **Rote Zonen:**
  - Position: 50% von oben, 60% von links
  - Größe: 150px × 150px
  - Bedeutung: Negative Stimmungsgebiete
  - Opacity: 30% mit Blur-Effekt
  - Animation: Pulse

- **Gelbe Zonen:**
  - Position: 70% von oben, 20% von links
  - Größe: 180px × 180px
  - Bedeutung: Neutrale Stimmungsgebiete
  - Opacity: 30% mit Blur-Effekt
  - Animation: Pulse

### Verwendungszweck
- ✅ Schnelle Übersicht über regionale Stimmungstrends
- ✅ Identifikation von Stimmungs-Hotspots
- ✅ Visuelle Darstellung von Stimmungsdichten
- ✅ Erkennung von Mustern über größere Gebiete

### Vorteile
- **Intuitive Visualisierung:** Farben zeigen sofort Stimmungslage
- **Übersicht:** Mehrere Gebiete gleichzeitig sichtbar
- **Trend-Erkennung:** Regionale Muster werden deutlich

---

## 3. 🌍 3D Globus

### Beschreibung
Die **3D Globus Ansicht** zeigt die Karte als rotierenden 3D-Globus mit Neigung. Diese Ansicht bietet eine immersive, dynamische Darstellung der Stimmungsdaten.

### Technische Details
- **Karten-Typ:** Satellitenansicht (Satellite)
- **Neigung (Tilt):** 45° (3D-Perspektive)
- **Rotation:** Automatisch, kontinuierlich
- **Rotationsgeschwindigkeit:** 0.2° pro Frame
- **Zoom:** 5 (Übersicht)

### Visuelle Elemente
- **3D-Perspektive:** 
  - Die Karte ist um 45° geneigt
  - Erzeugt Tiefeneffekt
  - Macht die Kugelform der Erde sichtbar

- **Automatische Rotation:**
  - Langsame, kontinuierliche Drehung
  - 360° in ca. 3 Sekunden (bei 60 FPS)
  - Smooth Animation mit `requestAnimationFrame`

- **Marker:** Bleiben sichtbar während Rotation
- **Dynamik:** Lebendige, interaktive Darstellung

### Verwendungszweck
- ✅ Beeindruckende Präsentation
- ✅ Globale Perspektive
- ✅ Immersive Benutzererfahrung
- ✅ Dynamische Visualisierung

### Vorteile
- **Visuell ansprechend:** Moderne, professionelle Darstellung
- **Globale Sicht:** Zeigt die Erde als Kugel
- **Dynamisch:** Bewegung zieht Aufmerksamkeit
- **Innovativ:** Zeigt technische Möglichkeiten

### Technische Implementierung
```typescript
// Rotation wird mit requestAnimationFrame gesteuert
let heading = 0;
const rotate = () => {
  heading = (heading + 0.2) % 360;
  mapInstanceRef.current.setHeading(heading);
  mapInstanceRef.current.setTilt(45);
  requestAnimationFrame(rotate);
};
```

---

## 🔄 Wechsel zwischen den Modi

### Navigation
- **Button:** Oben rechts auf der Karte
- **Klick:** Wechselt zwischen den drei Modi
- **Zyklus:** Stimmungs-Ansicht → Heat Map → 3D Globus → Stimmungs-Ansicht

### Button-States
- **🗺️ Stimmungs-Ansicht:** Blauer Button
- **🔥 Heat Map:** Grüner Button
- **🌍 3D Globus:** Lila Button

### Automatische Anpassungen
- **Karten-Einstellungen:** Werden automatisch angepasst
- **Overlays:** Erscheinen/verschwinden je nach Modus
- **Animation:** Startet/stoppt automatisch

---

## 📊 Vergleich der Modi

| Feature | Stimmungs-Ansicht | Heat Map | 3D Globus |
|---------|-------------------|----------|-----------|
| **Neigung** | 0° (flach) | 0° (flach) | 45° (3D) |
| **Rotation** | ❌ Keine | ❌ Keine | ✅ Automatisch |
| **Marker** | ✅ Sichtbar | ✅ Sichtbar | ✅ Sichtbar |
| **Overlays** | ❌ Keine | ✅ Farbige Zonen | ❌ Keine |
| **Detailliertheit** | ⭐⭐⭐ Hoch | ⭐⭐ Mittel | ⭐ Niedrig |
| **Übersicht** | ⭐⭐ Mittel | ⭐⭐⭐ Hoch | ⭐⭐⭐ Hoch |
| **Performance** | ⭐⭐⭐ Hoch | ⭐⭐ Mittel | ⭐ Niedrig |
| **Interaktivität** | ⭐⭐⭐ Hoch | ⭐⭐ Mittel | ⭐ Niedrig |

---

## 🎯 Empfohlene Verwendung

### Stimmungs-Ansicht verwenden für:
- Detaillierte Analyse einzelner Städte
- Vergleich spezifischer Standorte
- Präzise Datenabfrage
- Interaktive Erkundung

### Heat Map verwenden für:
- Schnelle Übersicht über Trends
- Identifikation von Hotspots
- Präsentation für Stakeholder
- Regionale Mustererkennung

### 3D Globus verwenden für:
- Beeindruckende Präsentationen
- Demo-Modus
- Globale Perspektive
- Visuell ansprechende Visualisierung

---

## 💡 Tipps

1. **Für Analyse:** Verwenden Sie die **Stimmungs-Ansicht** für detaillierte Informationen
2. **Für Übersicht:** Verwenden Sie die **Heat Map** für schnelle Trend-Erkennung
3. **Für Präsentation:** Verwenden Sie den **3D Globus** für beeindruckende Visualisierungen
4. **Performance:** Beachten Sie, dass der 3D Globus mehr Ressourcen benötigt
5. **Mobile:** Heat Map funktioniert am besten auf mobilen Geräten

---

**Alle drei Modi bieten einzigartige Perspektiven auf die Stimmungsdaten und können je nach Anwendungsfall optimal genutzt werden! 🎉**

