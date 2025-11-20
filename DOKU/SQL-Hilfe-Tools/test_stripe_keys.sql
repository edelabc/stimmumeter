-- Test Stripe Configuration
-- Führe dieses Script im Supabase SQL Editor aus

-- 1. Prüfe aktuellen Status
SELECT
  id,
  code,
  name,
  is_active,
  is_test_mode,
  config->>'publishable_key' as pub_key_encrypted,
  config->>'secret_key' as secret_key_encrypted,
  created_at,
  updated_at
FROM payment_providers
WHERE code = 'stripe';

-- 2. Optional: Setze gültige Test-Keys
-- WICHTIG: Ersetze diese mit echten Stripe Test-Keys!
-- Hol sie von: https://dashboard.stripe.com/test/apikeys

-- Verschlüsselungs-Funktion (Javascript - im Browser Console ausführen):
/*
function encryptValue(value) {
  const key = 'mood-app-encryption-key-v1';
  let encrypted = '';
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

// Verschlüssle deine Keys:
const publishableKey = 'pk_test_...'; // DEIN KEY
const secretKey = 'sk_test_...'; // DEIN KEY

console.log('Publishable (encrypted):', encryptValue(publishableKey));
console.log('Secret (encrypted):', encryptValue(secretKey));
*/

-- 3. Update mit verschlüsselten Keys (Beispiel)
-- WARNUNG: Diese Demo-Keys funktionieren NICHT! Nutze echte Stripe Keys!
/*
UPDATE payment_providers
SET
  config = jsonb_build_object(
    'publishable_key', 'ENCRYPTED_PK_HERE',
    'secret_key', 'ENCRYPTED_SK_HERE',
    'description', 'Stripe payment gateway'
  ),
  is_active = true,
  is_test_mode = true,
  updated_at = NOW()
WHERE code = 'stripe';
*/

-- 4. Prüfe ob Update erfolgreich war
SELECT
  'Keys gesetzt: ' ||
  CASE
    WHEN config->>'publishable_key' IS NOT NULL AND config->>'secret_key' IS NOT NULL
    THEN '✅ JA'
    ELSE '❌ NEIN'
  END as keys_status,
  'Aktiviert: ' ||
  CASE WHEN is_active THEN '✅ JA' ELSE '❌ NEIN' END as active_status,
  'Test-Modus: ' ||
  CASE WHEN is_test_mode THEN '✅ JA' ELSE '❌ NEIN' END as test_mode_status
FROM payment_providers
WHERE code = 'stripe';
