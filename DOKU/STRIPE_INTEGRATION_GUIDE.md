# Stripe Integration - Vollständige Anleitung

## ✅ Implementiert und bereit!

Die Stripe-Integration ist vollständig im Admin-Bereich implementiert und einsatzbereit.

## Zugriff

**Pfad:** Admin-Dashboard → "Stripe Integration"

## Features

### 🔐 Sichere Konfiguration

**Alle API-Keys werden verschlüsselt gespeichert:**
- ✅ Client-seitige Verschlüsselung vor dem Speichern
- ✅ Entschlüsselung beim Laden
- ✅ Maskierte Anzeige (****••••****)
- ✅ Show/Hide Toggle für Keys
- ✅ Copy-to-Clipboard Funktion

### ⚙️ Konfigurationsparameter

#### 1. **Modus-Auswahl**
- **Test-Modus**: Für Entwicklung und Tests
  - Verwendet `pk_test_...` und `sk_test_...` Keys
  - Keine echten Zahlungen
  - Sicher zum Testen

- **Live-Modus**: Für Produktion
  - Verwendet `pk_live_...` und `sk_live_...` Keys
  - Echte Zahlungen
  - Erfordert validierte Keys

#### 2. **API-Keys** (Pflichtfelder)

**Publishable Key:**
```
Format: pk_test_... oder pk_live_...
Verwendung: Frontend (öffentlich sichtbar)
Beispiel: pk_test_51ABC...xyz
```

**Secret Key:**
```
Format: sk_test_... oder sk_live_...
Verwendung: Backend (streng geheim!)
Beispiel: sk_test_51ABC...xyz
```

**Wichtig:**
- ✅ Beide Keys müssen im gleichen Modus sein (test/test oder live/live)
- ✅ Automatische Format-Validierung
- ✅ Test-Button vor dem Speichern

#### 3. **Webhook-Konfiguration**

**Webhook Secret:**
```
Format: whsec_...
Verwendung: Webhook-Signatur-Verifizierung
Beispiel: whsec_ABC123...xyz
```

**Webhook URL:**
```
Format: https://your-domain.com/api/webhooks/stripe
Beispiel: https://mood-app.com/api/webhooks/stripe
```

**Webhook Events:**
Wähle die Events aus, die du empfangen möchtest:
- ✅ `payment_intent.succeeded` - Zahlung erfolgreich
- ✅ `payment_intent.payment_failed` - Zahlung fehlgeschlagen
- ✅ `charge.succeeded` - Abbuchung erfolgreich
- ✅ `charge.failed` - Abbuchung fehlgeschlagen
- ✅ `customer.subscription.created` - Abo erstellt
- ✅ `customer.subscription.updated` - Abo aktualisiert
- ✅ `customer.subscription.deleted` - Abo gekündigt
- ✅ `invoice.paid` - Rechnung bezahlt
- ✅ `invoice.payment_failed` - Rechnung nicht bezahlt
- ✅ `checkout.session.completed` - Checkout abgeschlossen
- ✅ `checkout.session.expired` - Checkout abgelaufen

### 🎯 Schritt-für-Schritt Setup

#### Schritt 1: Stripe-Account erstellen

1. Gehe zu: https://dashboard.stripe.com/register
2. Erstelle einen Account
3. Verifiziere deine E-Mail

#### Schritt 2: API-Keys abrufen

**Test-Keys (für Entwicklung):**
1. Gehe zu: https://dashboard.stripe.com/test/apikeys
2. Kopiere "Publishable key" (pk_test_...)
3. Klicke "Reveal test key" für Secret Key (sk_test_...)

**Live-Keys (für Produktion):**
1. Aktiviere deinen Account vollständig
2. Gehe zu: https://dashboard.stripe.com/apikeys
3. Kopiere die Live-Keys (pk_live_... und sk_live_...)

#### Schritt 3: Konfiguration im Admin-Bereich

1. **Öffne Admin-Dashboard**
   - Melde dich als Admin an
   - Gehe zu "Stripe Integration"

2. **Wähle Modus**
   - Für Tests: "Test-Modus"
   - Für Produktion: "Live-Modus"

3. **Trage API-Keys ein**
   - Publishable Key einfügen
   - Secret Key einfügen
   - Nutze Show/Hide Buttons zur Kontrolle

4. **Teste die Verbindung**
   - Klicke "Verbindung testen"
   - Warte auf Bestätigung
   - Bei Erfolg: ✅ Grüne Meldung
   - Bei Fehler: ❌ Prüfe die Keys

5. **Konfiguriere Webhooks (optional)**
   - Webhook Secret eingeben
   - Webhook URL eingeben
   - Events auswählen (empfohlen: alle Payment-Events)

6. **Speichern**
   - Klicke "Konfiguration speichern"
   - Bestätigung abwarten

7. **Aktivieren**
   - Nach erfolgreichem Speichern
   - Klicke "Aktivieren"
   - Stripe ist jetzt aktiv! ✅

#### Schritt 4: Webhooks in Stripe einrichten

1. Gehe zu: https://dashboard.stripe.com/webhooks
2. Klicke "Add endpoint"
3. Trage deine Webhook-URL ein
4. Wähle Events aus (wie in Admin konfiguriert)
5. Kopiere das "Signing secret" (whsec_...)
6. Trage es im Admin-Bereich ein

## Datenbankstruktur

### Tabelle: `payment_providers`

```sql
CREATE TABLE payment_providers (
  id uuid PRIMARY KEY,
  code text UNIQUE, -- 'stripe'
  name text, -- 'Stripe'
  is_active boolean, -- Aktiv/Inaktiv
  is_test_mode boolean, -- Test/Live
  config jsonb, -- Verschlüsselte Keys
  created_at timestamptz,
  updated_at timestamptz
);
```

**Config JSONB Struktur:**
```json
{
  "publishable_key": "encrypted_value",
  "secret_key": "encrypted_value",
  "description": "Stripe payment gateway"
}
```

### Tabelle: `payment_provider_webhooks`

```sql
CREATE TABLE payment_provider_webhooks (
  id uuid PRIMARY KEY,
  provider_id uuid, -- FK zu payment_providers
  webhook_secret text, -- Verschlüsselt
  webhook_url text,
  events text[], -- Array von Event-Namen
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
);
```

## Sicherheit

### 🔒 Verschlüsselung

**Client-seitige Verschlüsselung:**
```typescript
import { encryptValue, decryptValue } from '../lib/encryption';

// Vor dem Speichern
const encrypted = encryptValue(secretKey);

// Nach dem Laden
const decrypted = decryptValue(encrypted);
```

**Wichtig:**
- ✅ Keys werden NIEMALS im Klartext gespeichert
- ✅ Verschlüsselung erfolgt vor dem DB-Insert
- ✅ Nur Admins haben Zugriff (RLS Policies)
- ✅ Maskierte Anzeige in der UI

### 🛡️ Row Level Security (RLS)

Alle Tabellen haben strenge RLS-Policies:
```sql
-- Nur Admins können Payment Provider sehen/bearbeiten
CREATE POLICY "Admins only"
  ON payment_providers
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
```

### ⚠️ Best Practices

1. **Niemals Keys öffentlich teilen**
   - Nicht in Git committen
   - Nicht in Logs ausgeben
   - Nicht in Fehlermeldungen anzeigen

2. **Test-Modus für Entwicklung**
   - Immer zuerst mit Test-Keys testen
   - Keine echten Kreditkarten in Test
   - Test-Keys haben "test" im Namen

3. **Live-Modus nur für Produktion**
   - Account vollständig verifizieren
   - SSL/HTTPS erforderlich
   - Webhook-Endpoints absichern

4. **Regelmäßig Keys rotieren**
   - Bei Verdacht auf Kompromittierung
   - Alte Keys in Stripe invalidieren
   - Neue Keys im Admin eintragen

## API-Funktionen

### Payment Providers
```typescript
import {
  getAllPaymentProviders,
  getPaymentProvider,
  getActivePaymentProvider,
  upsertPaymentProvider,
  activatePaymentProvider
} from '../lib/payment-providers';

// Aktiven Provider laden
const { data } = await getActivePaymentProvider();

// Stripe-Konfiguration laden
const { data } = await getPaymentProvider('stripe');

// Provider aktivieren
await activatePaymentProvider('stripe', true);
```

### Webhooks
```typescript
import {
  getProviderWebhooks,
  upsertProviderWebhook,
  deleteProviderWebhook
} from '../lib/payment-providers';

// Webhooks laden
const { data } = await getProviderWebhooks(providerId);

// Webhook hinzufügen
await upsertProviderWebhook({
  provider_id: providerId,
  webhook_secret: encryptValue(secret),
  webhook_url: url,
  events: ['payment_intent.succeeded'],
  is_active: true
});
```

## Verwendung in der App

### Prepaid-Aufladung

```typescript
// In AccountSettings.tsx bereits vorbereitet
import { getActivePaymentProvider } from '../lib/payment-providers';
import { decryptValue } from '../lib/encryption';

const handleRecharge = async (amount: number) => {
  // 1. Aktiven Provider laden
  const { data: provider } = await getActivePaymentProvider();

  if (!provider || provider.code !== 'stripe') {
    alert('Stripe nicht konfiguriert');
    return;
  }

  // 2. Publishable Key entschlüsseln
  const publishableKey = decryptValue(provider.config.publishable_key);

  // 3. Stripe laden
  const stripe = await loadStripe(publishableKey);

  // 4. Payment Intent erstellen (Server-seitig)
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  const { clientSecret } = await response.json();

  // 5. Stripe Checkout
  const { error } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.origin + '/payment-success',
    },
  });

  if (error) {
    alert('Zahlung fehlgeschlagen: ' + error.message);
  }
};
```

### Postpaid-Abonnement

```typescript
// Subscription erstellen
const createSubscription = async (planId: string) => {
  const { data: provider } = await getActivePaymentProvider();
  const publishableKey = decryptValue(provider.config.publishable_key);

  const stripe = await loadStripe(publishableKey);

  // Subscription erstellen (Server-seitig)
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
  const { sessionId } = await response.json();

  // Checkout Session
  await stripe.redirectToCheckout({ sessionId });
};
```

## Testing

### Test-Karten

Stripe bietet Test-Karten für verschiedene Szenarien:

**Erfolgreiche Zahlung:**
```
Kartennummer: 4242 4242 4242 4242
Datum: Beliebig (Zukunft)
CVC: Beliebig (3 Stellen)
PLZ: Beliebig
```

**Zahlung fehlgeschlagen:**
```
Kartennummer: 4000 0000 0000 0002
```

**3D Secure erforderlich:**
```
Kartennummer: 4000 0025 0000 3155
```

Mehr: https://stripe.com/docs/testing

## Umgebungsvariablen (.env)

Für Server-seitige Integration:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
STRIPE_WEBHOOK_URL=https://your-domain.com/api/webhooks/stripe
STRIPE_SUCCESS_URL=https://your-domain.com/payment-success
STRIPE_CANCEL_URL=https://your-domain.com/payment-cancel
```

**Wichtig:** Diese werden NICHT in der Client-App verwendet! Die Keys werden aus der Datenbank geladen (verschlüsselt).

## Troubleshooting

### Problem: "Ungültiges Format"
**Lösung:**
- Prüfe ob Keys mit pk_/sk_ beginnen
- Prüfe ob beide Keys im gleichen Modus sind (test/test oder live/live)

### Problem: "Verbindung fehlgeschlagen"
**Lösung:**
- Prüfe Internetverbindung
- Prüfe ob Keys korrekt kopiert wurden (kein Whitespace)
- Prüfe Stripe Dashboard auf Key-Status

### Problem: "Webhook nicht empfangen"
**Lösung:**
- Prüfe Webhook-URL (muss öffentlich erreichbar sein)
- Prüfe Webhook-Secret in Stripe Dashboard
- Prüfe Events-Konfiguration
- Teste mit Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Nächste Schritte

1. ✅ Stripe im Admin konfigurieren
2. ⏳ Server-seitige Payment Intent API implementieren
3. ⏳ Webhook-Handler implementieren
4. ⏳ Stripe Checkout in Prepaid-Aufladung integrieren
5. ⏳ Stripe Subscriptions für Postpaid integrieren
6. ⏳ Erfolgs-/Fehler-Seiten erstellen
7. ⏳ Transaktionen automatisch in `account_transactions` erfassen

## Support & Links

- **Stripe Dokumentation**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Test-Karten**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks
- **API-Referenz**: https://stripe.com/docs/api

---

**Die Grundlage ist vollständig implementiert! Jetzt kannst du Stripe im Admin-Bereich konfigurieren.** ✅
