/*
  # Comprehensive Billing System

  ## Overview
  This migration creates a complete billing and subscription management system with:
  - Multi-currency support with exchange rate history
  - Flexible pricing plans with trial periods
  - Usage-based billing with limits and quotas
  - User subscription management
  - Invoice generation and history
  - Contextual help system

  ## New Tables

  ### 1. Currencies (`currencies`)
  - `code` (text, primary key) - ISO currency code (EUR, USD, YRA)
  - `name` (text) - Full currency name
  - `symbol` (text) - Currency symbol
  - `is_base` (TINYINT(1)) - Is this the base currency
  - `is_active` (TINYINT(1)) - Is currency active
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 2. Exchange Rates (`exchange_rates`)
  - `id` (uuid, primary key)
  - `from_currency` (text, foreign key to currencies)
  - `to_currency` (text, foreign key to currencies)
  - `rate` (DECIMAL(10,2)) - Exchange rate factor
  - `valid_from` (DATETIME) - Rate valid from this timestamp
  - `created_by` (uuid, foreign key to admin_users)
  - `created_at` (DATETIME)

  ### 3. Pricing Plans (`pricing_plans`)
  - `id` (uuid, primary key)
  - `name` (text) - Plan name
  - `description` (text) - Plan description
  - `is_active` (TINYINT(1)) - Is plan available for new subscriptions
  - `sort_order` (INT) - Display order
  - `color` (text) - Color for UI display (hex code)
  - `version` (INT) - Plan version for changes
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 4. Plan Trial Configuration (`plan_trial_config`)
  - `id` (uuid, primary key)
  - `plan_id` (uuid, foreign key to pricing_plans)
  - `is_enabled` (TINYINT(1)) - Is trial enabled
  - `duration_value` (INT) - Trial duration number
  - `duration_unit` (text) - days, months, permanent
  - `is_permanent` (TINYINT(1)) - Is trial permanent (no billing after)

  ### 5. Plan Trial Limits (`plan_trial_limits`)
  - `id` (uuid, primary key)
  - `trial_config_id` (uuid, foreign key to plan_trial_config)
  - `limit_period_value` (INT) - Period for limits
  - `limit_period_unit` (text) - days, months
  - `pseudonym_limit` (INT) - NULL for unlimited
  - `entry_limit` (INT) - NULL for unlimited
  - `ai_integration_limit` (INT) - NULL for unlimited

  ### 6. Plan Subscription Config (`plan_subscription_config`)
  - `id` (uuid, primary key)
  - `plan_id` (uuid, foreign key to pricing_plans)
  - `billing_type` (text) - postpaid, prepaid
  - `contract_duration_value` (INT)
  - `contract_duration_unit` (text) - days, months
  - `cancellation_period_value` (INT)
  - `cancellation_period_unit` (text) - days, months
  - `billing_cycle` (text) - hourly, daily, monthly, yearly
  - `base_fee_once` (DECIMAL(10,2)) - One-time setup fee
  - `base_fee_recurring` (DECIMAL(10,2)) - Recurring base fee

  ### 7. Plan Subscription Limits (`plan_subscription_limits`)
  - `id` (uuid, primary key)
  - `subscription_config_id` (uuid, foreign key to plan_subscription_config)
  - `limit_period_value` (INT)
  - `limit_period_unit` (text) - days, months
  - `pseudonym_limit` (INT) - NULL for unlimited
  - `entry_limit` (INT) - NULL for unlimited
  - `ai_integration_limit` (INT) - NULL for unlimited

  ### 8. Billing Item Types (`billing_item_types`)
  - `id` (uuid, primary key)
  - `code` (text, unique) - Internal code (pseudonym, ai_call, mood_entry, etc.)
  - `name` (text) - Display name
  - `description` (text)
  - `icon` (text) - Lucide icon name
  - `is_active` (TINYINT(1))
  - `sort_order` (INT)

  ### 9. Plan Billing Items (`plan_billing_items`)
  - `id` (uuid, primary key)
  - `plan_id` (uuid, foreign key to pricing_plans)
  - `item_type_id` (uuid, foreign key to billing_item_types)
  - `price_per_unit` (DECIMAL(10,2)) - Price per unit in base currency
  - `currency_code` (text, foreign key to currencies)
  - `is_active` (TINYINT(1))

  ### 10. User Subscriptions (`user_subscriptions`)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `plan_id` (uuid, foreign key to pricing_plans)
  - `status` (text) - trial, active, cancelled, expired
  - `trial_start_date` (DATETIME)
  - `trial_end_date` (DATETIME)
  - `subscription_start_date` (DATETIME)
  - `subscription_end_date` (DATETIME)
  - `cancellation_date` (DATETIME)
  - `auto_renew` (TINYINT(1))
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 11. Usage Records (`usage_records`)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `subscription_id` (uuid, foreign key to user_subscriptions)
  - `item_type_id` (uuid, foreign key to billing_item_types)
  - `quantity` (INT)
  - `reference_id` (uuid) - Reference to actual record (pseudonym_id, entry_id, etc.)
  - `recorded_at` (DATETIME)
  - `billing_period_start` (DATETIME)
  - `billing_period_end` (DATETIME)
  - `is_billed` (TINYINT(1))

  ### 12. Invoices (`invoices`)
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Generated invoice number
  - `user_id` (uuid, foreign key to auth.users)
  - `subscription_id` (uuid, foreign key to user_subscriptions)
  - `status` (text) - draft, issued, paid, overdue, cancelled
  - `issue_date` (DATETIME)
  - `due_date` (DATETIME)
  - `paid_date` (DATETIME)
  - `billing_period_start` (DATETIME)
  - `billing_period_end` (DATETIME)
  - `subtotal` (DECIMAL(10,2))
  - `tax_rate` (DECIMAL(10,2))
  - `tax_amount` (DECIMAL(10,2))
  - `total_amount` (DECIMAL(10,2))
  - `currency_code` (text, foreign key to currencies)
  - `notes` (text)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 13. Invoice Items (`invoice_items`)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key to invoices)
  - `item_type_id` (uuid, foreign key to billing_item_types)
  - `description` (text)
  - `quantity` (INT)
  - `unit_price` (DECIMAL(10,2))
  - `line_total` (DECIMAL(10,2))
  - `sort_order` (INT)

  ### 14. Help Texts (`help_texts`)
  - `id` (uuid, primary key)
  - `code` (text, unique) - Unique identifier for help text
  - `title` (text) - Help text title
  - `content` (text) - Help text content (supports markdown)
  - `context` (text) - Where it's used (billing_plan, currency_exchange, etc.)
  - `is_active` (TINYINT(1))
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ## Security
  - Enable RLS on all tables
  - Admins can manage all billing configuration
  - Users can only view their own subscriptions and invoices
  - Public can view active pricing plans for comparison
  - Audit trail for all changes

  ## Notes
  1. Plan versioning allows changing plans without affecting existing subscribers
  2. Exchange rates are timestamped for historical accuracy
  3. Usage tracking happens automatically via triggers
  4. Invoices are generated based on billing cycle
  5. Help texts are editable by admins and displayed as tooltips
*/

-- =====================================================
-- CURRENCIES
-- =====================================================

CREATE TABLE IF NOT EXISTS currencies (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
  name text NOT NULL,
  symbol text NOT NULL,
  is_base TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "Anyone can view active currencies"
  ON currencies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage currencies"
  ON currencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- EXCHANGE RATES
-- =====================================================

CREATE TABLE IF NOT EXISTS exchange_rates (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL REFERENCES currencies(code),
  to_currency text NOT NULL REFERENCES currencies(code),
  rate DECIMAL(20,10) NOT NULL CHECK (rate > 0),
  valid_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) REFERENCES admin_users(user_id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_currencies CHECK (from_currency != to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_valid_from ON exchange_rates(valid_from DESC);

CREATE POLICY "Anyone can view exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage exchange rates"
  ON exchange_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PRICING PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_plans (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  color text DEFAULT '#3B82F6',
  version INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans"
  ON pricing_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PLAN TRIAL CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_trial_config (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id CHAR(36) NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  is_enabled TINYINT(1) DEFAULT 0,
  duration_value INT,
  duration_unit text CHECK (duration_unit IN ('days', 'months', 'permanent')),
  is_permanent TINYINT(1) DEFAULT 0,
  UNIQUE(plan_id)
);

CREATE POLICY "Anyone can view trial configs for active plans"
  ON plan_trial_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pricing_plans
      WHERE pricing_plans.id = plan_trial_config.plan_id
      AND pricing_plans.is_active = true
    )
  );

CREATE POLICY "Admins can manage trial configs"
  ON plan_trial_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PLAN TRIAL LIMITS
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_trial_limits (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_config_id CHAR(36) NOT NULL REFERENCES plan_trial_config(id) ON DELETE CASCADE,
  limit_period_value INT NOT NULL,
  limit_period_unit text NOT NULL CHECK (limit_period_unit IN ('days', 'months')),
  pseudonym_limit INT,
  entry_limit INT,
  ai_integration_limit INT,
  UNIQUE(trial_config_id)
);

CREATE POLICY "Anyone can view trial limits for active plans"
  ON plan_trial_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_trial_config ptc
      JOIN pricing_plans pp ON pp.id = ptc.plan_id
      WHERE ptc.id = plan_trial_limits.trial_config_id
      AND pp.is_active = true
    )
  );

CREATE POLICY "Admins can manage trial limits"
  ON plan_trial_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PLAN SUBSCRIPTION CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_subscription_config (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id CHAR(36) NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  billing_type text NOT NULL CHECK (billing_type IN ('postpaid', 'prepaid')),
  contract_duration_value INT NOT NULL,
  contract_duration_unit text NOT NULL CHECK (contract_duration_unit IN ('days', 'months')),
  cancellation_period_value INT NOT NULL,
  cancellation_period_unit text NOT NULL CHECK (cancellation_period_unit IN ('days', 'months')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('hourly', 'daily', 'monthly', 'yearly')),
  base_fee_once DECIMAL(10,2) DEFAULT 0,
  base_fee_recurring DECIMAL(10,2) DEFAULT 0,
  UNIQUE(plan_id)
);

CREATE POLICY "Anyone can view subscription configs for active plans"
  ON plan_subscription_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pricing_plans
      WHERE pricing_plans.id = plan_subscription_config.plan_id
      AND pricing_plans.is_active = true
    )
  );

CREATE POLICY "Admins can manage subscription configs"
  ON plan_subscription_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PLAN SUBSCRIPTION LIMITS
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_subscription_limits (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_config_id CHAR(36) NOT NULL REFERENCES plan_subscription_config(id) ON DELETE CASCADE,
  limit_period_value INT NOT NULL,
  limit_period_unit text NOT NULL CHECK (limit_period_unit IN ('days', 'months')),
  pseudonym_limit INT,
  entry_limit INT,
  ai_integration_limit INT,
  UNIQUE(subscription_config_id)
);

CREATE POLICY "Anyone can view subscription limits for active plans"
  ON plan_subscription_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_subscription_config psc
      JOIN pricing_plans pp ON pp.id = psc.plan_id
      WHERE psc.id = plan_subscription_limits.subscription_config_id
      AND pp.is_active = true
    )
  );

CREATE POLICY "Admins can manage subscription limits"
  ON plan_subscription_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- BILLING ITEM TYPES
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_item_types (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'Circle',
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "Anyone can view active billing item types"
  ON billing_item_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage billing item types"
  ON billing_item_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- PLAN BILLING ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_billing_items (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id CHAR(36) NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  item_type_id CHAR(36) NOT NULL REFERENCES billing_item_types(id),
  price_per_unit DECIMAL(10,4) NOT NULL,
  currency_code text NOT NULL REFERENCES currencies(code),
  is_active TINYINT(1) DEFAULT 1,
  UNIQUE(plan_id, item_type_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_billing_items_plan ON plan_billing_items(plan_id);

CREATE POLICY "Anyone can view billing items for active plans"
  ON plan_billing_items FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM pricing_plans
      WHERE pricing_plans.id = plan_billing_items.plan_id
      AND pricing_plans.is_active = true
    )
  );

CREATE POLICY "Admins can manage plan billing items"
  ON plan_billing_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- USER SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id CHAR(36) NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id CHAR(36) NOT NULL REFERENCES pricing_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'suspended')),
  trial_start_date DATETIME,
  trial_end_date DATETIME,
  subscription_start_date DATETIME,
  subscription_end_date DATETIME,
  cancellation_date DATETIME,
  auto_renew TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete subscriptions"
  ON user_subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- USAGE RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_records (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id CHAR(36) NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id CHAR(36) REFERENCES user_subscriptions(id),
  item_type_id CHAR(36) NOT NULL REFERENCES billing_item_types(id),
  quantity INT NOT NULL DEFAULT 1,
  reference_id uuid,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  billing_period_start DATETIME NOT NULL,
  billing_period_end DATETIME NOT NULL,
  is_billed TINYINT(1) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_usage_records_is_billed ON usage_records(is_billed);

CREATE POLICY "Users can view their own usage records"
  ON usage_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage records"
  ON usage_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can insert usage records"
  ON usage_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage usage records"
  ON usage_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id CHAR(36) NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id CHAR(36) REFERENCES user_subscriptions(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')),
  issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  paid_date DATETIME,
  billing_period_start DATETIME NOT NULL,
  billing_period_end DATETIME NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL REFERENCES currencies(code),
  notes text,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);

CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- INVOICE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id CHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type_id CHAR(36) REFERENCES billing_item_types(id),
  description text NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,4) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE POLICY "Users can view their own invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- HELP TEXTS
-- =====================================================

CREATE TABLE IF NOT EXISTS help_texts (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  context text,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "Anyone can view active help texts"
  ON help_texts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage help texts"
  ON help_texts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate invoice number

-- Create triggers for updated_at