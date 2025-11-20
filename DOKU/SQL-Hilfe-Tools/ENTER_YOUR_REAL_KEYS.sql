-- ==========================================
-- STRIPE KEYS EINGEBEN - SCHRITT FÜR SCHRITT
-- ==========================================

/*
WICHTIG: Sie müssen ECHTE Stripe Keys eingeben!

1. Öffnen Sie: https://dashboard.stripe.com/test/apikeys

2. Kopieren Sie:
   - Publishable Key: pk_test_51...
   - Secret Key: sk_test_51... (klicke "Reveal test key")

3. Verschlüsseln Sie die Keys:
   - Öffnen Sie im Projektordner: encrypt_stripe_keys.html
   - Fügen Sie beide Keys ein
   - Klicken Sie "Verschlüsseln"
   - Kopieren Sie die verschlüsselten Keys

4. Ersetzen Sie unten die Werte:
   - 'IHR_VERSCHLÜSSELTER_PUBLISHABLE_KEY'
   - 'IHR_VERSCHLÜSSELTER_SECRET_KEY'

5. Führen Sie dieses SQL aus!
*/

-- ==========================================
-- SCHRITT 1: Keys aktualisieren
-- ==========================================

UPDATE payment_providers
SET
  config = jsonb_build_object(
    'publishable_key', 'IHR_VERSCHLÜSSELTER_PUBLISHABLE_KEY',
    'secret_key', 'IHR_VERSCHLÜSSELTER_SECRET_KEY',
    'webhook_secret', 'GgccAU4+PhxkITY2Ni0TLhA5CG9aFzd1Ln1aBDwHXFEjHWIGOg0=',
    'webhook_url', 'https://apacsqcodgyohiebjhjb.supabase.co/functions/v1/stripe-webhook',
    'webhook_events', '["checkout.session.completed", "payment_intent.succeeded", "payment_intent.payment_failed"]',
    'description', 'Stripe payment gateway'
  ),
  is_active = true,
  is_test_mode = true,
  updated_at = NOW()
WHERE code = 'stripe';

-- ==========================================
-- SCHRITT 2: Prüfen ob es funktioniert hat
-- ==========================================

SELECT 
  '=== VERIFICATION ===' as check_result,
  is_active,
  is_test_mode,
  length(config->>'publishable_key') as pub_key_length,
  length(config->>'secret_key') as secret_key_length,
  length(config->>'webhook_secret') as webhook_length,
  CASE 
    WHEN length(config->>'publishable_key') = 44 THEN '❌ NOCH DEMO-KEYS!'
    WHEN length(config->>'publishable_key') > 100 THEN '✅ ECHTE KEYS!'
    ELSE '⚠️ UNBEKANNT'
  END as status,
  config->>'webhook_url' as webhook_url
FROM payment_providers
WHERE code = 'stripe';

/*
ERWARTETES ERGEBNIS:
- pub_key_length: > 100
- secret_key_length: > 100
- webhook_length: 52
- status: ✅ ECHTE KEYS!
*/
