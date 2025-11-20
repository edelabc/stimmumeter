/*
  # Fix Missing Foreign Key Indexes

  ## Overview
  Add missing indexes on foreign key columns to improve query performance

  ## Changes
  Add indexes for:
  - exchange_rates (from_currency, to_currency)
  - mood_indicators (user_id)
  - plan_billing_items (billing_item_type_id, currency_code)
  - prepaid_recharge_amounts (currency_code)
  - pseudonyms (user_id)
  - t_vereinbarungstitel (erstellt_von_user_id)
  - user_account_config (current_plan_id)
  - user_subscriptions (plan_id, user_id)
*/

-- exchange_rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_currency 
  ON exchange_rates(from_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_to_currency 
  ON exchange_rates(to_currency);

-- mood_indicators user_id index
CREATE INDEX IF NOT EXISTS idx_mood_indicators_user_id 
  ON mood_indicators(user_id);

-- plan_billing_items indexes
CREATE INDEX IF NOT EXISTS idx_plan_billing_items_billing_item_type_id 
  ON plan_billing_items(billing_item_type_id);

CREATE INDEX IF NOT EXISTS idx_plan_billing_items_currency_code 
  ON plan_billing_items(currency_code);

-- prepaid_recharge_amounts index
CREATE INDEX IF NOT EXISTS idx_prepaid_recharge_amounts_currency_code 
  ON prepaid_recharge_amounts(currency_code);

-- pseudonyms user_id index
CREATE INDEX IF NOT EXISTS idx_pseudonyms_user_id 
  ON pseudonyms(user_id);

-- t_vereinbarungstitel index
CREATE INDEX IF NOT EXISTS idx_t_vereinbarungstitel_erstellt_von_user_id 
  ON t_vereinbarungstitel(erstellt_von_user_id);

-- user_account_config index
CREATE INDEX IF NOT EXISTS idx_user_account_config_current_plan_id 
  ON user_account_config(current_plan_id);

-- user_subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id 
  ON user_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

