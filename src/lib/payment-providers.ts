import { apiClient } from './api-client';
import { ApiError } from './errors';

export interface PaymentProvider {
  id: string;
  code: 'stripe' | 'paypal' | 'other';
  name: string;
  is_active: boolean;
  is_test_mode: boolean;
  config: {
    publishable_key?: string;
    secret_key?: string;
    description?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface PaymentProviderWebhook {
  id: string;
  provider_id: string;
  webhook_secret: string;
  webhook_url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllPaymentProviders() {
  try {
    const response = await apiClient.get('/payment-providers.php?action=list');
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Payment Provider') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPaymentProvider(code: string) {
  try {
    const response = await apiClient.get(`/payment-providers.php?action=get&code=${encodeURIComponent(code)}`);
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Payment Provider nicht gefunden') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getActivePaymentProvider() {
  try {
    const response = await apiClient.get('/payment-providers.php?action=active');
    if (response.success) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden des aktiven Providers') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPaymentProvider(provider: Omit<PaymentProvider, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post('/payment-providers.php?action=upsert', provider);
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern des Payment Providers') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updatePaymentProviderConfig(code: string, config: any) {
  try {
    const provider = await getPaymentProvider(code);
    if (provider.error || !provider.data) {
      return { data: null, error: provider.error || new Error('Provider nicht gefunden') };
    }
    
    return await upsertPaymentProvider({
      ...provider.data,
      config,
    });
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function activatePaymentProvider(code: string, isActive: boolean) {
  try {
    const response = await apiClient.post('/payment-providers.php?action=activate', {
      code,
      is_active: isActive,
    });
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Aktivieren des Payment Providers') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getProviderWebhooks(providerId: string) {
  try {
    const response = await apiClient.get(`/payment-providers.php?action=webhooks&provider_id=${encodeURIComponent(providerId)}`);
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Webhooks') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertProviderWebhook(webhook: Partial<Omit<PaymentProviderWebhook, 'id' | 'created_at' | 'updated_at'>>) {
  try {
    const response = await apiClient.post('/payment-providers.php?action=upsert-webhook', webhook);
    if (response.success && response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern des Webhooks') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function deleteProviderWebhook(id: string) {
  try {
    const response = await apiClient.delete(`/payment-providers.php?action=webhook&id=${encodeURIComponent(id)}`);
    if (response.success) {
      return { data: null, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Löschen des Webhooks') };
  } catch (error: any) {
    return { data: null, error };
  }
}

// Stripe specific configuration
export interface StripeConfig {
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
  webhook_url: string;
  webhook_events: string[];
  description: string;
}

export const STRIPE_WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.succeeded',
  'charge.failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'checkout.session.completed',
  'checkout.session.expired',
];

export async function validateStripeConnection(publishableKey: string, secretKey: string): Promise<boolean> {
  // Basic validation
  const isPublishableValid = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_');
  const isSecretValid = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_');

  if (!isPublishableValid || !isSecretValid) {
    return false;
  }

  // Check if both keys are in same mode (test/live)
  const publishableIsTest = publishableKey.includes('_test_');
  const secretIsTest = secretKey.includes('_test_');

  return publishableIsTest === secretIsTest;
}
