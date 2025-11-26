# ✅ Status: Supabase-Entfernung

**Datum:** 2025-01-23  
**Status:** 🚧 In Arbeit - Phase 1 abgeschlossen

---

## ✅ Abgeschlossen

### Phase 1: Authentifizierungssystem

#### ✅ Backend (PHP)
- ✅ `api/auth.php` - Vollständige Authentifizierungs-API erstellt
  - Registrierung (`signup`)
  - Login (`signin`)
  - Logout (`signout`)
  - Aktueller Benutzer (`user`)
  - Passwort-Reset (`reset-password`)
  - JWT-Token-Generierung
  - Session-Management
  - Passwort-Hashing mit `password_hash()`

#### ✅ Frontend (TypeScript)
- ✅ `src/lib/auth-mysql.ts` - Neue MySQL-basierte Auth-Funktionen
  - `signUp()` - Registrierung
  - `signIn()` - Login
  - `signOut()` - Logout
  - `getCurrentUser()` - Aktueller Benutzer
  - `resetPassword()` - Passwort-Reset
  - Token-Management (localStorage)
  - `getAuthHeaders()` - Authorization Header für API-Requests

- ✅ `src/lib/auth.ts` - Angepasst für Kompatibilität
  - Verwendet jetzt MySQL-Auth wenn aktiviert
  - Fallback auf Supabase falls deaktiviert
  - `useMySQLAuth = true` aktiviert MySQL-Auth

- ✅ `src/lib/api-client.ts` - Angepasst
  - Fügt automatisch Authorization Header hinzu
  - Verwendet Token aus localStorage

---

## 🚧 In Arbeit

### Phase 2: Datenbank-APIs erstellen

#### Noch zu erstellen:
- [ ] `api/users.php` - Benutzer-Verwaltung
- [ ] `api/pseudonyms.php` - Pseudonyme CRUD
- [ ] `api/mood-indicators.php` - Stimmungsindikatoren CRUD
- [ ] `api/mood-entries.php` - Stimmungseinträge CRUD
- [ ] `api/agreements.php` - Vereinbarungen CRUD
- [ ] `api/menu.php` - Menü-Verwaltung
- [ ] `api/admin.php` - Admin-Funktionen

### Phase 3: Frontend-Services anpassen

#### Noch anzupassen:
- [ ] `src/lib/agreement.service.ts` - PHP-API verwenden
- [ ] `src/lib/billing.ts` - PHP-API verwenden
- [ ] `src/lib/admin.ts` - PHP-API verwenden
- [ ] `src/MoodApp.tsx` - PHP-API verwenden
- [ ] Alle Komponenten, die Supabase verwenden

---

## 📝 Nächste Schritte

### 1. Datenbank-Schema anpassen
```sql
-- Füge password_hash Spalte hinzu falls nicht vorhanden
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;
```

### 2. Umgebungsvariablen setzen
```env
# .env Datei
VITE_API_BASE_URL=http://localhost/stimmumeter/api
```

### 3. Testen
1. Registrierung testen
2. Login testen
3. Logout testen
4. Session-Persistenz testen

### 4. Weitere APIs erstellen
- Beginne mit `api/pseudonyms.php`
- Dann `api/mood-indicators.php`
- Schrittweise alle APIs erstellen

### 5. Frontend-Komponenten anpassen
- Ersetze alle `supabase.from()` Aufrufe
- Verwende `apiClient.get()` / `apiClient.post()` statt Supabase

---

## 🔧 Konfiguration

### Backend (PHP)
- **Auth-API:** `api/auth.php`
- **Token-Secret:** Ändern Sie `'your-secret-key-change-in-production'` in `api/auth.php`
- **Session:** PHP Sessions werden verwendet

### Frontend (TypeScript)
- **Auth-Modul:** `src/lib/auth-mysql.ts`
- **API-Client:** `src/lib/api-client.ts`
- **Token-Speicherung:** localStorage (`auth_token`, `auth_user`)

---

## ⚠️ Wichtige Hinweise

1. **Token-Secret ändern:** Der JWT-Secret-Key muss in Produktion geändert werden!
2. **HTTPS verwenden:** In Produktion sollte HTTPS verwendet werden
3. **CORS konfigurieren:** CORS-Header sind aktuell auf `*` gesetzt (für Entwicklung)
4. **Passwort-Hashing:** Verwendet `password_hash()` mit `PASSWORD_DEFAULT`

---

## 📊 Fortschritt

- ✅ Authentifizierung: **100%**
- 🚧 Datenbank-APIs: **0%**
- 🚧 Frontend-Services: **0%**
- 🚧 Komponenten: **0%**

**Gesamt:** ~25% abgeschlossen

---

**Nächste Aktion:** Erstelle `api/pseudonyms.php` für Pseudonym-Verwaltung



