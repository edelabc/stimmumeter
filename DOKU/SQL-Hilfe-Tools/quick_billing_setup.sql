-- ============================================
-- QUICK STRIPE SETUP - SQL HELPER
-- ============================================
-- Verwende diese Queries um den Stripe-Status zu prüfen

-- 1. PRÜFE AKTUELLEN STATUS
-- ==========================
SELECT 
  'Stripe Status' as check_type,
  CASE WHEN is_active THEN '✅ AKTIV' ELSE '❌ INAKTIV' END as status,
  CASE WHEN is_test_mode THEN '🔵 Test-Modus' ELSE '🟢 Live-Modus' END as mode,
  CASE 
    WHEN config->>'publishable_key' IS NULL THEN '❌ Publishable Key fehlt'
    WHEN config->>'secret_key' IS NULL THEN '❌ Secret Key fehlt'
    ELSE '✅ Keys konfiguriert'
  END as keys_status
FROM payment_providers
WHERE code = 'stripe';

-- Wenn nichts angezeigt wird:
-- → Stripe ist noch nicht in der Datenbank
-- → Lauf die Migration: 20251109233050_create_payment_providers_system.sql


-- 2. PRÜFE WEBHOOK-KONFIGURATION
-- ===============================
SELECT 
  'Webhook Status' as check_type,
  CASE WHEN webhook_secret IS NOT NULL THEN '✅ Secret gesetzt' ELSE '❌ Secret fehlt' END as secret_status,
  CASE WHEN webhook_url IS NOT NULL THEN '✅ URL gesetzt' ELSE '❌ URL fehlt' END as url_status,
  CASE WHEN events IS NOT NULL THEN '✅ Events gesetzt' ELSE '❌ Events fehlen' END as events_status,
  CASE WHEN is_active THEN '✅ AKTIV' ELSE '⚠️ INAKTIV' END as status
FROM payment_provider_webhooks
WHERE provider_id = (SELECT id FROM payment_providers WHERE code = 'stripe');

-- Wenn nichts angezeigt wird:
-- → Noch kein Webhook konfiguriert
-- → Im Admin: Stripe Integration → Webhook-Felder ausfüllen


-- 3. ZEIGE VERSCHLÜSSELTE KEYS (FÜR DEBUG)
-- =========================================
SELECT 
  'Verschlüsselte Daten' as info,
  substring(config->>'publishable_key', 1, 20) || '...' as pub_key_preview,
  substring(config->>'secret_key', 1, 20) || '...' as secret_key_preview,
  length(config->>'publishable_key') as pub_key_length,
  length(config->>'secret_key') as secret_key_length
FROM payment_providers
WHERE code = 'stripe';

-- Keys sollten verschlüsselt sein (20-30 Zeichen)
-- Wenn länger: Sind echte Stripe Keys


-- 4. AKTIVIERE STRIPE (FALLS INAKTIV)
-- ====================================
-- Nur ausführen wenn Keys bereits konfiguriert sind!

/*
UPDATE payment_providers
SET 
  is_active = true,
  updated_at = NOW()
WHERE code = 'stripe';

SELECT '✅ Stripe aktiviert!' as result;
*/


-- 5. SETZE TEST-MODUS
-- ====================
/*
UPDATE payment_providers
SET 
  is_test_mode = true,
  updated_at = NOW()
WHERE code = 'stripe';

SELECT '✅ Test-Modus aktiviert!' as result;
*/


-- 6. COMPLETE STATUS CHECK
-- =========================
SELECT 
  '=== STRIPE SETUP STATUS ===' as title
UNION ALL
SELECT 
  'Provider: ' || 
  CASE WHEN is_active THEN '✅ Aktiv' ELSE '❌ Inaktiv' END || 
  ' | Modus: ' || 
  CASE WHEN is_test_mode THEN 'Test' ELSE 'Live' END
FROM payment_providers
WHERE code = 'stripe'
UNION ALL
SELECT 
  'Keys: ' || 
  CASE 
    WHEN config->>'publishable_key' IS NOT NULL AND config->>'secret_key' IS NOT NULL 
    THEN '✅ Beide gesetzt'
    ELSE '❌ Fehlend'
  END
FROM payment_providers
WHERE code = 'stripe'
UNION ALL
SELECT 
  'Webhook: ' || 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM payment_provider_webhooks 
      WHERE provider_id = (SELECT id FROM payment_providers WHERE code = 'stripe')
      AND webhook_secret IS NOT NULL
    ) THEN '✅ Konfiguriert'
    ELSE '⚠️ Optional (nicht zwingend)'
  END;


-- 7. ZEIGE LETZTE TRANSAKTIONEN
-- ==============================
SELECT 
  'Letzte Zahlungen' as title,
  transaction_date,
  description,
  credit as amount,
  stripe_payment_id
FROM account_transactions
WHERE transaction_type = 'payment'
  AND stripe_payment_id IS NOT NULL
ORDER BY transaction_date DESC
LIMIT 5;

-- Wenn leer: Noch keine Stripe-Zahlungen


-- 8. TROUBLESHOOTING: LÖSCHE ALTE WEBHOOK-DUPLIKATE
-- ==================================================
-- Nur ausführen wenn Duplikate existieren!

/*
-- Zeige Duplikate
SELECT 
  provider_id,
  COUNT(*) as anzahl
FROM payment_provider_webhooks
GROUP BY provider_id
HAVING COUNT(*) > 1;

-- Lösche ältere Duplikate (behält neuesten)
DELETE FROM payment_provider_webhooks
WHERE id NOT IN (
  SELECT DISTINCT ON (provider_id) id
  FROM payment_provider_webhooks
  ORDER BY provider_id, created_at DESC
);

SELECT '✅ Duplikate entfernt!' as result;
*/


-- ============================================
-- QUICK COMMANDS
-- ============================================

-- Stripe aktivieren:
-- UPDATE payment_providers SET is_active = true WHERE code = 'stripe';

-- Test-Modus setzen:
-- UPDATE payment_providers SET is_test_mode = true WHERE code = 'stripe';

-- Stripe deaktivieren:
-- UPDATE payment_providers SET is_active = false WHERE code = 'stripe';

-- Alle Stripe-Daten anzeigen:
-- SELECT * FROM payment_providers WHERE code = 'stripe';

-- Webhook-Daten anzeigen:
-- SELECT * FROM payment_provider_webhooks WHERE provider_id = (SELECT id FROM payment_providers WHERE code = 'stripe');
