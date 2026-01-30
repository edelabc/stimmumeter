/**
 * Stripe Service
 * Handhabt Stripe-Zahlungen via lokale PHP-API
 * Komplett unabhängig von Supabase
 */

import { getApiBaseUrl } from './api-client';
import { getAuthHeaders } from './auth-mysql';
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

  try {
    // Call local PHP API to create checkout session
    const response = await fetch(`${getApiBaseUrl()}/stripe-checkout.php?action=create-checkout-session`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
        appUrl: finalAppUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('Checkout session creation error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Redirect to Stripe Checkout
    if (!data.url) {
      throw new Error('Keine Checkout-URL erhalten. Bitte kontaktieren Sie den Administrator.');
    }

    window.location.assign(data.url);
  } catch (error: any) {
    console.error('Checkout session creation error:', error);

    // Provide user-friendly error messages
    if (error.message.includes('nicht konfiguriert') || error.message.includes('nicht aktiv')) {
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
  try {
    const response = await fetch(`${getApiBaseUrl()}/stripe-checkout.php?action=verify-session`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
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
  // Verify session with Stripe via local PHP API
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
