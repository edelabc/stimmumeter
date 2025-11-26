# 📊 Supabase: Funktionen und warum wir es nicht einfach entfernen können

**Datum:** 2025-01-23  
**Status:** Migration zu MySQL in Arbeit (~30% abgeschlossen)

---

## 🔍 Was ist Supabase und welche Funktionen hat es?

Supabase ist eine **Backend-as-a-Service (BaaS)** Plattform, die mehrere Funktionen bietet:

### 1. **Authentifizierung (Auth)**
- ✅ Benutzer-Registrierung
- ✅ Login/Logout
- ✅ Passwort-Reset
- ✅ Session-Management
- ✅ JWT-Token-Verwaltung
- ✅ Benutzer-Profile-Verwaltung

### 2. **Datenbank (PostgreSQL)**
- ✅ Direkte Datenbankzugriffe vom Frontend
- ✅ Real-time Updates (WebSocket-Verbindungen)
- ✅ Automatische API-Generierung
- ✅ Row Level Security (RLS)

### 3. **Storage**
- ✅ Datei-Upload/Download
- ✅ Bild-Verwaltung
- ✅ Asset-Management

### 4. **Edge Functions**
- ✅ Serverless-Funktionen
- ✅ Stripe-Integration (Zahlungsabwicklung)
- ✅ Webhook-Verarbeitung

---

## 📦 Wo wird Supabase aktuell verwendet?

### **Statistik:**
- **39 Dateien** verwenden Supabase
- **~155 Supabase-Aufrufe** im gesamten Code
- **~70% noch nicht migriert** zu MySQL/PHP-APIs

### **Hauptverwendungsbereiche:**

#### 1. **Authentifizierung** (9 Aufrufe)
**Dateien:**
- `src/lib/auth.ts` - Login, Registrierung, Logout
- `src/components/AuthForm.tsx` - Login-Formular
- `src/components/AccountSettings.tsx` - Account-Verwaltung

**Status:** ✅ **BEREITS MIGRIERT** zu MySQL (`api/auth.php`)

#### 2. **Billing & Zahlungen** (40+ Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/lib/billing.ts` - **40 Supabase-Aufrufe**
  - Währungen verwalten
  - Tarifpläne verwalten
  - Abonnements verwalten
  - Kontotransaktionen
  - Rechnungen erstellen
- `src/lib/stripe-service.ts` - Stripe-Integration
- `src/components/UserBillingPortal.tsx` - Billing-Interface
- `src/components/AccountStatement.tsx` - Kontoauszüge
- `src/components/PaymentSuccess.tsx` - Zahlungsbestätigung

**Status:** ❌ **NICHT MIGRIERT** - Benötigt `/api/billing.php`

#### 3. **Stimmungsindikatoren** (11 Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/components/admin/StandardIndicatorsManagement.tsx` - **11 Aufrufe**
  - Indikatoren erstellen/bearbeiten/löschen
  - Kategorien verwalten
  - Icon-Uploads
- `src/lib/admin.ts` - Admin-Funktionen

**Status:** ❌ **NICHT MIGRIERT** - Benötigt erweiterte `/api/mood-indicators.php`

#### 4. **AI-Konfigurationen** (9 Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/components/AIConfiguration.tsx` - **9 Aufrufe**
  - AI-Provider konfigurieren (OpenAI, Gemini, Claude, etc.)
  - API-Keys verwalten
  - Modelle auswählen
  - System-Prompts verwalten
- `src/lib/ai-service.ts` - AI-Service-Integration

**Status:** ❌ **NICHT MIGRIERT** - Benötigt `/api/ai-configurations.php`

#### 5. **Vereinbarungen (Agreements)** (9 Aufrufe) 🟡 **TEILWEISE**
**Dateien:**
- `src/lib/agreement.service.ts` - **9 Aufrufe**
  - Vereinbarungen erstellen/bearbeiten
  - Versionshistorie
  - Aktionsprotokolle
  - Platzhalter-Definitionen
- `src/components/admin/AgreementsManagement.tsx` - Admin-Interface

**Status:** 🟡 **TEILWEISE MIGRIERT** - Basis-Funktionen ✅, erweiterte Funktionen ❌

#### 6. **Benutzer-Verwaltung** (8 Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/components/admin/UserManagement.tsx` - **8 Aufrufe**
  - Benutzer auflisten
  - Benutzer bearbeiten/löschen
  - Admin-Rechte verwalten
  - Benutzer blockieren/entsperren

**Status:** ❌ **NICHT MIGRIERT** - Benötigt `/api/users.php`

#### 7. **Menü & Navigation** (6 Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/components/Header.tsx` - **6 Aufrufe**
  - Menü-Items laden
  - Site-Einstellungen
  - Navigation
- `src/components/admin/MenuManagement.tsx` - Menü-Verwaltung
- `src/components/admin/FooterMenuManagement.tsx` - Footer-Menü

**Status:** ❌ **NICHT MIGRIERT** - Benötigt `/api/menu-items.php`, `/api/site-settings.php`

#### 8. **Master-Daten** (6 Aufrufe) 🔴 **KRITISCH**
**Dateien:**
- `src/components/MasterDataSettings.tsx` - **6 Aufrufe**
  - Basis-Daten verwalten
  - Konfigurationen

**Status:** ❌ **NICHT MIGRIERT** - Benötigt `/api/master-data.php`

#### 9. **Rechtliche Seiten** (4 Aufrufe) 🟡 **MITTEL**
**Dateien:**
- `src/components/admin/LegalPagesManagement.tsx` - Rechtliche Seiten verwalten
- `src/components/LegalPageViewer.tsx` - Seiten anzeigen
- `src/components/admin/FooterManagement.tsx` - Footer-Verwaltung

**Status:** ❌ **NICHT MIGRIERT**

#### 10. **Audit-Logs** (1 Aufruf) 🟢 **NIEDRIG**
**Dateien:**
- `src/components/admin/AuditLogViewer.tsx` - Audit-Logs anzeigen

**Status:** ❌ **NICHT MIGRIERT**

---

## ⚠️ Warum können wir Supabase nicht einfach entfernen?

### **1. Viele kritische Funktionen hängen noch daran**

#### **Billing-System** (40 Aufrufe)
```typescript
// src/lib/billing.ts
- loadCurrencies() - Währungen laden
- loadPricingPlans() - Tarifpläne laden
- loadSubscriptions() - Abonnements laden
- createSubscription() - Abonnement erstellen
- loadTransactions() - Transaktionen laden
- createInvoice() - Rechnung erstellen
// ... und viele mehr
```
**Ohne Migration:** ❌ Keine Zahlungsabwicklung möglich

#### **Admin-Funktionen**
```typescript
// src/components/admin/StandardIndicatorsManagement.tsx
- loadIndicators() - Indikatoren laden
- createIndicator() - Indikator erstellen
- updateIndicator() - Indikator aktualisieren
- deleteIndicator() - Indikator löschen
- uploadIcon() - Icon hochladen
```
**Ohne Migration:** ❌ Keine Admin-Funktionen möglich

#### **AI-Konfigurationen**
```typescript
// src/components/AIConfiguration.tsx
- loadConfigurations() - AI-Konfigurationen laden
- createConfiguration() - Neue Konfiguration erstellen
- updateConfiguration() - Konfiguration aktualisieren
- testConfiguration() - Konfiguration testen
```
**Ohne Migration:** ❌ Keine AI-Funktionen möglich

### **2. Komplexe Datenstrukturen**

Supabase verwendet **PostgreSQL** mit komplexen Beziehungen:
- **Foreign Keys** zwischen Tabellen
- **Junction Tables** für viele-zu-viele Beziehungen
- **Real-time Subscriptions** für Live-Updates
- **Row Level Security** für Zugriffskontrolle

Diese müssen in **MySQL** nachgebaut werden.

### **3. Edge Functions**

Supabase Edge Functions werden für **Stripe-Integration** verwendet:
- `create-checkout-session` - Checkout-Session erstellen
- `stripe-webhook` - Webhook-Verarbeitung
- `verify-payment-session` - Zahlung verifizieren

Diese müssen als **PHP-Endpunkte** neu implementiert werden.

### **4. Typen und Interfaces**

Viele TypeScript-Typen werden aus Supabase importiert:
```typescript
import { Pseudonym, MoodIndicator, AIConfiguration } from './lib/supabase';
```

Diese müssen in separate Dateien verschoben werden.

---

## 🚧 Aktueller Migrations-Status

### ✅ **Bereits migriert (~30%)**

1. **Authentifizierung** ✅
   - `api/auth.php` - Vollständig implementiert
   - `src/lib/auth-mysql.ts` - Frontend-Integration
   - `src/lib/auth.ts` - Umgestellt auf MySQL

2. **Mood-Daten** ✅
   - `api/pseudonyms.php` - Pseudonyme CRUD
   - `api/mood-indicators.php` - Indikatoren CRUD (Basis)
   - `api/mood-entries.php` - Einträge CRUD
   - `src/lib/mood-api-mysql.ts` - Frontend-Integration
   - `src/MoodApp.tsx` - Umgestellt auf MySQL

3. **Vereinbarungen** 🟡 (Teilweise)
   - `api/agreements.php` - Basis-Funktionen ✅
   - Erweiterte Funktionen ❌

### ❌ **Noch zu migrieren (~70%)**

1. **Billing-System** ❌ (40 Aufrufe)
   - Benötigt: `/api/billing.php`
   - Komplex: Währungen, Tarifpläne, Abonnements, Transaktionen, Rechnungen

2. **Admin-Funktionen** ❌ (11+ Aufrufe)
   - Benötigt: Erweiterte `/api/mood-indicators.php`
   - Komplex: Icon-Uploads, Kategorien

3. **AI-Konfigurationen** ❌ (9 Aufrufe)
   - Benötigt: `/api/ai-configurations.php`
   - Komplex: Verschlüsselte API-Keys

4. **Benutzer-Verwaltung** ❌ (8 Aufrufe)
   - Benötigt: `/api/users.php`
   - Komplex: Admin-Rechte, Blockierung

5. **Menü & Navigation** ❌ (6 Aufrufe)
   - Benötigt: `/api/menu-items.php`, `/api/site-settings.php`

6. **Master-Daten** ❌ (6 Aufrufe)
   - Benötigt: `/api/master-data.php`

7. **Rechtliche Seiten** ❌ (4 Aufrufe)
   - Benötigt: `/api/legal-pages.php`

8. **Payment Provider** ❌ (12 Aufrufe)
   - Benötigt: `/api/payment-providers.php`

---

## 💡 Lösung: Schrittweise Migration

### **Option 1: Komplette Migration** (Empfohlen)
1. ✅ Phase 1: Authentifizierung (ABGESCHLOSSEN)
2. 🚧 Phase 2: Kritische Module (IN ARBEIT)
   - Billing-System
   - Admin-Funktionen
   - AI-Konfigurationen
3. ⏳ Phase 3: Weitere Module
   - Benutzer-Verwaltung
   - Menü & Navigation
   - Master-Daten
4. ⏳ Phase 4: Cleanup
   - Supabase-Bibliothek entfernen
   - Typen in separate Dateien verschieben

### **Option 2: Supabase parallel betreiben**
- Supabase für nicht-migrierte Funktionen behalten
- MySQL für migrierte Funktionen verwenden
- Nach und nach migrieren

### **Option 3: Supabase komplett entfernen** (NICHT EMPFOHLEN)
- ❌ Würde ~70% der Funktionalität brechen
- ❌ Erfordert sofortige Migration aller Module
- ❌ Sehr riskant für Produktion

---

## 🎯 Empfehlung

**Aktuell:** Supabase **nicht entfernen**, sondern **schrittweise migrieren**

**Grund:**
1. ✅ Authentifizierung funktioniert bereits mit MySQL
2. ✅ Mood-Daten funktionieren bereits mit MySQL
3. ❌ Billing, Admin, AI-Funktionen benötigen noch Supabase
4. ⚠️ Entfernung würde kritische Funktionen brechen

**Nächste Schritte:**
1. Billing-System migrieren (`/api/billing.php`)
2. Admin-Funktionen erweitern
3. AI-Konfigurationen migrieren
4. Weitere Module migrieren
5. **Dann** Supabase entfernen

---

## 📝 Zusammenfassung

**Supabase wird verwendet für:**
- ✅ Authentifizierung (bereits migriert)
- ✅ Mood-Daten (bereits migriert)
- ❌ Billing & Zahlungen (40 Aufrufe)
- ❌ Admin-Funktionen (11+ Aufrufe)
- ❌ AI-Konfigurationen (9 Aufrufe)
- ❌ Benutzer-Verwaltung (8 Aufrufe)
- ❌ Menü & Navigation (6 Aufrufe)
- ❌ Weitere Module (~50+ Aufrufe)

**Warum nicht entfernen:**
- ⚠️ ~70% der Funktionalität würde brechen
- ⚠️ Kritische Module (Billing, Admin) hängen noch daran
- ⚠️ Komplexe Datenstrukturen müssen migriert werden
- ⚠️ Edge Functions müssen neu implementiert werden

**Lösung:**
- ✅ Schrittweise Migration (aktuell ~30% abgeschlossen)
- ✅ Supabase parallel betreiben bis Migration abgeschlossen
- ✅ Dann Supabase komplett entfernen



