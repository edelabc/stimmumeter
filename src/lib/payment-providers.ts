import { supabase } from './supabase';

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
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .order('name');
  return { data, error };
}

export async function getPaymentProvider(code: string) {
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  return { data, error };
}

export async function getActivePaymentProvider() {
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  return { data, error };
}

export async function upsertPaymentProvider(provider: Omit<PaymentProvider, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('payment_providers')
    .upsert(provider, { onConflict: 'code' })
    .select()
    .single();
  return { data, error };
}

export async function updatePaymentProviderConfig(code: string, config: any) {
  const { data, error } = await supabase
    .from('payment_providers')
    .update({ config })
    .eq('code', code)
    .select()
    .single();
  return { data, error };
}

export async function activatePaymentProvider(code: string, isActive: boolean) {
  // Deactivate all other providers if activating this one
  if (isActive) {
    await supabase
      .from('payment_providers')
      .update({ is_active: false })
      .neq('code', code);
  }

  const { data, error } = await supabase
    .from('payment_providers')
    .update({ is_active: isActive })
    .eq('code', code)
    .select()
    .single();
  return { data, error };
}

export async function getProviderWebhooks(providerId: string) {
  const { data, error } = await supabase
    .from('payment_provider_webhooks')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function upsertProviderWebhook(webhook: Partial<Omit<PaymentProviderWebhook, 'id' | 'created_at' | 'updated_at'>>) {
  // Check if webhook exists for this provider
  const { data: existing } = await supabase
    .from('payment_provider_webhooks')
    .select('id')
    .eq('provider_id', webhook.provider_id!)
    .maybeSingle();

  if (existing) {
    // Update existing webhook
    const { data, error } = await supabase
      .from('payment_provider_webhooks')
      .update({
        ...webhook,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    // Insert new webhook
    const { data, error } = await supabase
      .from('payment_provider_webhooks')
      .insert(webhook)
      .select()
      .single();
    return { data, error };
  }
}

export async function deleteProviderWebhook(id: string) {
  const { data, error } = await supabase
    .from('payment_provider_webhooks')
    .delete()
    .eq('id', id);
  return { data, error };
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
