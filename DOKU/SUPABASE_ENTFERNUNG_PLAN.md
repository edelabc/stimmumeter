# 🚀 Plan: Supabase entfernen - Projekt auf MySQL umstellen

**Datum:** 2025-01-23  
**Ziel:** Vollständige Entfernung von Supabase, Umstellung auf MySQL + PHP-APIs

---

## 📋 Übersicht

Das Projekt verwendet aktuell Supabase für:
1. **Authentifizierung** (Login, Registrierung, Passwort-Reset)
2. **Datenbankzugriffe** (direkt vom Frontend)
3. **Session-Management**

**Ziel:** Alles auf MySQL + PHP-APIs umstellen.

---

## 🔧 Umstellungsplan

### Phase 1: Authentifizierungssystem ✅ PRIORITÄT

#### 1.1 PHP-Authentifizierungs-API erstellen
- `api/auth.php` - Login, Registrierung, Logout
- `api/session.php` - Session-Verwaltung
- Passwort-Hashing mit `password_hash()` / `password_verify()`
- JWT-Token oder Session-basierte Authentifizierung

#### 1.2 Frontend-Auth anpassen
- `src/lib/auth.ts` - Umstellen auf PHP-API-Aufrufe
- Session-Token im localStorage speichern
- API-Client für Authentifizierung verwenden

### Phase 2: Datenbank-APIs erstellen

#### 2.1 Basis-APIs
- `api/users.php` - Benutzer-Verwaltung
- `api/pseudonyms.php` - Pseudonyme
- `api/mood-indicators.php` - Stimmungsindikatoren
- `api/mood-entries.php` - Stimmungseinträge
- `api/agreements.php` - Vereinbarungen
- `api/menu.php` - Menü-Verwaltung
- `api/admin.php` - Admin-Funktionen

#### 2.2 Frontend-Services anpassen
- `src/lib/agreement.service.ts` → PHP-API verwenden
- `src/lib/billing.ts` → PHP-API verwenden
- `src/lib/admin.ts` → PHP-API verwenden
- Alle Komponenten, die Supabase verwenden

### Phase 3: Komponenten anpassen

#### 3.1 Hauptkomponenten
- `src/MoodApp.tsx` - Mood-Daten über PHP-API
- `src/components/AuthForm.tsx` - Neue Auth-API verwenden
- `src/components/Header.tsx` - Session-basierte Auth
- Alle Admin-Komponenten

#### 3.2 Supabase-Abhängigkeiten entfernen
- `src/lib/supabase.ts` - Entfernen oder deaktivieren
- `src/lib/supabase-helper.ts` - Entfernen
- Alle `import { supabase }` Statements entfernen

### Phase 4: Cleanup

#### 4.1 Abhängigkeiten entfernen
- `package.json` - `@supabase/supabase-js` entfernen
- `.env` - Supabase-Variablen entfernen

#### 4.2 Dokumentation
- README aktualisieren
- Setup-Anleitung anpassen

---

## 🎯 Implementierungsreihenfolge

1. ✅ **Authentifizierungs-API** (PHP)
2. ✅ **Frontend-Auth** anpassen
3. ✅ **Basis-Datenbank-APIs** erstellen
4. ✅ **Frontend-Services** anpassen
5. ✅ **Komponenten** anpassen
6. ✅ **Cleanup** - Supabase entfernen

---

## 📝 Technische Details

### Authentifizierung
- **Backend:** PHP Sessions + JWT-Token (optional)
- **Frontend:** Token im localStorage
- **Passwort-Hashing:** `password_hash()` / `password_verify()`

### API-Struktur
```
/api/
  auth.php          - Login, Registrierung, Logout
  session.php       - Session-Verwaltung
  users.php         - Benutzer-CRUD
  pseudonyms.php    - Pseudonym-CRUD
  mood-indicators.php - Indikator-CRUD
  mood-entries.php  - Eintrag-CRUD
  agreements.php    - Vereinbarungs-CRUD
  menu.php          - Menü-Verwaltung
  admin.php         - Admin-Funktionen
```

### Frontend-API-Client
- Verwendet `src/lib/api-client.ts` (bereits vorhanden)
- Alle Requests über PHP-APIs
- Token-basierte Authentifizierung

---

**Status:** 🚧 In Arbeit



