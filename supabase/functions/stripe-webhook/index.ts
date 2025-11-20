import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature',
};

// Helper function to log to audit_logs
async function logAudit(
  supabaseAdmin: any,
  userId: string | null,
  action: string,
  category: string,
  severity: 'info' | 'warning' | 'error',
  details: any,
  errorMessage?: string,
  req?: Request
) {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        category,
        severity,
        details,
        error_message: errorMessage,
        ip_address: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'stripe-webhook',
        user_agent: req?.headers.get('user-agent') || 'stripe-webhook',
      });
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const body = await req.text();

    // Get Stripe configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: provider } = await supabaseAdmin
      .from('payment_providers')
      .select('*')
      .eq('code', 'stripe')
      .eq('is_active', true)
      .maybeSingle();

    if (!provider) {
      await logAudit(
        supabaseAdmin,
        null,
        'webhook_failed',
        'payment',
        'error',
        { reason: 'provider_not_configured' },
        'Stripe not configured',
        req
      );
      throw new Error('Stripe not configured');
    }

    // Get webhook secret
    const { data: webhook } = await supabaseAdmin
      .from('payment_provider_webhooks')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!webhook || !webhook.webhook_secret) {
      console.warn('Webhook secret not configured - processing without signature verification');
      // For development/testing: Process webhook without signature verification
      // In production, you should throw an error here
      const event = JSON.parse(body);
      console.log('Webhook event received (unverified):', event.type);

      // Handle event
      if (event.type === 'checkout.session.completed') {
        await handleCheckoutSessionCompleted(event.data.object, supabaseAdmin);
      }

      return new Response(
        JSON.stringify({ received: true, warning: 'No signature verification' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Decrypt webhook secret
    const base64Decode = (str: string): string => {
      const binaryString = atob(str);
      const bytes: number[] = [];
      for (let i = 0; i < binaryString.length; i++) {
        bytes.push(binaryString.charCodeAt(i));
      }
      return String.fromCharCode(...bytes);
    };

    const decryptValue = (encrypted: string): string => {
      const key = 'mood-app-encryption-key-v1';
      const decoded = base64Decode(encrypted);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    };

    const webhookSecret = decryptValue(webhook.webhook_secret);
    const secretKey = decryptValue(provider.config.secret_key);

    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature (use async version for Edge Functions)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      await logAudit(
        supabaseAdmin,
        null,
        'webhook_signature_failed',
        'payment',
        'error',
        { error: err.message },
        'Invalid signature',
        req
      );
      throw new Error('Invalid signature');
    }

    console.log('Webhook event received:', event.type);

    // Log webhook received
    await logAudit(
      supabaseAdmin,
      null,
      'webhook_received',
      'payment',
      'info',
      { event_type: event.type, event_id: event.id },
      undefined,
      req
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabaseAdmin, req);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        await logAudit(
          supabaseAdmin,
          null,
          'payment_failed',
          'payment',
          'error',
          { payment_intent_id: paymentIntent.id },
          'Payment failed',
          req
        );
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);

    // Log webhook error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await logAudit(
        supabaseAdmin,
        null,
        'webhook_error',
        'payment',
        'error',
        { error: error.message },
        error.message,
        req
      );
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'Webhook processing failed',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function handleCheckoutSessionCompleted(
  session: any,
  supabase: any,
  req?: Request
) {
  try {
    const userId = session.metadata?.user_id;
    const amount = parseFloat(session.metadata?.amount || '0');
    const currency = session.metadata?.currency || 'EUR';

    if (!userId || !amount) {
      console.error('Missing metadata in session:', session.id);
      await logAudit(
        supabase,
        null,
        'payment_processing_failed',
        'payment',
        'error',
        { session_id: session.id, reason: 'missing_metadata' },
        'Missing metadata in session',
        req
      );
      return;
    }

    // Get current account config
    const { data: accountConfig } = await supabase
      .from('user_account_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!accountConfig) {
      console.error('Account config not found for user:', userId);
      await logAudit(
        supabase,
        userId,
        'payment_processing_failed',
        'payment',
        'error',
        { session_id: session.id, reason: 'account_config_not_found' },
        'Account config not found',
        req
      );
      return;
    }

    // Calculate new balance: Add amount (prepaid credit)
    const newBalance = (accountConfig.balance || 0) + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('user_account_config')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      await logAudit(
        supabase,
        userId,
        'payment_processing_failed',
        'payment',
        'error',
        { session_id: session.id, reason: 'balance_update_failed', error: updateError },
        'Failed to update balance',
        req
      );
      throw updateError;
    }

    const transactionDate = new Date().toISOString();
    const documentNumber = `PAY-${Date.now()}`;
    const balanceAfterCredit = (accountConfig.balance || 0) + amount;
    const balanceAfterDebit = balanceAfterCredit;

    // Create TWO transaction records (double-entry bookkeeping):
    // 1. HABEN (Credit): Customer owes us money for the prepaid credit
    // 2. SOLL (Debit): Payment received, debt is settled

    const transactions = [
      {
        user_id: userId,
        transaction_date: transactionDate,
        document_number: documentNumber,
        description: 'Prepaid-Aufladung (Guthaben erworben)',
        debit: null,
        credit: amount,
        balance_after: balanceAfterCredit,
        transaction_type: 'prepaid_purchase',
        related_invoice_id: null,
        stripe_payment_id: session.id,
      },
      {
        user_id: userId,
        transaction_date: transactionDate,
        document_number: documentNumber,
        description: 'Prepaid-Aufladung (Zahlung eingegangen)',
        debit: amount,
        credit: null,
        balance_after: balanceAfterDebit,
        transaction_type: 'payment',
        related_invoice_id: null,
        stripe_payment_id: session.id,
      },
    ];

    const { error: transactionError } = await supabase
      .from('account_transactions')
      .insert(transactions);

    if (transactionError) {
      console.error('Failed to create transactions:', transactionError);
      await logAudit(
        supabase,
        userId,
        'payment_processing_failed',
        'payment',
        'error',
        { session_id: session.id, reason: 'transaction_record_failed', error: transactionError },
        'Failed to create transactions',
        req
      );
      throw transactionError;
    }

    console.log(`Successfully processed payment for user ${userId}: +${amount} ${currency}`);

    // Log successful payment processing
    await logAudit(
      supabase,
      userId,
      'payment_completed',
      'payment',
      'info',
      {
        session_id: session.id,
        amount,
        currency,
        old_balance: accountConfig.balance || 0,
        new_balance: newBalance,
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error('Error handling checkout session:', error);
    await logAudit(
      supabase,
      session.metadata?.user_id || null,
      'payment_processing_failed',
      'payment',
      'error',
      { session_id: session.id, error: error.message },
      error.message,
      req
    );
    throw error;
  }
}