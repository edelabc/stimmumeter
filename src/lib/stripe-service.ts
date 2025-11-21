import { supabase } from './supabase';
import { createAccountTransaction, getUserAccountConfig, upsertUserAccountConfig } from './billing';

export interface CreateCheckoutSessionParams {
  amount: number;
  currency?: string;
  description?: string;
  userId: string;
  appUrl?: string;
}

export async function createPrepaidCheckoutSession(params: CreateCheckoutSessionParams): Promise<void> {
  const { amount, currency = 'EUR', description = 'Konto-Aufladung', appUrl } = params;

  // Get app URL from params or environment variable
  const finalAppUrl = appUrl || import.meta.env.VITE_APP_URL || window.location.origin;

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error('Ungültiger Betrag');
  }

  if (amount > 10000) {
    throw new Error('Betrag zu hoch (max. 10.000 EUR)');
  }

  if (!supabase) {
    throw new Error('Supabase ist nicht konfiguriert');
  }

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Nicht angemeldet');
    }

    // Call Edge Function to create checkout session
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

    console.log('🔵 [STRIPE DEBUG] Creating checkout session...');
    console.log('🔵 [REQUEST] URL:', apiUrl);
    console.log('🔵 [REQUEST] Method: POST');
    console.log('🔵 [REQUEST] Headers:', {
      'Authorization': `Bearer ${session.access_token.substring(0, 20)}...`,
      'Content-Type': 'application/json',
    });
    console.log('🔵 [REQUEST] Body:', JSON.stringify({
      amount,
      currency,
      description,
      appUrl: finalAppUrl,
    }, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
        appUrl: finalAppUrl,
      }),
    });

    console.log('🟢 [RESPONSE] Status:', response.status, response.statusText);
    console.log('🟢 [RESPONSE] Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('🟢 [RESPONSE] Body (raw):', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('🟢 [RESPONSE] Body (parsed):', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('🔴 [ERROR] Failed to parse response:', parseError);
      console.error('🔴 [ERROR] Raw response text:', responseText);
      throw new Error(
        'Fehler beim Parsen der Server-Antwort.\n\n' +
        'Mögliche Ursachen:\n' +
        '- Edge Function nicht deployed\n' +
        '- Ungültige Stripe-Keys\n' +
        '- Server-Fehler\n\n' +
        'Bitte prüfen Sie die Edge Function Logs im Supabase Dashboard.'
      );
    }

    if (!response.ok || !data.success) {
      const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('🔴 [ERROR] Edge Function error:', errorMessage);
      console.error('🔴 [ERROR] Full response data:', data);
      throw new Error(errorMessage);
    }

    console.log('🟢 [SUCCESS] Checkout session created!');
    console.log('🟢 [SUCCESS] Session ID:', data.sessionId);
    console.log('🟢 [SUCCESS] Checkout URL:', data.url);

    // Redirect to Stripe Checkout
    if (!data.url) {
      console.error('🔴 [ERROR] No URL in response!');
      console.error('🔴 [ERROR] Full response data:', JSON.stringify(data, null, 2));
      throw new Error('Keine Checkout-URL erhalten. Bitte kontaktieren Sie den Administrator.');
    }

    console.log('🔵 [REDIRECT] Redirecting to Stripe Checkout...');
    console.log('🔵 [REDIRECT] URL:', data.url);
    console.log('🔵 [REDIRECT] URL type:', typeof data.url);
    console.log('🔵 [REDIRECT] URL length:', data.url.length);

    // Use window.location.assign for better compatibility
    try {
      window.location.assign(data.url);
    } catch (redirectError) {
      console.error('🔴 [ERROR] Redirect failed:', redirectError);
      // Fallback: try href
      window.location.href = data.url;
    }
  } catch (error: any) {
    console.error('Checkout session creation error:', error);

    // Provide user-friendly error messages
    if (error.message.includes('not configured') || error.message.includes('not active')) {
      throw new Error(
        '⚠️ Stripe ist nicht konfiguriert!\n\n' +
        'Bitte wenden Sie sich an den Administrator, um Stripe zu aktivieren.\n\n' +
        'Admin-Schritte:\n' +
        '1. Als Admin anmelden\n' +
        '2. Admin-Dashboard → "Stripe Integration"\n' +
        '3. API-Keys eingeben\n' +
        '4. "Aktivieren" klicken'
      );
    }

    throw error;
  }
}

export async function verifyPaymentSession(sessionId: string): Promise<{
  verified: boolean;
  amount: number;
  currency: string;
}> {
  if (!supabase) {
    throw new Error('Supabase ist nicht konfiguriert');
  }

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Nicht angemeldet');
    }

    // Call Edge Function to verify session
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment-session`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Fehler beim Verifizieren der Session');
    }

    return {
      verified: data.verified,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error: any) {
    console.error('Session verification error:', error);
    throw error;
  }
}

export async function handlePaymentSuccess(sessionId: string, userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist nicht konfiguriert');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Benutzer nicht authentifiziert');
  }

  // Verify session with Stripe
  const verification = await verifyPaymentSession(sessionId);

  if (!verification.verified) {
    throw new Error('Zahlung konnte nicht verifiziert werden');
  }

  const amount = verification.amount;

  // Get current account config
  const { data: accountConfig } = await getUserAccountConfig(userId);

  if (!accountConfig) {
    throw new Error('Konto-Konfiguration nicht gefunden');
  }

  const newBalance = (accountConfig.balance || 0) + amount;

  // Update balance
  await upsertUserAccountConfig({
    user_id: userId,
    account_type: accountConfig.account_type,
    current_plan_id: accountConfig.current_plan_id,
    balance: newBalance,
  });

  // Create transaction record
  await createAccountTransaction({
    user_id: userId,
    transaction_date: new Date().toISOString(),
    document_number: `PAY-${Date.now()}`,
    description: `Stripe Zahlung (Session: ${sessionId.substring(0, 20)}...)`,
    debit: null,
    credit: amount,
    balance_after: newBalance,
    transaction_type: 'payment',
    related_invoice_id: null,
    stripe_payment_id: sessionId,
  });

  return { success: true, newBalance, amount };
}

// Helper function to get Supabase URL
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL;
}
