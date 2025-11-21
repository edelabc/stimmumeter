# 🌍 WAMELI - API & Implementierungsanleitung

## 📋 Übersicht
Diese Dokumentation beschreibt alle benötigten APIs, Endpoints und Konfigurationen für die neue WAMELI Landing Page mit 3D-Globus-Integration.

---

## 🗺️ Google Maps API Setup

### Schritt 1: Google Cloud Projekt erstellen

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Klicke auf "Projekt erstellen" oder wähle ein bestehendes
3. Notiere die Projekt-ID

### Schritt 2: APIs aktivieren

Aktiviere folgende APIs im Cloud Console:
- **Maps JavaScript API** (für die 3D-Karte)
- **Maps Embed API** (optional für Embeds)
- **Geocoding API** (für Standort-Auflösung)

```bash
# Oder via gcloud CLI:
gcloud services enable maps-backend.googleapis.com
gcloud services enable maps-embed-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
```

### Schritt 3: API-Key erstellen

1. Navigiere zu "APIs & Services" → "Anmeldedaten"
2. Klicke "+ ANMELDEDATEN ERSTELLEN" → "API-Schlüssel"
3. **WICHTIG: Beschränke den Key:**
   - HTTP-Referrer: `https://www.wameli.com/*` und `http://localhost:*/*`
   - API-Beschränkungen: Nur die aktivierten Maps APIs

### Schritt 4: Map ID für 3D-Features erstellen

1. Gehe zu "Google Maps Platform" → "Map Management"
2. Erstelle eine neue Map ID mit:
   - Map type: **JavaScript**
   - Raster: **Vector**
   - Features: **Tilt**, **Rotation**, **3D Buildings**

---

## 🔌 Backend API Endpoints

### 1. Live Mood Data Endpoint

**Endpoint:** `GET /api/mood/live`

**Query Parameters:**
- `time_window` (string): Zeitfenster für Aggregation
  - Werte: `15m`, `1h`, `24h`, `7d`
  - Default: `15m`
- `zoom` (number): Zoom-Level für Clustering
  - Range: 1-10
  - Default: 5
- `bounds` (optional): Geografische Grenzen
  - Format: `lat1,lng1,lat2,lng2`

**Response Format:**
```json
{
  "time_window": "15m",
  "generated_at": "2025-11-21T12:00:00Z",
  "total_entries": 5432,
  "cells": [
    {
      "lat": 50.94,
      "lng": 6.96,
      "mood_score": 0.42,
      "state": "positive",
      "count": 128,
      "city": "Köln",
      "country": "Deutschland",
      "dominant_indicator": "optimistisch",
      "top_indicators": [
        {"name": "optimistisch", "emoji": "😊", "share": 0.32},
        {"name": "motiviert", "emoji": "💪", "share": 0.21},
        {"name": "freundlich", "emoji": "🤗", "share": 0.19}
      ]
    }
  ]
}
```

**SQL Implementation (PostgreSQL + PostGIS):**
```sql
-- Aggregations-Query für Live-Mood-Data
WITH time_filtered AS (
  SELECT 
    e.*,
    i.category,
    i.name as indicator_name,
    i.emoji,
    ST_SnapToGrid(
      ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326),
      0.1  -- Grid-Größe in Grad
    ) as grid_point
  FROM mood_entries e
  JOIN mood_indicators i ON e.indicator_id = i.id
  WHERE e.created_at > NOW() - INTERVAL '15 minutes'
),
aggregated AS (
  SELECT 
    ST_Y(grid_point) as lat,
    ST_X(grid_point) as lng,
    COUNT(*) as count,
    AVG(CASE 
      WHEN category = 'positiv' THEN value / 10.0
      WHEN category = 'negativ' THEN -value / 10.0
      ELSE 0
    END) as mood_score,
    MODE() WITHIN GROUP (ORDER BY indicator_name) as dominant_indicator
  FROM time_filtered
  GROUP BY grid_point
)
SELECT 
  lat, lng, count, mood_score, dominant_indicator,
  CASE 
    WHEN mood_score >= 0.2 THEN 'positive'
    WHEN mood_score <= -0.2 THEN 'negative'
    ELSE 'neutral'
  END as state
FROM aggregated
ORDER BY count DESC;
```

### 2. User Guess Verification

**Endpoint:** `POST /api/mood/guess`

**Request Body:**
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "lat": 50.94,
  "lng": 6.96,
  "guess": "positive",
  "timestamp": "2025-11-21T12:00:00Z",
  "captcha_token": "recaptcha-token"
}
```

**Response:**
```json
{
  "correct": true,
  "actual_state": "positive",
  "yra_earned": 10,
  "streak": 5,
  "total_yra_balance": 250,
  "next_location": {
    "lat": 52.52,
    "lng": 13.40,
    "hint": "Hauptstadt mit bewegter Geschichte"
  }
}
```

### 3. User Registration & Pseudonym Management

**Endpoint:** `POST /api/user/pseudonyms`

**Request Body:**
```json
{
  "user_id": "uuid",
  "pseudonyms": [
    {
      "name": "Partner",
      "type": "partner",
      "color": "#FF6B6B"
    },
    {
      "name": "Kind 1",
      "type": "family",
      "color": "#4ECDC4"
    }
  ]
}
```

### 4. Mood Entry Submission

**Endpoint:** `POST /api/mood/entry`

**Request Body:**
```json
{
  "user_id": "uuid",
  "pseudonym_id": "uuid",
  "indicator_id": 23,
  "value": 7.5,
  "latitude": 50.9375,
  "longitude": 6.9603,
  "weather_data": {
    "temperature": 18,
    "condition": "sunny"
  }
}
```

### 5. YRA Token Management

**Endpoint:** `GET /api/user/yra-balance/{user_id}`

**Response:**
```json
{
  "user_id": "uuid",
  "balance": 1250,
  "lifetime_earned": 5000,
  "current_streak": 7,
  "global_rank": 342,
  "recent_transactions": [
    {
      "type": "earned",
      "amount": 10,
      "reason": "correct_guess",
      "timestamp": "2025-11-21T12:00:00Z"
    }
  ]
}
```

---

## 🛡️ Bot-Schutz & Sicherheit

### 1. reCAPTCHA v3 Integration

```javascript
// Frontend Implementation
const verifyCaptcha = async () => {
  const token = await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', {
    action: 'mood_guess'
  });
  return token;
};
```

### 2. Rate Limiting

```typescript
// Backend Middleware
const rateLimiter = {
  guesses: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 30, // Max 30 Guesses pro 15 Min
    message: 'Zu viele Versuche. Bitte warte etwas.'
  },
  entries: {
    windowMs: 60 * 1000, // 1 Minute
    max: 5 // Max 5 Einträge pro Minute
  }
};
```

### 3. Session Validation

```sql
-- Session-basierte Validierung
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_token VARCHAR(255) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT true
);
```

---

## 🗄️ Datenbank-Schema

### Erweiterte Tabellen

```sql
-- YRA Token Tabelle
CREATE TABLE yra_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(50), -- 'earned', 'spent', 'bonus'
  reason VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guess History
CREATE TABLE guess_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  guessed_state VARCHAR(20),
  actual_state VARCHAR(20),
  correct BOOLEAN,
  yra_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pseudonym Management
CREATE TABLE user_pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50), -- 'self', 'partner', 'family', 'other'
  color VARCHAR(7),
  avatar_emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geolocation Cache
CREATE TABLE location_cache (
  lat FLOAT,
  lng FLOAT,
  city VARCHAR(255),
  country VARCHAR(255),
  country_code VARCHAR(2),
  timezone VARCHAR(50),
  PRIMARY KEY (lat, lng)
);

-- Indexes für Performance
CREATE INDEX idx_mood_entries_created ON mood_entries(created_at DESC);
CREATE INDEX idx_mood_entries_location ON mood_entries USING GIST(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX idx_guess_history_user ON guess_history(user_id, created_at DESC);
```

---

## 🚀 Deployment Checkliste

### Frontend
- [ ] Google Maps API Key in Umgebungsvariable
- [ ] reCAPTCHA Site Key konfiguriert
- [ ] WebSocket/SSE für Live-Updates
- [ ] PWA Manifest für Mobile
- [ ] Service Worker für Offline-Funktionalität

### Backend
- [ ] PostgreSQL mit PostGIS Extension
- [ ] Redis für Session-Cache
- [ ] Rate Limiting Middleware
- [ ] CORS konfiguriert
- [ ] SSL/TLS Zertifikat

### Monitoring
- [ ] Error Tracking (Sentry)
- [ ] Performance Monitoring
- [ ] User Analytics (DSGVO-konform)
- [ ] YRA Token Audit Log

---

## 📱 Progressive Web App Features

```json
// manifest.json
{
  "name": "WAMELI - Globaler Stimmungs-Tracker",
  "short_name": "WAMELI",
  "description": "Fühle den Puls der Welt",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🎮 Gamification-System

### YRA Token Vergabe-Regeln

| Aktion | YRA Belohnung | Bedingung |
|--------|---------------|-----------|
| Richtige Vorhersage | 10 | Standard |
| Perfekte Streak (5) | 25 | Bonus |
| Perfekte Streak (10) | 100 | Bonus |
| Täglicher Login | 5 | 1x pro Tag |
| Mood Entry | 2 | Max 10x/Tag |
| Freund einladen | 50 | Bei Registrierung |

### Level-System

```javascript
const calculateLevel = (totalYRA) => {
  const levels = [
    { level: 1, minYRA: 0, title: "Emotions-Neuling" },
    { level: 2, minYRA: 100, title: "Gefühls-Entdecker" },
    { level: 3, minYRA: 500, title: "Stimmungs-Analyst" },
    { level: 4, minYRA: 1500, title: "Emotions-Experte" },
    { level: 5, minYRA: 5000, title: "Global-Empath" },
    // ...
  ];
  return levels.findLast(l => totalYRA >= l.minYRA);
};
```

---

## 📞 Support & Kontakt

Bei Fragen zur Implementation:
- Technische Docs: `/docs/api`
- Status Page: `status.wameli.com`
- Support: `support@wameli.com`

---

## ⚡ Performance-Optimierung

### Caching-Strategie
```javascript
// Redis Cache für aggregierte Daten
const getCachedMoodData = async (timeWindow, bounds) => {
  const cacheKey = `mood:${timeWindow}:${bounds}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const data = await aggregateMoodData(timeWindow, bounds);
  await redis.setex(cacheKey, 30, JSON.stringify(data)); // 30 Sek Cache
  
  return data;
};
```

### Database Partitioning
```sql
-- Partitionierung der mood_entries nach Datum
CREATE TABLE mood_entries_2025_11 PARTITION OF mood_entries
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

---

Diese Dokumentation enthält alle notwendigen Informationen für die Implementierung. Passe die Endpoints und Konfigurationen an deine spezifischen Anforderungen an.