# 🚀 KOMPLETTE STRIPE SETUP ANLEITUNG

## Problem: "checkout.stripe.com hat die Verbindung abgelehnt"

**Ursache:** Die aktuellen Keys in der Datenbank sind DEMO-KEYS!

---

## TEIL 1: STRIPE KEYS HOLEN

### Schritt 1: Stripe öffnen
**https://dashboard.stripe.com/test/apikeys**

### Schritt 2: Keys kopieren

**Publishable Key:**
```
pk_test_51H7xabc123...
↑ Direkt sichtbar - KOPIEREN!
```

**Secret Key:**
```
sk_test_•••••••••••
↑ Klicke "Reveal test key" - KOPIEREN!
```

---

## TEIL 2: KEYS SPEICHERN

### Im Admin speichern:
1. App → Admin-Login
2. Admin → "Stripe Integration"
3. Keys einfügen
4. "Speichern" klicken
5. "Aktivieren" klicken

---

## TEIL 3: WEBHOOK EINRICHTEN (WICHTIG!)

### Schritt 1: Webhook-URL finden

**Deine URL:**
```
https://[PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

**Wie finde ich meine Project-ID?**
1. Supabase Dashboard öffnen
2. URL anschauen: `https://supabase.com/dashboard/project/XYZABC123/...`
3. XYZABC123 ist deine Project-ID

**ODER:** Im Admin unter "Stripe Integration" wird die URL angezeigt!

### Schritt 2: Webhook in Stripe anlegen

1. **Öffne:** https://dashboard.stripe.com/test/webhooks

2. **Klicke:** "Endpoint hinzufügen"

3. **URL eingeben:**
   ```
   https://XYZABC123.supabase.co/functions/v1/stripe-webhook
   ↑ Deine Project-ID hier!
   ```

4. **Events auswählen:**
   ```
   ✅ checkout.session.completed
   ✅ payment_intent.succeeded  
   ✅ payment_intent.payment_failed
   ```

5. **Klicke:** "Endpoint hinzufügen"

6. **Secret kopieren:**
   ```
   whsec_abc123...
   ↑ Klicke "Reveal" - KOPIEREN!
   ```

### Schritt 3: Secret in App speichern

1. App → Admin → "Stripe Integration"
2. Scrolle zu "Webhooks"
3. Webhook Secret einfügen: `whsec_...`
4. Webhook URL prüfen (auto-filled)
5. Events auswählen (gleiche wie in Stripe)
6. "Speichern" klicken

---

## TEIL 4: TESTEN

1. **App:** Mein Konto → Aufladen → 10 EUR
2. **Erwartung:** Redirect zu Stripe Checkout ✅
3. **Test-Karte:** `4242 4242 4242 4242`
4. **Datum:** `12/34`
5. **CVC:** `123`
6. **Zahlen!**

**Prüfe in Stripe:**
https://dashboard.stripe.com/test/payments
→ Sollte Zahlung zeigen!

---

## WO WAS EINTRAGEN?

### In Stripe Dashboard:

**1. Endpoint-URL:**
```
https://XYZABC123.supabase.co/functions/v1/stripe-webhook
```

**2. Events:**
```
checkout.session.completed
payment_intent.succeeded
payment_intent.payment_failed
```

### In der App (Admin):

**1. Webhook Secret:**
```
whsec_... (von Stripe kopiert)
```

**2. Webhook URL:**
```
(Wird automatisch gefüllt - nicht ändern!)
```

**3. Events:**
```
Gleiche wie in Stripe auswählen
```

---

## TROUBLESHOOTING

### ❌ Keys speichern funktioniert nicht

**SQL-Check:**
```sql
SELECT 
  length(config->>'publishable_key') as len
FROM payment_providers 
WHERE code = 'stripe';
```

**Wenn len = 44:** Demo-Keys! Echte Keys verwenden!
**Wenn len > 100:** ✅ Echte Keys!

**Lösung:** `encrypt_stripe_keys.html` öffnen und Keys verschlüsseln!

### ❌ Webhook Fehler

**Prüfe:**
1. Webhook-URL korrekt?
2. Secret richtig kopiert?
3. Events ausgewählt?

**Logs prüfen:**
Supabase Dashboard → Edge Functions → stripe-webhook → Logs

---

## QUICK REFERENCE

**Stripe URLs:**
- Keys: https://dashboard.stripe.com/test/apikeys
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Payments: https://dashboard.stripe.com/test/payments

**Test-Karte:**
```
4242 4242 4242 4242 | 12/34 | 123
```

**Webhook-URL Format:**
```
https://[PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

**Wichtige Events:**
```
checkout.session.completed
payment_intent.succeeded
payment_intent.payment_failed
```

---

✅ Nach diesem Setup funktionieren alle Zahlungen!
