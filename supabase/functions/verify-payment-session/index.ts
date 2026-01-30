import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerifyRequest {
  sessionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { sessionId }: VerifyRequest = await req.json();

    if (!sessionId) {
      throw new Error('Missing session ID');
    }

    // Get Stripe configuration with Service Role
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: provider } = await supabaseAdmin
      .from('payment_providers')
      .select('*')
      .eq('code', 'stripe')
      .eq('is_active', true)
      .single();

    if (!provider) {
      throw new Error('Stripe not configured');
    }

    // Decrypt secret key
    const decryptValue = (encrypted: string): string => {
      const key = 'mood-app-encryption-key-v1';
      const decoded = atob(encrypted);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    };

    const secretKey = decryptValue(provider.config.secret_key);

    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify user matches
    if (session.metadata?.user_id !== user.id) {
      throw new Error('Session does not belong to user');
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Get amount from metadata
    const amount = parseFloat(session.metadata?.amount || '0');
    const currency = session.metadata?.currency || 'EUR';

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        amount,
        currency,
        status: session.payment_status,
        sessionId: session.id,
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
    console.error('Session verification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error.message || 'Failed to verify session',
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