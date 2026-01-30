/*
  # Seed Billing System Data

  ## Overview
  This migration seeds the billing system with initial data:
  - Default currencies (EUR, USD, YRA)
  - Default billing item types
  - Default help texts

  ## Data Seeding
  1. Currencies - EUR, USD, YRA with EUR as base
  2. Billing Item Types - Pseudonym, AI Call, Mood Entry, Analysis, Export, Import
  3. Help Texts - Contextual help for billing features
*/

-- =====================================================
-- SEED CURRENCIES
-- =====================================================

INSERT INTO currencies (code, name, symbol, is_base, is_active) VALUES
('EUR', 'Euro', '€', true, true),
('USD', 'US Dollar', '$', false, true),
('YRA', 'YRA Token', 'YRA', false, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED BILLING ITEM TYPES
-- =====================================================

INSERT INTO billing_item_types (code, name, description, icon, is_active, sort_order) VALUES
('pseudonym', 'Pseudonym', 'Cost per pseudonym created', 'User', true, 1),
('mood_entry', 'Mood Entry', 'Cost per mood entry recorded', 'Heart', true, 2),
('ai_integration', 'AI Integration', 'Cost per AI analysis or forecast', 'Brain', true, 3),
('analysis', 'Analysis', 'Cost per data analysis performed', 'BarChart3', true, 4),
('export', 'Export', 'Cost per data export (PDF, CSV, Image)', 'Download', true, 5),
('import', 'Import', 'Cost per data import', 'Upload', true, 6),
('storage', 'Storage', 'Monthly storage cost', 'Database', true, 7),
('api_call', 'API Call', 'Cost per API request', 'Zap', true, 8)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED HELP TEXTS
-- =====================================================

INSERT INTO help_texts (code, title, content, context, is_active) VALUES
(
  'billing_plan_overview',
  'What are Pricing Plans?',
  'Pricing plans define the cost structure and limits for using the application. Each plan can include a trial period, base fees, and usage-based charges for different features.',
  'billing',
  true
),
(
  'trial_period',
  'Trial Period',
  'The trial period allows users to test the service for a limited time before being charged. You can set the duration in days or months, or make it permanent (free plan). During the trial, you can define usage limits.',
  'billing',
  true
),
(
  'billing_type',
  'Billing Type: Postpaid vs Prepaid',
  'Postpaid: Users are billed after they use the service (pay at end of period). Prepaid: Users pay upfront before using the service. Choose based on your business model and cash flow preferences.',
  'billing',
  true
),
(
  'contract_duration',
  'Contract Duration',
  'Defines how long a user commits to the service. After this period, the contract can be renewed automatically if auto-renew is enabled.',
  'billing',
  true
),
(
  'cancellation_period',
  'Cancellation Period',
  'The minimum notice period required before the contract end date to cancel the subscription. For example, "30 days before" means users must cancel at least 30 days before contract expiration.',
  'billing',
  true
),
(
  'billing_cycle',
  'Billing Cycle',
  'How often users are billed: Hourly (experimental), Daily, Monthly (most common), or Yearly. This determines when invoices are generated and payments collected.',
  'billing',
  true
),
(
  'base_fee',
  'Base Fees',
  'Base Fee Once: One-time setup or activation fee charged at subscription start. Base Fee Recurring: Fixed fee charged every billing cycle, regardless of usage.',
  'billing',
  true
),
(
  'usage_limits',
  'Usage Limits',
  'Set maximum allowed usage per period. Leave empty for unlimited. Common limits include number of pseudonyms, mood entries, and AI integrations. Limits help control costs and prevent abuse.',
  'billing',
  true
),
(
  'currency_exchange',
  'Currency Exchange Rates',
  'Exchange rates convert prices between currencies. Rates are timestamped so historical invoices maintain accurate conversion. Always set the rate from your base currency to other currencies.',
  'billing',
  true
),
(
  'billing_items',
  'Billing Items (Usage-Based Pricing)',
  'Define per-unit costs for different actions. For example, charge €0.10 per mood entry or €0.50 per AI analysis. These costs are added to the base fee based on actual usage.',
  'billing',
  true
),
(
  'invoice_generation',
  'Invoice Generation',
  'Invoices are generated automatically at the end of each billing cycle. They include the base fee (if any) plus all usage-based charges. Users can view and download invoices from their account.',
  'billing',
  true
),
(
  'plan_comparison',
  'Plan Comparison',
  'The plan comparison table shows all available plans side-by-side, making it easy for users to understand differences and choose the right plan. Plans are sorted by the order you define.',
  'billing',
  true
)
ON CONFLICT (code) DO NOTHING;
