# 🚀 Schnelle Stripe-Setup Anleitung

## Problem: "checkout.stripe.com hat die Verbindung abgelehnt"

Das bedeutet: Die Stripe-Keys in der Datenbank sind ungültig oder Demo-Keys.

## Lösung in 5 Minuten:

### Schritt 1: Stripe Account erstellen (2 Minuten)

1. **Öffne:** https://dashboard.stripe.com/register
2. **Registriere dich** (kostenlos!)
   - Email
   - Name
   - Passwort
3. **Email bestätigen**

### Schritt 2: Test-Keys holen (1 Minute)

1. **Nach Login:** Du bist automatisch im Test-Modus
2. **Klicke oben rechts:** "Developers" → "API keys"
   
   **ODER direkt:** https://dashboard.stripe.com/test/apikeys

3. **Du siehst 2 Keys:**
   ```
   Publishable key:  pk_test_51H... [Zeige Test-Keys]
                     ↑ Direkt sichtbar - KOPIEREN!
   
   Secret key:       sk_test_••••••••••• [Reveal test key]
                     ↑ Klicke "Reveal test key" - KOPIEREN!
   ```

### Schritt 3: Keys verschlüsseln (1 Minute)

**Option A: Mit Tool (empfohlen)**

1. Öffne im Projektordner: `encrypt_stripe_keys.html`
2. Füge beide Keys ein
3. Klicke "Keys verschlüsseln"
4. Kopiere das SQL-Statement

**Option B: Direkt im Admin**

1. Gehe zur App → Login als Admin
2. Admin-Dashboard → "Stripe Integration"
3. Keys direkt eingeben (werden automatisch verschlüsselt)
4. "Speichern" klicken

### Schritt 4: Keys speichern (1 Minute)

**Wenn du Option A gewählt hast:**

1. Öffne Supabase Dashboard
2. SQL Editor
3. Füge das SQL-Statement ein
4. "Run" klicken

**Wenn du Option B gewählt hast:**

1. Im Admin: "Aktivieren" klicken
2. Fertig!

### Schritt 5: Testen! (30 Sekunden)

1. Gehe zur App
2. Mein Konto → Billing & Tarife
3. "Aufladen" → 10 EUR
4. **JETZT sollte Stripe Checkout öffnen!** ✅

Test-Karte eingeben:
```
Kartennummer: 4242 4242 4242 4242
Datum: 12/34 (beliebig in Zukunft)
CVC: 123
PLZ: 12345
```

---

## Auf Stripe kontrollieren:

### 1. Sind die Keys richtig?

**Prüfe in Stripe Dashboard:**

```
https://dashboard.stripe.com/test/apikeys
```

✅ **Publishable key** beginnt mit `pk_test_`
✅ **Secret key** beginnt mit `sk_test_`

❌ Wenn sie mit `pk_live_` oder `sk_live_` beginnen:
   → Du bist im Live-Modus (brauchst Account-Verifizierung)
   → Wechsle zu Test-Modus (Toggle oben links)

### 2. Test-Modus aktiv?

**Oben links im Dashboard:**
```
🔵 Test-Modus     ← GUT! Nutze diesen!
oder
🟢 Live-Modus     ← Für echte Zahlungen (Account-Verifizierung nötig)
```

**Toggle klicken** um zwischen Test/Live zu wechseln.

### 3. Webhook kontrollieren (optional für später):

**Für jetzt:** Zahlungen funktionieren OHNE Webhook!

**Für Production:**

1. Stripe Dashboard → "Developers" → "Webhooks"
   
   **ODER:** https://dashboard.stripe.com/test/webhooks

2. "Add endpoint" klicken

3. **URL eingeben:**
   ```
   https://[dein-projekt].supabase.co/functions/v1/stripe-webhook
   ```
   
   Beispiel:
   ```
   https://xyzabcdefg.supabase.co/functions/v1/stripe-webhook
   ```

4. **Events auswählen:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. "Add endpoint" klicken

6. **Webhook Secret kopieren:**
   ```
   whsec_... ← Kopieren!
   ```

7. **Im Admin einfügen:**
   - Admin → Stripe Integration
   - Webhook Secret einfügen
   - Webhook URL: (automatisch gefüllt)
   - Events auswählen
   - Speichern

### 4. Zahlungen testen:

**Im Stripe Dashboard → "Payments":**

```
https://dashboard.stripe.com/test/payments
```

Nach jeder Test-Zahlung solltest du hier einen Eintrag sehen:
```
✅ Succeeded   €10.00   4242   Just now
```

---

## Häufige Fehler:

### ❌ "Invalid API Key"

**Ursache:** Falsche Keys oder Keys aus verschiedenen Modi gemischt

**Lösung:**
1. Prüfe ob beide Keys mit `pk_test_` und `sk_test_` beginnen
2. Stelle sicher, dass du im Test-Modus bist
3. Hole neue Keys von: https://dashboard.stripe.com/test/apikeys

### ❌ "checkout.stripe.com hat die Verbindung abgelehnt"

**Ursache:** Keys nicht konfiguriert oder ungültig

**Lösung:**
1. Öffne `encrypt_stripe_keys.html`
2. Füge echte Stripe Test-Keys ein
3. Kopiere SQL und führe es in Supabase aus

**Oder:** Im Admin direkt die Keys eingeben

### ❌ "Stripe not configured"

**Ursache:** Keys gespeichert aber nicht aktiviert

**Lösung:**
1. Admin → Stripe Integration
2. Klicke "Aktivieren"
3. Status sollte "✅ Aktiv" zeigen

---

## Verification Checklist:

- [ ] Stripe Account erstellt
- [ ] Test-Modus aktiv (Toggle oben links)
- [ ] Publishable Key kopiert (`pk_test_...`)
- [ ] Secret Key kopiert (`sk_test_...`)
- [ ] Keys verschlüsselt und in DB gespeichert
- [ ] Stripe im Admin aktiviert (Status: ✅ Aktiv)
- [ ] Test-Zahlung: Redirect zu Stripe Checkout funktioniert
- [ ] Test-Karte: 4242 4242 4242 4242
- [ ] Zahlung erfolgreich
- [ ] Guthaben erhöht
- [ ] Transaktion in Stripe Dashboard sichtbar

---

## Quick-Reference:

**Stripe Dashboard URLs:**

```
Registrierung:  https://dashboard.stripe.com/register
API Keys:       https://dashboard.stripe.com/test/apikeys
Payments:       https://dashboard.stripe.com/test/payments
Webhooks:       https://dashboard.stripe.com/test/webhooks
Test-Karten:    https://stripe.com/docs/testing
```

**Test-Karten:**

```
Erfolg:         4242 4242 4242 4242
Fehler:         4000 0000 0000 0002
3D Secure:      4000 0025 0000 3155
Abgelehnt:      4000 0000 0000 0341
```

**Supabase:**

```
Dashboard:      https://supabase.com/dashboard
SQL Editor:     Project → SQL Editor
Edge Functions: Project → Edge Functions
```

---

## Zusammenfassung:

### Was du brauchst:
1. ✅ Stripe Account (kostenlos)
2. ✅ Test-Mode Keys (pk_test_... & sk_test_...)
3. ✅ Keys in Datenbank speichern
4. ✅ Stripe aktivieren im Admin

### Was passiert dann:
1. ✅ User klickt "Aufladen"
2. ✅ Redirect zu Stripe Checkout
3. ✅ User zahlt mit Test-Karte
4. ✅ Redirect zurück zur App
5. ✅ Guthaben wird erhöht
6. ✅ Transaktion im Stripe Dashboard sichtbar

---

**Los geht's!** 🚀

Öffne jetzt: https://dashboard.stripe.com/test/apikeys und kopiere deine Keys!
