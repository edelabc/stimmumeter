# 🚀 Plan: Supabase komplett entfernen - Alle Funktionen behalten

**Datum:** 2025-01-23  
**Ziel:** Supabase komplett entfernen, alle Funktionen auf MySQL/PHP umstellen

---

## 📊 Aktueller Status

- ✅ **Bereits migriert (~30%):**
  - Authentifizierung (`api/auth.php`)
  - Mood-Daten (`api/pseudonyms.php`, `api/mood-indicators.php`, `api/mood-entries.php`)
  - Basis-Vereinbarungen (`api/agreements.php` - teilweise)

- ❌ **Noch zu migrieren (~70%):**
  - Billing-System (40 Aufrufe)
  - Payment Provider (12 Aufrufe)
  - Admin-Funktionen (11+ Aufrufe)
  - AI-Konfigurationen (9 Aufrufe)
  - Vereinbarungen erweitert (9 Aufrufe)
  - Benutzer-Verwaltung (8 Aufrufe)
  - Menü & Navigation (6 Aufrufe)
  - Master-Daten (6 Aufrufe)
  - Rechtliche Seiten (4 Aufrufe)
  - Weitere Module (~30+ Aufrufe)

---

## 🎯 Schritt-für-Schritt Plan

### **Phase 1: Kritische APIs erstellen** 🔴 **PRIORITÄT**

#### **1.1 Billing-System API** (`api/billing.php`)

**Benötigte Funktionen:**
```php
// Währungen
- GET    /api/billing.php?action=currencies          // Alle Währungen laden
- POST   /api/billing.php?action=currency            // Währung erstellen
- PUT    /api/billing.php?action=currency&id=X       // Währung aktualisieren
- DELETE /api/billing.php?action=currency&id=X       // Währung löschen

// Wechselkurse
- GET    /api/billing.php?action=exchange-rates      // Wechselkurse laden
- POST   /api/billing.php?action=exchange-rate       // Wechselkurs erstellen

// Tarifpläne
- GET    /api/billing.php?action=pricing-plans       // Alle Tarifpläne laden
- POST   /api/billing.php?action=pricing-plan        // Tarifplan erstellen
- PUT    /api/billing.php?action=pricing-plan&id=X  // Tarifplan aktualisieren
- DELETE /api/billing.php?action=pricing-plan&id=X  // Tarifplan löschen

// Abonnements
- GET    /api/billing.php?action=subscriptions       // Abonnements laden
- POST   /api/billing.php?action=subscription        // Abonnement erstellen
- PUT    /api/billing.php?action=subscription&id=X   // Abonnement aktualisieren
- DELETE /api/billing.php?action=subscription&id=X  // Abonnement löschen

// Transaktionen
- GET    /api/billing.php?action=transactions        // Transaktionen laden
- POST   /api/billing.php?action=transaction         // Transaktion erstellen

// Rechnungen
- GET    /api/billing.php?action=invoices            // Rechnungen laden
- POST   /api/billing.php?action=invoice             // Rechnung erstellen
- GET    /api/billing.php?action=invoice&id=X        // Rechnung abrufen
```

**Frontend-Datei:** `src/lib/billing.ts` (40 Aufrufe)

**Aufwand:** 🔴 **HOCH** (komplexe Datenstrukturen)

---

#### **1.2 Payment Provider API** (`api/payment-providers.php`)

**Status:** ✅ Bereits vorhanden (`api/payment-providers.php`)

**Prüfen:** Ob alle benötigten Funktionen vorhanden sind

**Frontend-Datei:** `src/lib/payment-providers.ts` (12 Aufrufe)

**Aufwand:** 🟡 **MITTEL**

---

#### **1.3 AI-Konfigurationen API** (`api/ai-configurations.php`)

**Benötigte Funktionen:**
```php
- GET    /api/ai-configurations.php                  // Alle Konfigurationen laden
- POST   /api/ai-configurations.php                  // Konfiguration erstellen
- PUT    /api/ai-configurations.php?id=X             // Konfiguration aktualisieren
- DELETE /api/ai-configurations.php?id=X             // Konfiguration löschen
- POST   /api/ai-configurations.php?action=test&id=X // Konfiguration testen
```

**Frontend-Datei:** `src/components/AIConfiguration.tsx` (9 Aufrufe)

**Besonderheit:** Verschlüsselte API-Keys speichern

**Aufwand:** 🟡 **MITTEL**

---

#### **1.4 Benutzer-Verwaltung API** (`api/users.php`)

**Status:** ✅ Bereits vorhanden (`api/users.php`)

**Prüfen:** Ob alle benötigten Funktionen vorhanden sind

**Benötigte Funktionen:**
```php
- GET    /api/users.php                              // Alle Benutzer laden
- GET    /api/users.php?id=X                         // Benutzer abrufen
- PUT    /api/users.php?id=X                         // Benutzer aktualisieren
- DELETE /api/users.php?id=X                         // Benutzer löschen
- POST   /api/users.php?action=block&id=X            // Benutzer blockieren
- POST   /api/users.php?action=unblock&id=X          // Benutzer entsperren
- POST   /api/users.php?action=set-admin&id=X        // Admin-Rechte setzen
```

**Frontend-Datei:** `src/components/admin/UserManagement.tsx` (8 Aufrufe)

**Aufwand:** 🟡 **MITTEL**

---

#### **1.5 Menü & Navigation APIs**

**Benötigte APIs:**
- `api/menu-items.php` - Menü-Items verwalten
- `api/site-settings.php` - Site-Einstellungen

**Frontend-Dateien:**
- `src/components/Header.tsx` (6 Aufrufe)
- `src/components/admin/MenuManagement.tsx` (4 Aufrufe)
- `src/components/admin/FooterMenuManagement.tsx` (4 Aufrufe)

**Aufwand:** 🟡 **MITTEL**

---

#### **1.6 Master-Daten API** (`api/master-data.php`)

**Frontend-Datei:** `src/components/MasterDataSettings.tsx` (6 Aufrufe)

**Aufwand:** 🟢 **NIEDRIG**

---

#### **1.7 Rechtliche Seiten API** (`api/legal-pages.php`)

**Frontend-Dateien:**
- `src/components/admin/LegalPagesManagement.tsx` (4 Aufrufe)
- `src/components/LegalPageViewer.tsx`

**Aufwand:** 🟢 **NIEDRIG**

---

#### **1.8 Erweiterte Vereinbarungen**

**Benötigte Funktionen:**
```php
- POST   /api/agreements.php?action=create-version   // Version erstellen
- GET    /api/agreements.php?action=version-history&id=X  // Versionshistorie
- GET    /api/agreements.php?action=logs&id=X        // Aktionsprotokoll
- POST   /api/agreements.php?action=log-action       // Aktion protokollieren
- GET    /api/agreements.php?action=placeholders     // Platzhalter-Definitionen
```

**Frontend-Datei:** `src/lib/agreement.service.ts` (9 Aufrufe)

**Aufwand:** 🟡 **MITTEL**

---

#### **1.9 Erweiterte Admin-Funktionen**

**Benötigte Funktionen:**
```php
// Icon-Uploads
- POST   /api/mood-indicators.php?action=upload-icon // Icon hochladen

// Kategorien
- GET    /api/mood-indicators.php?action=categories   // Kategorien laden
- POST   /api/mood-indicators.php?action=category     // Kategorie erstellen
- PUT    /api/mood-indicators.php?action=category&id=X // Kategorie aktualisieren
- DELETE /api/mood-indicators.php?action=category&id=X  // Kategorie löschen
```

**Frontend-Datei:** `src/components/admin/StandardIndicatorsManagement.tsx` (11 Aufrufe)

**Aufwand:** 🟡 **MITTEL**

---

### **Phase 2: Frontend-Services anpassen**

#### **2.1 Billing-System** (`src/lib/billing.ts`)

**Aktuell:** Verwendet Supabase direkt
```typescript
const { data } = await supabase.from('currencies').select('*');
```

**Ziel:** Verwendet PHP-API
```typescript
const { data } = await apiClient.get('/billing.php?action=currencies');
```

**Schritte:**
1. Alle Supabase-Aufrufe durch API-Client-Aufrufe ersetzen
2. Fehlerbehandlung anpassen
3. Typen anpassen

**Aufwand:** 🔴 **HOCH** (40 Aufrufe)

---

#### **2.2 Payment Provider** (`src/lib/payment-providers.ts`)

**Schritte:**
1. Prüfen welche Funktionen bereits vorhanden sind
2. Fehlende Funktionen hinzufügen
3. Frontend anpassen

**Aufwand:** 🟡 **MITTEL** (12 Aufrufe)

---

#### **2.3 AI-Konfigurationen** (`src/components/AIConfiguration.tsx`)

**Schritte:**
1. API-Endpunkt erstellen (`api/ai-configurations.php`)
2. Frontend-Komponente anpassen
3. Verschlüsselung für API-Keys implementieren

**Aufwand:** 🟡 **MITTEL** (9 Aufrufe)

---

#### **2.4 Benutzer-Verwaltung** (`src/components/admin/UserManagement.tsx`)

**Schritte:**
1. Prüfen ob `api/users.php` alle Funktionen hat
2. Frontend-Komponente anpassen
3. Admin-Rechte-Verwaltung implementieren

**Aufwand:** 🟡 **MITTEL** (8 Aufrufe)

---

#### **2.5 Menü & Navigation**

**Dateien:**
- `src/components/Header.tsx`
- `src/components/admin/MenuManagement.tsx`
- `src/components/admin/FooterMenuManagement.tsx`

**Schritte:**
1. APIs erstellen (`api/menu-items.php`, `api/site-settings.php`)
2. Frontend-Komponenten anpassen

**Aufwand:** 🟡 **MITTEL** (14 Aufrufe)

---

#### **2.6 Weitere Komponenten**

**Dateien:**
- `src/components/MasterDataSettings.tsx`
- `src/components/admin/LegalPagesManagement.tsx`
- `src/components/LegalPageViewer.tsx`
- `src/components/AccountSettings.tsx`
- `src/lib/admin.ts`
- `src/lib/stripe-service.ts`
- `src/lib/agreement.service.ts` (erweiterte Funktionen)

**Aufwand:** 🟡 **MITTEL** (~30 Aufrufe)

---

### **Phase 3: Typen migrieren**

#### **3.1 Typen in separate Datei verschieben**

**Aktuell:** Typen in `src/lib/supabase.ts`
```typescript
export interface Pseudonym { ... }
export interface MoodIndicator { ... }
export interface AIConfiguration { ... }
```

**Ziel:** Separate Dateien
```
src/types/pseudonym.ts
src/types/mood-indicator.ts
src/types/ai-configuration.ts
src/types/index.ts  // Alle Typen exportieren
```

**Schritte:**
1. Neue Dateien erstellen
2. Typen verschieben
3. Imports in allen Dateien anpassen

**Aufwand:** 🟢 **NIEDRIG** (aber viele Dateien)

---

### **Phase 4: Supabase entfernen**

#### **4.1 Supabase-Imports entfernen**

**Dateien prüfen:**
```bash
grep -r "from.*supabase" src/
grep -r "import.*supabase" src/
```

**Schritte:**
1. Alle `import { supabase }` entfernen
2. Alle `import type { ... } from './lib/supabase'` durch neue Typ-Imports ersetzen
3. Alle `supabase.` Aufrufe entfernen (sollten bereits ersetzt sein)

**Aufwand:** 🟢 **NIEDRIG** (aber viele Dateien)

---

#### **4.2 Supabase-Dateien entfernen**

**Dateien löschen:**
- `src/lib/supabase.ts`
- `src/lib/supabase-helper.ts`

**Aufwand:** 🟢 **NIEDRIG**

---

#### **4.3 Supabase-Bibliothek entfernen**

**package.json:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4"  // ENTFERNEN
  }
}
```

**Schritte:**
1. Aus `package.json` entfernen
2. `npm uninstall @supabase/supabase-js` ausführen
3. `node_modules` bereinigen

**Aufwand:** 🟢 **NIEDRIG**

---

#### **4.4 Umgebungsvariablen entfernen**

**Dateien prüfen:**
- `.env` (falls vorhanden)
- `.env.production` (bereits leer)
- `config.production.php` (falls vorhanden)

**Schritte:**
1. `VITE_SUPABASE_URL` entfernen
2. `VITE_SUPABASE_ANON_KEY` entfernen
3. Supabase-Credentials aus PHP-Config entfernen

**Aufwand:** 🟢 **NIEDRIG**

---

#### **4.5 Dokumentation aktualisieren**

**Dateien aktualisieren:**
- README.md
- DOKU-Dateien
- Setup-Anleitungen

**Aufwand:** 🟢 **NIEDRIG**

---

## 📋 Checkliste: Schritt-für-Schritt

### **Phase 1: APIs erstellen** 🔴

- [ ] **1.1** `api/billing.php` erstellen
  - [ ] Währungen CRUD
  - [ ] Wechselkurse CRUD
  - [ ] Tarifpläne CRUD
  - [ ] Abonnements CRUD
  - [ ] Transaktionen CRUD
  - [ ] Rechnungen CRUD

- [ ] **1.2** `api/payment-providers.php` prüfen/erweitern
  - [ ] Alle benötigten Funktionen vorhanden?
  - [ ] Fehlende Funktionen hinzufügen

- [ ] **1.3** `api/ai-configurations.php` erstellen
  - [ ] CRUD-Operationen
  - [ ] Verschlüsselung für API-Keys
  - [ ] Test-Funktion

- [ ] **1.4** `api/users.php` prüfen/erweitern
  - [ ] Admin-Funktionen vorhanden?
  - [ ] Blockierung/Entsperrung
  - [ ] Admin-Rechte-Verwaltung

- [ ] **1.5** `api/menu-items.php` erstellen
- [ ] **1.6** `api/site-settings.php` erstellen
- [ ] **1.7** `api/master-data.php` erstellen
- [ ] **1.8** `api/legal-pages.php` erstellen
- [ ] **1.9** `api/agreements.php` erweitern
  - [ ] Versionshistorie
  - [ ] Aktionsprotokoll
  - [ ] Platzhalter-Definitionen

- [ ] **1.10** `api/mood-indicators.php` erweitern
  - [ ] Icon-Uploads
  - [ ] Kategorien CRUD

---

### **Phase 2: Frontend anpassen** 🟡

- [ ] **2.1** `src/lib/billing.ts` migrieren (40 Aufrufe)
- [ ] **2.2** `src/lib/payment-providers.ts` migrieren (12 Aufrufe)
- [ ] **2.3** `src/components/AIConfiguration.tsx` migrieren (9 Aufrufe)
- [ ] **2.4** `src/lib/agreement.service.ts` erweitern (9 Aufrufe)
- [ ] **2.5** `src/components/admin/UserManagement.tsx` migrieren (8 Aufrufe)
- [ ] **2.6** `src/components/admin/StandardIndicatorsManagement.tsx` migrieren (11 Aufrufe)
- [ ] **2.7** `src/components/Header.tsx` migrieren (6 Aufrufe)
- [ ] **2.8** `src/components/MasterDataSettings.tsx` migrieren (6 Aufrufe)
- [ ] **2.9** `src/components/admin/MenuManagement.tsx` migrieren (4 Aufrufe)
- [ ] **2.10** `src/components/admin/FooterMenuManagement.tsx` migrieren (4 Aufrufe)
- [ ] **2.11** `src/components/admin/LegalPagesManagement.tsx` migrieren (4 Aufrufe)
- [ ] **2.12** `src/components/AccountSettings.tsx` migrieren (4 Aufrufe)
- [ ] **2.13** `src/lib/admin.ts` migrieren (4 Aufrufe)
- [ ] **2.14** `src/lib/stripe-service.ts` migrieren (3 Aufrufe)
- [ ] **2.15** Weitere Komponenten migrieren (~20 Aufrufe)

---

### **Phase 3: Typen migrieren** 🟢

- [ ] **3.1** `src/types/` Verzeichnis erstellen
- [ ] **3.2** Typen aus `supabase.ts` extrahieren
- [ ] **3.3** Separate Dateien erstellen
- [ ] **3.4** Imports in allen Dateien anpassen

---

### **Phase 4: Supabase entfernen** 🟢

- [ ] **4.1** Alle Supabase-Imports entfernen
- [ ] **4.2** `src/lib/supabase.ts` löschen
- [ ] **4.3** `src/lib/supabase-helper.ts` löschen
- [ ] **4.4** `@supabase/supabase-js` aus `package.json` entfernen
- [ ] **4.5** `npm uninstall @supabase/supabase-js` ausführen
- [ ] **4.6** Umgebungsvariablen entfernen
- [ ] **4.7** Dokumentation aktualisieren
- [ ] **4.8** Build testen
- [ ] **4.9** Funktionen testen

---

## ⏱️ Geschätzter Aufwand

### **Phase 1: APIs erstellen**
- Billing-System: **8-12 Stunden**
- Payment Provider: **2-4 Stunden**
- AI-Konfigurationen: **4-6 Stunden**
- Benutzer-Verwaltung: **2-4 Stunden**
- Menü & Navigation: **4-6 Stunden**
- Master-Daten: **2-3 Stunden**
- Rechtliche Seiten: **2-3 Stunden**
- Erweiterte Vereinbarungen: **4-6 Stunden**
- Erweiterte Admin-Funktionen: **4-6 Stunden**

**Gesamt Phase 1:** **32-50 Stunden**

---

### **Phase 2: Frontend anpassen**
- Billing-System: **6-8 Stunden**
- Payment Provider: **2-3 Stunden**
- AI-Konfigurationen: **3-4 Stunden**
- Vereinbarungen: **3-4 Stunden**
- Benutzer-Verwaltung: **2-3 Stunden**
- Admin-Funktionen: **3-4 Stunden**
- Menü & Navigation: **3-4 Stunden**
- Weitere Komponenten: **4-6 Stunden**

**Gesamt Phase 2:** **26-36 Stunden**

---

### **Phase 3: Typen migrieren**
**Gesamt Phase 3:** **4-6 Stunden**

---

### **Phase 4: Supabase entfernen**
**Gesamt Phase 4:** **2-4 Stunden**

---

### **Gesamtaufwand: 64-96 Stunden**

**Bei 8 Stunden/Tag:** **8-12 Arbeitstage**

---

## 🎯 Empfohlene Reihenfolge

### **Woche 1: Kritische APIs**
1. Billing-System API (`api/billing.php`)
2. Payment Provider API (prüfen/erweitern)
3. AI-Konfigurationen API (`api/ai-configurations.php`)

### **Woche 2: Weitere APIs**
4. Benutzer-Verwaltung API (prüfen/erweitern)
5. Menü & Navigation APIs
6. Master-Daten API
7. Rechtliche Seiten API
8. Erweiterte Vereinbarungen
9. Erweiterte Admin-Funktionen

### **Woche 3: Frontend anpassen**
10. Billing-System Frontend
11. Payment Provider Frontend
12. AI-Konfigurationen Frontend
13. Weitere Frontend-Komponenten

### **Woche 4: Cleanup**
14. Typen migrieren
15. Supabase entfernen
16. Tests durchführen
17. Dokumentation aktualisieren

---

## ✅ Erfolgskriterien

**Supabase ist komplett entfernt wenn:**
- ✅ Keine Supabase-Imports mehr im Code
- ✅ Keine `supabase.` Aufrufe mehr im Code
- ✅ `@supabase/supabase-js` nicht mehr in `package.json`
- ✅ Alle Funktionen funktionieren mit MySQL/PHP-APIs
- ✅ Build erfolgreich ohne Supabase-Bibliothek
- ✅ Keine `localhost:9999` mehr im Build

---

## 🚨 Wichtige Hinweise

1. **Nicht alles auf einmal:** Schrittweise vorgehen, jeden Schritt testen
2. **Backup erstellen:** Vor größeren Änderungen Backup erstellen
3. **Tests durchführen:** Jede Migration testen bevor weiter gemacht wird
4. **Dokumentation:** Änderungen dokumentieren
5. **Git Commits:** Häufig committen, jeden Schritt einzeln

---

**Ende des Plans**




