# Billing System - Benutzerhandbuch

## Übersicht

Das Billing-System ermöglicht eine vollständige Abrechnungsverwaltung mit Prepaid/Postpaid-Konten, Tarifauswahl und Stripe-Integration.

## Datenbankschema

### Neue Tabellen

#### 1. `user_account_config`
Speichert die Kontokonfiguration jedes Benutzers:
- `account_type`: 'prepaid' oder 'postpaid'
- `current_plan_id`: Aktuell gebuchter Tarif
- `balance`: Aktuelles Guthaben (relevant für Prepaid)

#### 2. `account_transactions`
Kontoauszug mit allen Transaktionen:
- `transaction_date`: Buchungsdatum
- `document_number`: Belegnummer
- `description`: Buchungstext
- `debit`: Soll-Betrag (Abbuchungen)
- `credit`: Haben-Betrag (Einzahlungen)
- `balance_after`: Laufender Saldo
- `transaction_type`: 'payment', 'charge', 'refund', 'adjustment'

#### 3. `prepaid_recharge_amounts`
Vordefinierte Aufladebeträge für Prepaid-Konten:
- `amount`: Betrag
- `currency_code`: Währung
- `bonus_percentage`: Optionaler Bonus (z.B. 10% = 1.10)
- `sort_order`: Anzeigereihenfolge

#### 4. `user_subscriptions`
Benutzer-Tarifbuchungen:
- `plan_id`: Gebuchter Tarif
- `status`: 'active', 'cancelled', 'expired', 'suspended'
- `start_date`, `end_date`: Laufzeit
- `next_billing_date`: Nächste Abrechnung
- `stripe_subscription_id`: Stripe-Referenz

## Admin-Bereich

### Prepaid-Aufladebeträge verwalten

**Pfad:** Admin → Prepaid Aufladebeträge

Hier können Sie festlegen, welche Beträge Benutzer zum Aufladen auswählen können:

1. **Neuen Betrag hinzufügen**
   - Betrag eingeben (z.B. 10, 20, 50, 100 EUR)
   - Währung wählen
   - Optional: Bonus-Prozentsatz (z.B. 10% = User erhält 11 EUR für 10 EUR)
   - Sortierung festlegen
   - Aktiv/Inaktiv Status

2. **Bestehende Beträge bearbeiten**
   - Auf Bearbeiten-Icon klicken
   - Werte anpassen
   - Speichern

3. **Beträge löschen**
   - Auf Löschen-Icon klicken
   - Bestätigung

### Tarife verwalten

**Pfad:** Admin → Billing & Tarife

Siehe separate Dokumentation in `BILLING_SYSTEM.md`

## Benutzer-Bereich

### 1. Kontotyp wählen

Benutzer müssen zunächst ihren Kontotyp festlegen:

**Prepaid:**
- Guthaben vorher aufladen
- Nur verbrauchen, was aufgeladen wurde
- Keine Rechnung am Monatsende
- Keine Vertragsbindung

**Postpaid:**
- Verbrauchen, nachher bezahlen
- Rechnung am Ende jeder Abrechnungsperiode
- Automatischer Einzug via Stripe
- Vertragslaufzeit lt. Tarif

### 2. Tarif auswählen

**Modal mit Tarifvergleich:**
- Alle verfügbaren Tarife werden nebeneinander angezeigt
- Übersichtliche Darstellung:
  - Testphase (falls verfügbar)
  - Abrechnungstyp (Nutzungsbasiert / Pauschale / Gemischt)
  - Grundgebühr
  - Vertragslaufzeit
  - Kündigungsfrist
  - Abrechnungspositionen mit Preisen
- Tarif mit Checkbox auswählen
- "Tarif buchen" klicken

### 3. Bezahlung

**Bei Prepaid:**
1. Aufladebetrag auswählen (z.B. 10, 20, 50 EUR)
2. Mit Stripe bezahlen
3. Guthaben wird sofort gutgeschrieben
4. Transaktion erscheint im Kontoauszug

**Bei Postpaid:**
1. Tarif wird sofort aktiviert
2. Nutzung wird erfasst
3. Am Ende der Abrechnungsperiode:
   - Rechnung wird erstellt
   - Betrag automatisch via Stripe eingezogen
   - Transaktion erscheint im Kontoauszug

### 4. Kontoauszug

**Pfad:** Mein Konto → Kontoauszug

Anzeige aller Transaktionen in Tabellenform:

| LFDNR | BUDATUM | BELEGNR | BUCHUNGSTEXT | SOLL | HABEN | LFDSALDO |
|-------|---------|---------|--------------|------|-------|----------|
| 1 | 09.11.2025 | RG-001 | Rechnung November | 29.99 € | - | -29.99 € |
| 2 | 10.11.2025 | ZAH-001 | Zahlung Stripe | - | 50.00 € | 20.01 € |

**Funktionen:**
- Alle Zahlungen (HABEN = Einzahlungen)
- Alle Abbuchungen (SOLL = Kosten)
- Laufender Saldo nach jeder Transaktion
- Export als CSV
- Farbcodierung: Grün = Haben, Rot = Soll

## API-Funktionen (billing.ts)

### Kontoverwaltung

```typescript
// Kontokonfiguration abrufen
const { data } = await getUserAccountConfig(userId);

// Kontokonfiguration speichern/aktualisieren
await upsertUserAccountConfig({
  user_id: userId,
  account_type: 'prepaid',
  current_plan_id: planId,
  balance: 0
});
```

### Transaktionen

```typescript
// Transaktionen abrufen
const { data } = await getAccountTransactions(userId, limit);

// Neue Transaktion erstellen
await createAccountTransaction({
  user_id: userId,
  transaction_date: new Date().toISOString(),
  document_number: 'ZAH-001',
  description: 'Zahlung via Stripe',
  debit: null,
  credit: 50.00,
  balance_after: 50.00,
  transaction_type: 'payment',
  stripe_payment_id: 'pi_xxx'
});
```

### Prepaid-Beträge

```typescript
// Aktive Aufladebeträge abrufen
const { data } = await getPrepaidRechargeAmounts();

// Alle Beträge abrufen (Admin)
const { data } = await getAllPrepaidRechargeAmounts();

// Betrag hinzufügen/aktualisieren
await upsertPrepaidRechargeAmount({
  amount: 50,
  currency_code: 'EUR',
  is_active: true,
  sort_order: 4,
  bonus_percentage: 0
});
```

### Tarife

```typescript
// Aktive Tarife mit allen Details abrufen
const { data } = await getActivePricingPlans();
// Enthält: Basis-Info, Trial-Config, Subscription-Config, Billing-Items
```

## Komponenten

### Für Admins

1. **PrepaidRechargeManagement**
   - Pfad: `src/components/admin/PrepaidRechargeManagement.tsx`
   - Verwaltung der Aufladebeträge

### Für Benutzer

1. **PlanSelectionModal**
   - Pfad: `src/components/PlanSelectionModal.tsx`
   - Modal zur Tarifauswahl mit Vergleich

2. **AccountStatement**
   - Pfad: `src/components/AccountStatement.tsx`
   - Kontoauszug-Ansicht

## Stripe-Integration

Die Stripe-Integration erfolgt in zwei Szenarien:

### Prepaid-Aufladung
```typescript
// 1. Aufladebetrag auswählen
// 2. Stripe Payment Intent erstellen
// 3. Stripe Checkout
// 4. Bei Erfolg: Transaktion erstellen + Balance aktualisieren
```

### Postpaid-Abrechnung
```typescript
// 1. Rechnung erstellen (am Ende der Periode)
// 2. Stripe Invoice erstellen
// 3. Automatischer Einzug
// 4. Bei Erfolg: Transaktion erstellen
```

**WICHTIG:** Die Stripe-Integration muss noch implementiert werden. Dafür siehe:
https://bolt.new/setup/stripe

## Nächste Schritte

1. **Stripe einrichten:**
   - Stripe-Account erstellen
   - API-Keys hinterlegen
   - Webhooks konfigurieren

2. **Benutzer-UI implementieren:**
   - Kontotyp-Auswahl in AccountSettings
   - Tarifauswahl-Button mit Modal
   - Auflade-Funktion für Prepaid
   - Kontoauszug in Navigation einbinden

3. **Abrechnungslogik:**
   - Automatische Rechnungserstellung
   - Nutzungserfassung
   - Limit-Überwachung

4. **Testing:**
   - Tarife buchen
   - Aufladungen testen
   - Kontoauszug prüfen
   - Stripe-Flow testen

## Support

Bei Fragen zur Billing-System-Implementierung:
- Siehe `BILLING_SYSTEM.md` für Tarif-Konfiguration
- Siehe `APPLY_MIGRATIONS.md` für Datenbank-Updates
