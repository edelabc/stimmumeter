# Internationalisierung (i18n) - Implementierungsplan

## Aktueller Status

Derzeit sind alle Texte in der Anwendung auf **Deutsch** hardcodiert. Die Benutzeroberfläche wurde vollständig auf Deutsch übersetzt:

- ✅ Admin-Dashboard (Billing Management)
- ✅ User Account Settings
- ✅ Billing Portal
- ✅ Currency Management
- ✅ Help Text Management

## Zukünftige Internationalisierung

Für eine vollständige mehrsprachige Unterstützung sollte ein i18n-Framework integriert werden.

### Empfohlene Lösung: react-i18next

**Installation:**
```bash
npm install react-i18next i18next
```

### Implementierungsschritte

#### 1. Sprachdateien erstellen

```
src/
└── locales/
    ├── de/
    │   ├── common.json
    │   ├── billing.json
    │   ├── account.json
    │   └── admin.json
    ├── en/
    │   ├── common.json
    │   ├── billing.json
    │   ├── account.json
    │   └── admin.json
    └── index.ts
```

**Beispiel: `locales/de/billing.json`**
```json
{
  "billing": {
    "title": "Billing & Tarife",
    "plans": {
      "title": "Tarife",
      "createNew": "Neuer Tarif",
      "editPlan": "Tarif bearbeiten: {{name}}",
      "deletePlan": "Tarif löschen",
      "confirmDelete": "Möchten Sie diesen Tarif wirklich löschen?"
    },
    "trial": {
      "title": "Testphase",
      "enable": "Testphase aktivieren",
      "duration": "Testphasen-Dauer",
      "limits": "Testphasen-Limits"
    }
  }
}
```

**Beispiel: `locales/en/billing.json`**
```json
{
  "billing": {
    "title": "Billing & Plans",
    "plans": {
      "title": "Pricing Plans",
      "createNew": "New Plan",
      "editPlan": "Edit Plan: {{name}}",
      "deletePlan": "Delete Plan",
      "confirmDelete": "Are you sure you want to delete this plan?"
    },
    "trial": {
      "title": "Trial Period",
      "enable": "Enable Trial Period",
      "duration": "Trial Duration",
      "limits": "Trial Limits"
    }
  }
}
```

#### 2. i18n Konfiguration

**`src/i18n/config.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import deCommon from '../locales/de/common.json';
import deBilling from '../locales/de/billing.json';
import deAccount from '../locales/de/account.json';
import enCommon from '../locales/en/common.json';
import enBilling from '../locales/en/billing.json';
import enAccount from '../locales/en/account.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        common: deCommon,
        billing: deBilling,
        account: deAccount,
      },
      en: {
        common: enCommon,
        billing: enBilling,
        account: enAccount,
      },
    },
    lng: 'de', // Standardsprache
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### 3. Integration in main.tsx

```typescript
import './i18n/config';
```

#### 4. Verwendung in Komponenten

**Vorher (hardcodiert):**
```typescript
<button>Neuer Tarif</button>
```

**Nachher (mit i18n):**
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation('billing');

  return <button>{t('plans.createNew')}</button>;
}
```

#### 5. Sprachwechsel-Komponente

```typescript
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Optional: In Supabase user_profiles speichern
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="de">Deutsch</option>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

#### 6. Persistierung der Spracheinstellung

```typescript
// In AccountSettings beim Speichern:
const handleSave = async () => {
  await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      preferred_language: formData.preferred_language,
    });

  // Sprache in i18n setzen
  i18n.changeLanguage(formData.preferred_language);
};

// Beim App-Start laden:
useEffect(() => {
  const loadUserPreferences = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('user_id', user.id)
      .single();

    if (profile?.preferred_language) {
      i18n.changeLanguage(profile.preferred_language);
    }
  };

  loadUserPreferences();
}, [user]);
```

### Umstellung bestehender Komponenten

#### BillingManagement.tsx

**Vorher:**
```typescript
<h3>Tarife</h3>
<button>Neuer Tarif</button>
```

**Nachher:**
```typescript
const { t } = useTranslation('billing');

<h3>{t('plans.title')}</h3>
<button>{t('plans.createNew')}</button>
```

#### AccountSettings.tsx

**Vorher:**
```typescript
<h2>Mein Konto</h2>
<button>Profil</button>
<button>Billing & Tarife</button>
```

**Nachher:**
```typescript
const { t } = useTranslation('account');

<h2>{t('title')}</h2>
<button>{t('tabs.profile')}</button>
<button>{t('tabs.billing')}</button>
```

### Vorteile dieser Lösung

1. **Zentrale Verwaltung**: Alle Texte an einem Ort
2. **Einfacher Sprachwechsel**: Zur Laufzeit ohne Reload
3. **Fallback**: Bei fehlenden Übersetzungen wird Fallback-Sprache verwendet
4. **Namespace**: Texte nach Kontext organisiert (billing, account, admin)
5. **Interpolation**: Dynamische Werte in Übersetzungen möglich
6. **TypeScript-Support**: Type-safe mit typescript-plugin

### Migrationsschritte

1. **Phase 1**: i18next installieren und konfigurieren
2. **Phase 2**: Deutsche Texte aus Komponenten in JSON-Dateien extrahieren
3. **Phase 3**: Englische Übersetzungen hinzufügen
4. **Phase 4**: Komponenten auf useTranslation() umstellen
5. **Phase 5**: Weitere Sprachen hinzufügen (es, fr)
6. **Phase 6**: Automatische Erkennung der Browser-Sprache

### Testing

```typescript
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

test('renders in German', () => {
  i18n.changeLanguage('de');
  const { getByText } = render(
    <I18nextProvider i18n={i18n}>
      <Component />
    </I18nextProvider>
  );
  expect(getByText('Neuer Tarif')).toBeInTheDocument();
});

test('renders in English', () => {
  i18n.changeLanguage('en');
  const { getByText } = render(
    <I18nextProvider i18n={i18n}>
      <Component />
    </I18nextProvider>
  );
  expect(getByText('New Plan')).toBeInTheDocument();
});
```

## Alternative Lösungen

### react-intl (von FormatJS)
- Ähnlich wie react-i18next
- Mehr Fokus auf Formatierung (Zahlen, Daten)
- Etwas komplexer in der Einrichtung

### next-i18next
- Für Next.js optimiert
- Nicht für Vite/React relevant

### Custom Solution
- Einfaches JSON-Import-System
- Weniger Features, mehr Kontrolle
- Für kleine Apps ausreichend

## Empfehlung

Für diese Anwendung empfehle ich **react-i18next** wegen:
- Etablierter Standard in der React-Community
- Gute TypeScript-Unterstützung
- Flexible Namespace-Organisation
- Einfache Integration mit Supabase für User-Präferenzen
- Aktive Entwicklung und Community

## Zeitaufwand Schätzung

- **Setup & Konfiguration**: 2-3 Stunden
- **Migration bestehender Texte**: 4-6 Stunden
- **Englische Übersetzungen**: 3-4 Stunden
- **Testing & Bugfixes**: 2-3 Stunden
- **Weitere Sprachen**: Je 2-3 Stunden pro Sprache

**Total**: ~15-20 Stunden für vollständige Mehrsprachigkeit (de, en)

---

**Status**: Vorbereitet für i18n-Integration
**Nächster Schritt**: Installation von react-i18next und Erstellung der Sprachdateien
