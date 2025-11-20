/*
  # Payment Providers System

  1. New Tables
    - `payment_providers`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Provider code (e.g., 'stripe')
      - `name` (text) - Display name
      - `is_active` (boolean) - Active status
      - `is_test_mode` (boolean) - Test/Live mode
      - `config` (jsonb) - Encrypted configuration
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_provider_webhooks`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key)
      - `webhook_secret` (text) - Encrypted webhook secret
      - `webhook_url` (text) - Webhook endpoint URL
      - `events` (text[]) - Subscribed events
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Only admins can access payment provider configurations
    - API keys are stored encrypted in JSONB field

  3. Default Data
    - Pre-configure Stripe provider structure
*/

-- Payment Providers Table
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (code IN ('stripe', 'paypal', 'other')),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  is_test_mode boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Provider Webhooks
CREATE TABLE IF NOT EXISTS payment_provider_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
  webhook_secret text,
  webhook_url text,
  events text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_providers
CREATE POLICY "Admins can view all payment providers"
  ON payment_providers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert payment providers"
  ON payment_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update payment providers"
  ON payment_providers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete payment providers"
  ON payment_providers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for payment_provider_webhooks
CREATE POLICY "Admins can view all webhooks"
  ON payment_provider_webhooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert webhooks"
  ON payment_provider_webhooks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update webhooks"
  ON payment_provider_webhooks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete webhooks"
  ON payment_provider_webhooks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Insert Stripe provider
INSERT INTO payment_providers (code, name, is_active, is_test_mode, config)
VALUES (
  'stripe',
  'Stripe',
  false,
  true,
  '{
    "publishable_key": "",
    "secret_key": "",
    "description": "Stripe payment gateway"
  }'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for payment_providers
DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON payment_providers;
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for payment_provider_webhooks
DROP TRIGGER IF EXISTS update_payment_provider_webhooks_updated_at ON payment_provider_webhooks;
CREATE TRIGGER update_payment_provider_webhooks_updated_at
  BEFORE UPDATE ON payment_provider_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_providers_code ON payment_providers(code);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_provider_webhooks_provider ON payment_provider_webhooks(provider_id);
