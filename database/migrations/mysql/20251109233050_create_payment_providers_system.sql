/*
  # Payment Providers System

  1. New Tables
    - `payment_providers`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Provider code (e.g., 'stripe')
      - `name` (text) - Display name
      - `is_active` (TINYINT(1)) - Active status
      - `is_test_mode` (TINYINT(1)) - Test/Live mode
      - `config` (JSON) - Encrypted configuration
      - `created_at` (DATETIME)
      - `updated_at` (DATETIME)

    - `payment_provider_webhooks`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key)
      - `webhook_secret` (text) - Encrypted webhook secret
      - `webhook_url` (text) - Webhook endpoint URL
      - `events` (text[]) - Subscribed events
      - `is_active` (TINYINT(1))
      - `created_at` (DATETIME)

  2. Security
    - Enable RLS on all tables
    - Only admins can access payment provider configurations
    - API keys are stored encrypted in JSON field

  3. Default Data
    - Pre-configure Stripe provider structure
*/

-- Payment Providers Table
CREATE TABLE IF NOT EXISTS payment_providers (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (code IN ('stripe', 'paypal', 'other')),
  name text NOT NULL,
  is_active TINYINT(1) DEFAULT 0,
  is_test_mode TINYINT(1) DEFAULT 1,
  config JSON DEFAULT '{}'::JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment Provider Webhooks
CREATE TABLE IF NOT EXISTS payment_provider_webhooks (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id CHAR(36) NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
  webhook_secret text,
  webhook_url text,
  events text[] DEFAULT ARRAY[]::text[],
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS

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
  }'::JSON
)
ON DUPLICATE KEY UPDATE code = code;

-- Create updated_at trigger function if not exists

-- Add trigger for payment_providers
DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON payment_providers;

-- Add trigger for payment_provider_webhooks
DROP TRIGGER IF EXISTS update_payment_provider_webhooks_updated_at ON payment_provider_webhooks;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_providers_code ON payment_providers(code);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_provider_webhooks_provider ON payment_provider_webhooks(provider_id);