import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckoutRequest {
  amount: number;
  currency?: string;
  description?: string;
  appUrl?: string;
}

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
        ip_address: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'unknown',
        user_agent: req?.headers.get('user-agent') || 'unknown',
      });
  } catch (e) {
    console.error('Failed to write audit log:', e);  }
}

Deno.serve(async (req: Request) => {
  console.log('🔵 [EDGE] create-checkout-session called');
  console.log('🔵 [EDGE] Method:', req.method);
  console.log('🔵 [EDGE] URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('🔵 [EDGE] OPTIONS request - returning CORS headers');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔵 [EDGE] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'MISSING');

    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    console.log('🔵 [EDGE] Supabase URL:', supabaseUrl);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    console.log('🔵 [EDGE] Getting authenticated user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('🔴 [EDGE] User auth error:', userError);
      throw new Error('Unauthorized');
    }
    console.log('🟢 [EDGE] User authenticated:', user.id, user.email);

    // Create admin client for audit logging
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Parse request body
    const bodyText = await req.text();
    console.log('🔵 [EDGE] Request body (raw):', bodyText);

    const { amount, currency = 'EUR', description = 'Konto-Aufladung', appUrl }: CheckoutRequest = JSON.parse(bodyText);
    console.log('🔵 [EDGE] Parsed request:', { amount, currency, description, appUrl });

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (amount > 10000) {
      throw new Error('Amount too large (max 10,000 EUR)');
    }

    // Get active payment provider with Service Role
    console.log('🔵 [EDGE] Getting payment provider configuration...');

    const { data: provider, error: providerError } = await supabaseAdmin
      .from('payment_providers')
      .select('*')
      .eq('code', 'stripe')
      .eq('is_active', true)
      .single();

    if (providerError || !provider) {
      console.error('🔴 [EDGE] Provider error:', providerError);
      await logAudit(
        supabaseAdmin,
        user.id,
        'payment_checkout_failed',
        'payment',
        'error',
        { reason: 'provider_not_configured', error: providerError },
        'Stripe is not configured or not active',
        req
      );
      throw new Error('Stripe is not configured or not active');
    }
    console.log('🟢 [EDGE] Provider found:', {
      code: provider.code,
      is_active: provider.is_active,
      is_test_mode: provider.is_test_mode,
      has_publishable_key: !!provider.config.publishable_key,
      has_secret_key: !!provider.config.secret_key,
    });

    // Decrypt secret key
    const encryptedSecretKey = provider.config.secret_key;
    console.log('🔵 [EDGE] Encrypted secret key length:', encryptedSecretKey?.length || 0);

    if (!encryptedSecretKey) {
      await logAudit(
        supabaseAdmin,
        user.id,
        'payment_checkout_failed',
        'payment',
        'error',
        { reason: 'secret_key_missing' },
        'Stripe secret key not configured',
        req
      );
      throw new Error('Stripe secret key not configured');
    }

    // Simple decryption (matches frontend encryption)
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

    console.log('🔵 [EDGE] Decrypting secret key...');
    const secretKey = decryptValue(encryptedSecretKey);
    console.log('🟢 [EDGE] Secret key decrypted:', {
      length: secretKey.length,
      prefix: secretKey.substring(0, 8),
      suffix: secretKey.substring(secretKey.length - 4),
      startsWithSk: secretKey.startsWith('sk_'),
      isTestKey: secretKey.includes('_test_'),
    });

    // Initialize Stripe
    console.log('🔵 [EDGE] Initializing Stripe client...');
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    console.log('🟢 [EDGE] Stripe client initialized');

    // Create Checkout Session
    // Priority: 1) Request body appUrl, 2) Config app_url, 3) Origin header, 4) Fallback
    let origin = appUrl || provider.config.app_url || req.headers.get('origin') || 'http://localhost:5173';

    console.log('🔵 [EDGE] Origin sources:', {
      fromRequestBody: appUrl || null,
      fromConfig: provider.config.app_url || null,
      fromHeader: req.headers.get('origin') || null,
      final: origin,
    });

    // If it's a webcontainer URL, log warning
    if (origin.includes('webcontainer') || origin.includes('local-credentialless')) {
      console.log('⚠️ [EDGE] WARNING: WebContainer URL detected. This will NOT work for Stripe redirects!');
      console.log('⚠️ [EDGE] Please configure App URL in Admin → Stripe Integration');
    }

    console.log('🔵 [EDGE] Creating Stripe checkout session...');
    console.log('🔵 [EDGE] Session params:', {
      origin,
      amount,
      currency,
      user_id: user.id,
      user_email: user.email,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: `Aufladung des Guthabens um ${amount} ${currency}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancel`,
      metadata: {
        user_id: user.id,
        amount: amount.toString(),
        currency: currency,
        type: 'prepaid_recharge',
      },
      customer_email: user.email,
    });

    console.log('🟢 [EDGE] Checkout session created successfully!');
    console.log('🟢 [EDGE] Session ID:', session.id);
    console.log('🟢 [EDGE] Checkout URL:', session.url);

    // Log successful checkout session creation
    await logAudit(
      supabaseAdmin,
      user.id,
      'payment_checkout_created',
      'payment',
      'info',
      {
        session_id: session.id,
        amount,
        currency,
        description,
      },
      undefined,
      req
    );

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('🔴 [EDGE] Checkout session creation error:', error);
    console.error('🔴 [EDGE] Error name:', error.name);
    console.error('🔴 [EDGE] Error message:', error.message);
    console.error('🔴 [EDGE] Error stack:', error.stack);

    // Log error to audit logs (try to get user_id if available)
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }
      await logAudit(
        supabaseAdmin,
        userId,
        'payment_checkout_failed',
        'payment',
        'error',
        {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        },
        error.message,
        req
      );
    } catch (logError) {
      console.error('Failed to log error to audit:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create checkout session',
        errorName: error.name,
        errorStack: error.stack?.split('\n').slice(0, 3).join('\n'),
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