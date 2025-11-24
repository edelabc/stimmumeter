# 📊 Datenbankanbindung-Analyse - Stimmumeter Projekt

**Erstellt:** 2025-01-23  
**Zweck:** Vollständige Übersicht aller Datenbankanbindungen im Projekt

---

## 🔍 Übersicht

Das Projekt verwendet **zwei Datenbanksysteme** parallel:

1. **Supabase (PostgreSQL)** - Hauptdatenbank für Frontend-Anwendungen
2. **MySQL** - Lokale/Produktions-Datenbank für PHP-Backend

---

## 1️⃣ SUPABASE-ANBINDUNG (Frontend/TypeScript)

### 📁 Konfigurationsdateien

#### `src/lib/supabase.ts`
- **Zweck:** Haupt-Supabase-Client-Initialisierung
- **Umgebungsvariablen:**
  - `VITE_SUPABASE_URL` - Supabase Projekt-URL
  - `VITE_SUPABASE_ANON_KEY` - Anon Public Key
- **Exportiert:** `supabase` Client, `isSupabaseConfigured()` Funktion

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### `src/lib/supabase-helper.ts`
- **Zweck:** Helper-Funktionen für sichere Supabase-Verwendung
- **Funktionen:**
  - `getSupabaseClient()` - Gibt Supabase Client zurück oder wirft Fehler
  - `safeSupabaseCall()` - Sichere Supabase-Aufrufe mit Fehlerbehandlung

#### `config.local.php` / `config.production.php`
- **Zweck:** PHP-Konfiguration (Fallback für Supabase-Credentials)
- **Konstanten:**
  - `SUPABASE_URL` - Aus Umgebungsvariablen geladen
  - `SUPABASE_ANON_KEY` - Aus Umgebungsvariablen geladen

---

### 📦 Verwendete Komponenten & Services

#### **Authentifizierung**
- **`src/lib/auth.ts`**
  - `signUp()` - Registrierung mit Supabase Auth
  - `signIn()` - Login mit Supabase Auth
  - `signOut()` - Logout
  - `getCurrentUser()` - Aktueller Benutzer
  - Verwendet: `supabase.auth.*` und `supabase.from('user_profiles')`

#### **Mood-Daten**
- **`src/MoodApp.tsx`**
  - `loadIndicators()` - Lädt `mood_indicators` aus Supabase
  - `loadMoodEntries()` - Lädt `mood_entries` und `mood_indicator_values`
  - `handleCreateOrUpdatePseudonym()` - CRUD für `pseudonyms`
  - Verwendet: `supabase.from('mood_indicators')`, `supabase.from('mood_entries')`, etc.

#### **Vereinbarungen (Agreements)**
- **`src/lib/agreement.service.ts`**
  - `getAllAgreements()` - Lädt alle Vereinbarungen
  - `getAgreementById()` - Lädt einzelne Vereinbarung
  - `createAgreement()` - Erstellt neue Vereinbarung
  - `updateAgreement()` - Aktualisiert Vereinbarung
  - Verwendet: `supabase.from('t_vereinbarungen')`, `supabase.from('t_vereinbarungstitel')`

#### **Billing & Abrechnung**
- **`src/lib/billing.ts`**
  - `getUserSubscription()` - Lädt Benutzer-Abonnement
  - `getUserInvoices()` - Lädt Rechnungen
  - `getUserUsageRecords()` - Lädt Nutzungsdaten
  - Verwendet: `supabase.from('user_subscriptions')`, `supabase.from('invoices')`, etc.

#### **Admin-Funktionen**
- **`src/lib/admin.ts`**
  - Admin-spezifische Supabase-Abfragen
  - Verwendet: `supabase.from('admin_users')`, `supabase.from('admin_menu_items')`

#### **Weitere Komponenten mit Supabase-Anbindung:**
- `src/components/AccountSettings.tsx` - Benutzerprofil-Verwaltung
- `src/components/UserBillingPortal.tsx` - Abrechnungsportal
- `src/components/PseudonymList.tsx` - Pseudonym-Verwaltung
- `src/components/MoodEntryHistory.tsx` - Stimmungshistorie
- `src/components/admin/MenuManagement.tsx` - Menü-Verwaltung
- `src/components/admin/FooterMenuManagement.tsx` - Footer-Verwaltung
- `src/components/admin/AgreementsManagement.tsx` - Vereinbarungs-Verwaltung
- `src/components/admin/StandardIndicatorsManagement.tsx` - Indikatoren-Verwaltung
- `src/components/admin/UserManagement.tsx` - Benutzer-Verwaltung
- `src/components/admin/LegalPagesManagement.tsx` - Rechtstexte-Verwaltung
- `src/components/admin/FooterManagement.tsx` - Footer-Einstellungen
- `src/components/LegalPageViewer.tsx` - Rechtstexte-Anzeige
- `src/components/AIConfiguration.tsx` - KI-Konfiguration
- `src/components/Charts.tsx` - Diagramme (lädt Daten aus Supabase)
- `src/components/ForecastView.tsx` - Prognose-Ansicht

---

### 🔌 Supabase Edge Functions

#### `supabase/functions/create-checkout-session/index.ts`
- Erstellt Stripe Checkout-Session
- Verwendet Supabase Client intern

#### `supabase/functions/stripe-webhook/index.ts`
- Verarbeitet Stripe Webhooks
- Aktualisiert Supabase-Datenbank

#### `supabase/functions/verify-payment-session/index.ts`
- Verifiziert Zahlungssitzungen
- Aktualisiert Supabase-Datenbank

---

## 2️⃣ MYSQL-ANBINDUNG (Backend/PHP)

### 📁 Konfigurationsdateien

#### `config.local.php` (Lokale Entwicklung)
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'wameli');
define('DB_SOCKET', '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock');
```

#### `config.production.php` (Produktions-Server)
```php
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_USER', 'TrastimoGmbHsql6');
define('DB_PASS', 'cmjVKrwdog');
define('DB_NAME', 'wameli');
```

---

### 📦 PHP-Dateien mit MySQL-Anbindung

#### **Haupt-Datenbankverbindung**
- **`api/db.php`**
  - Erstellt PDO-Verbindung zu MySQL
  - Auto-Setup: Erstellt Datenbank falls nicht vorhanden
  - Auto-Migration: Prüft fehlende Tabellen und führt Schema-Migrationen aus
  - Verwendet: `config.local.php` oder `config.production.php`

#### **Session-Management**
- **`api/session_manager.php`**
  - Verwaltet PHP-Sessions
  - Speichert Session-Daten in MySQL-Tabelle `session_yra`
  - Verwendet: MySQL PDO-Verbindung

#### **Mood-Assessments**
- **`api/assessments.php`**
  - API-Endpoint für Mood-Assessments
  - Speichert Daten in MySQL-Tabelle `mood_assessments`
  - Verwendet: MySQL PDO-Verbindung

#### **Auto-Setup & Migration**
- **`api/auto-setup.php`**
  - Klasse `AutoSetup` - Erstellt fehlende Tabellen automatisch
  - Verwendet: MySQL PDO-Verbindung

- **`api/schema-migrator.php`**
  - Klasse `SchemaMigrator` - Führt Schema-Migrationen aus
  - Verwendet: MySQL PDO-Verbindung

#### **Datenbank-Setup-Skripte**
- **`scripts/setup-database-local.php`** - Lokales Datenbank-Setup
- **`scripts/setup-database-production.php`** - Produktions-Datenbank-Setup
- **`scripts/create-all-tables.php`** - Erstellt alle Tabellen
- **`scripts/auto-setup-database.php`** - Automatisches Setup
- **`scripts/backup-database.php`** - Datenbank-Backup
- **`scripts/clone-supabase-to-mysql.php`** - Klont Supabase-Daten nach MySQL ⭐

---

## 3️⃣ DATENBANK-TABELLEN

### Supabase-Tabellen (PostgreSQL)

#### **Benutzer & Authentifizierung**
- `users_profile` / `user_profiles` - Benutzerprofile
- `admin_users` - Admin-Benutzer

#### **Mood-System**
- `pseudonyms` - Pseudonyme
- `mood_indicators` - Stimmungsindikatoren
- `indicator_categories` - Indikator-Kategorien
- `mood_entries` - Stimmungseinträge
- `mood_indicator_values` - Indikator-Werte
- `mood_assessments` - Stimmungsbewertungen

#### **Vereinbarungen**
- `t_vereinbarungstitel` - Vereinbarungstitel
- `t_vereinbarungen` - Vereinbarungen
- `t_vereinbarungs_logs` - Vereinbarungs-Logs
- `t_platzhalter_definitionen` - Platzhalter-Definitionen
- `user_agreement_consents` - Benutzer-Zustimmungen

#### **Navigation & Menü**
- `admin_menu_items` - Admin-Menüpunkte
- `menu_items` - Menüpunkte
- `footer_menu_items` - Footer-Menüpunkte
- `footer_settings` - Footer-Einstellungen
- `legal_pages` - Rechtstexte
- `site_settings` - Website-Einstellungen

#### **Billing & Zahlungen**
- `currencies` - Währungen
- `exchange_rates` - Wechselkurse
- `pricing_plans` - Preispläne
- `plan_trial_config` - Testversion-Konfiguration
- `plan_subscription_config` - Abonnement-Konfiguration
- `billing_item_types` - Abrechnungsposten-Typen
- `plan_billing_items` - Abrechnungsposten
- `user_subscriptions` - Benutzer-Abonnements
- `usage_records` - Nutzungsdaten
- `invoices` - Rechnungen
- `invoice_items` - Rechnungsposten
- `payment_providers` - Zahlungsanbieter
- `payment_provider_webhooks` - Webhook-Logs
- `payments` - Zahlungen

#### **KI & Konfiguration**
- `ai_configurations` - KI-Konfigurationen
- `user_account_config` - Benutzer-Kontokonfiguration
- `help_texts` - Hilfetexte

#### **Session & Sicherheit**
- `session_yra` - Session-Daten (auch in MySQL)
- `yra_rewards_config` - Belohnungs-Konfiguration
- `bot_protection_logs` - Bot-Schutz-Logs

---

### MySQL-Tabellen (Lokale/Produktions-Datenbank)

Die MySQL-Datenbank sollte **identisch** zu Supabase sein.  
Das Klon-Skript `clone-supabase-to-mysql.php` synchronisiert alle Daten.

---

## 4️⃣ DATENFLUSS

### Frontend → Supabase
```
React-Komponenten
  ↓
src/lib/supabase.ts (Client)
  ↓
Supabase REST API / PostgreSQL
```

### Backend → MySQL
```
PHP-API-Endpunkte (api/*.php)
  ↓
api/db.php (PDO-Verbindung)
  ↓
MySQL-Datenbank
```

### Synchronisation Supabase → MySQL
```
Supabase-Datenbank
  ↓
scripts/clone-supabase-to-mysql.php
  ↓
MySQL-Datenbank
```

---

## 5️⃣ UMWELTVARIABLEN

### `.env` Datei (Frontend)
```env
VITE_SUPABASE_URL=https://apacsqcodgyohiebjhjb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### PHP-Konfiguration
- `config.local.php` - Lokale Entwicklung
- `config.production.php` - Produktions-Server

---

## 6️⃣ WICHTIGE HINWEISE

### ⚠️ Duales System
- Das Projekt verwendet **beide Datenbanksysteme parallel**
- Frontend (React/TypeScript) → **Supabase**
- Backend (PHP) → **MySQL**

### 🔄 Synchronisation
- Das Skript `clone-supabase-to-mysql.php` klont alle Daten von Supabase nach MySQL
- Sollte regelmäßig ausgeführt werden, um Daten zu synchronisieren

### 🔐 Sicherheit
- Supabase-Anon-Key ist **öffentlich** (für Frontend)
- MySQL-Credentials sind **geheim** (nur Backend)
- `.env` Datei sollte **NICHT** ins Git-Repository

### 📊 Datenbankzugriff
- **Frontend:** Direkter Zugriff auf Supabase über REST API
- **Backend:** Direkter Zugriff auf MySQL über PDO
- **Keine direkte Verbindung** zwischen Frontend und MySQL (Sicherheit)

---

## 7️⃣ KLON-PROZESS

### Voraussetzungen
1. ✅ Supabase-Credentials in `.env` Datei
2. ✅ MySQL-Datenbank läuft (XAMPP)
3. ✅ MySQL-Credentials in `config.local.php`

### Ausführung
```bash
php scripts/clone-supabase-to-mysql.php
```

oder im Browser:
```
http://localhost/stimmumeter/scripts/clone-supabase-to-mysql.php
```

### Was passiert?
1. ✅ Backup der MySQL-Datenbank wird erstellt
2. ✅ Alle Tabellen werden von Supabase geladen
3. ✅ Daten werden in MySQL eingefügt/aktualisiert
4. ✅ Zusammenfassung wird angezeigt

---

## 8️⃣ FEHLERBEHEBUNG

### Supabase-Verbindungsfehler
- Prüfe `.env` Datei
- Prüfe `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`
- Prüfe ob Supabase-Projekt aktiv ist

### MySQL-Verbindungsfehler
- Prüfe `config.local.php` oder `config.production.php`
- Prüfe ob MySQL-Server läuft
- Prüfe Datenbank-Credentials

### Klon-Fehler
- Prüfe Supabase-Credentials
- Prüfe MySQL-Verbindung
- Prüfe ob Tabellen in MySQL existieren
- Prüfe Logs im Skript-Output

---

**Ende der Analyse**

