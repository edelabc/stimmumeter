# Supabase → MySQL Migration Status

**Datum:** 2025-11-24  
**Status:** In Bearbeitung

## Zusammenfassung

- **Gesamt Dateien mit Supabase:** 43
- **Gesamt Supabase-Aufrufe:** 155
- **Bereits migriert:** ~30%
- **Noch zu migrieren:** ~70%

## Prioritätenliste (nach Aufrufen)

### 🔴 HOCH (Kritisch - sofort reparieren)

1. **lib/billing.ts** - 40 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/billing.php`

2. **lib/payment-providers.ts** - 12 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/payment-providers.php`

3. **components/admin/StandardIndicatorsManagement.tsx** - 11 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/mood-indicators.php` (teilweise vorhanden)

4. **components/AIConfiguration.tsx** - 9 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/ai-configurations.php`

5. **lib/agreement.service.ts** - 9 Aufrufe
   - Status: 🟡 Teilweise migriert
   - Noch zu reparieren: `createAgreementVersion`, `getAgreementVersionHistory`, `getAgreementLogs`, `logAgreementAction`, `getAllPlaceholderDefinitions`

6. **lib/auth.ts** - 9 Aufrufe
   - Status: 🟢 Fallback (sollte MySQL verwenden)
   - Prüfen ob Fallback korrekt funktioniert

7. **components/admin/UserManagement.tsx** - 8 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/users.php`

8. **components/MasterDataSettings.tsx** - 6 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/master-data.php`

9. **components/Header.tsx** - 6 Aufrufe
   - Status: ❌ Nicht migriert
   - API-Endpunkte benötigt: `/api/menu-items.php`, `/api/site-settings.php`

### 🟡 MITTEL (Wichtig - bald reparieren)

- components/admin/FooterMenuManagement.tsx - 4 Aufrufe
- components/admin/MenuManagement.tsx - 4 Aufrufe
- components/AccountSettings.tsx - 4 Aufrufe
- lib/admin.ts - 4 Aufrufe (teilweise migriert)
- lib/stripe-service.ts - 3 Aufrufe

### 🟢 NIEDRIG (Nur Imports, keine Aufrufe)

- Viele Komponenten importieren nur Typen aus supabase.ts
- Können später bereinigt werden

## Bereits migriert ✅

- ✅ `lib/auth-mysql.ts` - Komplett migriert
- ✅ `lib/mood-api-mysql.ts` - Komplett migriert
- ✅ `lib/admin.ts` - `checkCurrentUserIsAdmin()` migriert
- ✅ `lib/agreement.service.ts` - Titel-Funktionen migriert
- ✅ `MoodApp.tsx` - Pseudonym-Funktionen migriert (gerade repariert)
- ✅ API-Endpunkte:
  - `/api/auth.php` ✅
  - `/api/pseudonyms.php` ✅
  - `/api/mood-entries.php` ✅
  - `/api/mood-indicators.php` ✅
  - `/api/agreements.php` ✅ (teilweise)
  - `/api/session_manager.php` ✅

## Nächste Schritte

1. **Kritische Module reparieren:**
   - UserManagement.tsx
   - AIConfiguration.tsx
   - Header.tsx / Footer.tsx
   - agreement.service.ts (restliche Funktionen)

2. **API-Endpunkte erstellen:**
   - `/api/users.php` - Benutzerverwaltung
   - `/api/ai-configurations.php` - AI-Konfigurationen
   - `/api/menu-items.php` - Menü-Items
   - `/api/site-settings.php` - Site-Einstellungen
   - `/api/billing.php` - Billing-System
   - `/api/payment-providers.php` - Payment Provider

3. **Bereinigung:**
   - Supabase-Imports entfernen wo nicht mehr benötigt
   - Typen in separate Datei verschieben

## Verwendung

Führen Sie aus, um aktuellen Status zu prüfen:
```bash
php scripts/find-supabase-usage.php
```



