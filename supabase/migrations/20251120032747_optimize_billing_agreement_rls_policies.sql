/*
  # Optimize Billing and Agreement RLS Policies

  ## Overview
  Optimize remaining RLS policies for billing and agreement tables

  ## Changes
  - Billing tables (pricing_plans, currencies, exchange_rates, etc.)
  - Agreement tables (t_vereinbarungen, t_vereinbarungstitel, etc.)
  - Transaction tables (account_transactions, user_subscriptions)
  - AI terms and audit logs
*/

-- BILLING_ITEM_TYPES
DROP POLICY IF EXISTS "Admins can manage billing item types" ON billing_item_types;
CREATE POLICY "Admins can manage billing item types" ON billing_item_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- CURRENCIES
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;
CREATE POLICY "Admins can manage currencies" ON currencies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- EXCHANGE_RATES
DROP POLICY IF EXISTS "Admins can manage exchange rates" ON exchange_rates;
CREATE POLICY "Admins can manage exchange rates" ON exchange_rates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PRICING_PLANS
DROP POLICY IF EXISTS "Admins can manage pricing plans" ON pricing_plans;
CREATE POLICY "Admins can manage pricing plans" ON pricing_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PLAN_TRIAL_CONFIG
DROP POLICY IF EXISTS "Admins can manage trial config" ON plan_trial_config;
CREATE POLICY "Admins can manage trial config" ON plan_trial_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PLAN_TRIAL_LIMITS
DROP POLICY IF EXISTS "Admins can manage trial limits" ON plan_trial_limits;
CREATE POLICY "Admins can manage trial limits" ON plan_trial_limits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PLAN_SUBSCRIPTION_CONFIG
DROP POLICY IF EXISTS "Admins can manage subscription config" ON plan_subscription_config;
CREATE POLICY "Admins can manage subscription config" ON plan_subscription_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PLAN_SUBSCRIPTION_LIMITS
DROP POLICY IF EXISTS "Admins can manage subscription limits" ON plan_subscription_limits;
CREATE POLICY "Admins can manage subscription limits" ON plan_subscription_limits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PLAN_BILLING_ITEMS
DROP POLICY IF EXISTS "Admins can manage plan billing items" ON plan_billing_items;
CREATE POLICY "Admins can manage plan billing items" ON plan_billing_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PREPAID_RECHARGE_AMOUNTS
DROP POLICY IF EXISTS "Admins can manage recharge amounts" ON prepaid_recharge_amounts;
CREATE POLICY "Admins can manage recharge amounts" ON prepaid_recharge_amounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- ACCOUNT_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view own transactions" ON account_transactions;
CREATE POLICY "Users can view own transactions" ON account_transactions FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all transactions" ON account_transactions;
CREATE POLICY "Admins can view all transactions" ON account_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- USER_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- USER_PROFILES (Admin policy)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- USER_ACCOUNT_CONFIG (Admin policy)
DROP POLICY IF EXISTS "Admins can view all account configs" ON user_account_config;
CREATE POLICY "Admins can view all account configs" ON user_account_config FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- AI_TERMS_ACCEPTANCE
DROP POLICY IF EXISTS "Users can view own AI terms acceptance" ON ai_terms_acceptance;
CREATE POLICY "Users can view own AI terms acceptance" ON ai_terms_acceptance FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own AI terms acceptance" ON ai_terms_acceptance;
CREATE POLICY "Users can insert own AI terms acceptance" ON ai_terms_acceptance FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin can view all AI terms acceptance" ON ai_terms_acceptance;
CREATE POLICY "Admin can view all AI terms acceptance" ON ai_terms_acceptance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PAYMENT_PROVIDERS
DROP POLICY IF EXISTS "Admins can view all payment providers" ON payment_providers;
CREATE POLICY "Admins can view all payment providers" ON payment_providers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert payment providers" ON payment_providers;
CREATE POLICY "Admins can insert payment providers" ON payment_providers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update payment providers" ON payment_providers;
CREATE POLICY "Admins can update payment providers" ON payment_providers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete payment providers" ON payment_providers;
CREATE POLICY "Admins can delete payment providers" ON payment_providers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- PAYMENT_PROVIDER_WEBHOOKS
DROP POLICY IF EXISTS "Admins can view all webhooks" ON payment_provider_webhooks;
CREATE POLICY "Admins can view all webhooks" ON payment_provider_webhooks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert webhooks" ON payment_provider_webhooks;
CREATE POLICY "Admins can insert webhooks" ON payment_provider_webhooks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update webhooks" ON payment_provider_webhooks;
CREATE POLICY "Admins can update webhooks" ON payment_provider_webhooks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete webhooks" ON payment_provider_webhooks;
CREATE POLICY "Admins can delete webhooks" ON payment_provider_webhooks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- T_VEREINBARUNGSTITEL
DROP POLICY IF EXISTS "Admins can view all agreement titles" ON t_vereinbarungstitel;
CREATE POLICY "Admins can view all agreement titles" ON t_vereinbarungstitel FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert agreement titles" ON t_vereinbarungstitel;
CREATE POLICY "Admins can insert agreement titles" ON t_vereinbarungstitel FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update agreement titles" ON t_vereinbarungstitel;
CREATE POLICY "Admins can update agreement titles" ON t_vereinbarungstitel FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete agreement titles" ON t_vereinbarungstitel;
CREATE POLICY "Admins can delete agreement titles" ON t_vereinbarungstitel FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- T_VEREINBARUNGEN
DROP POLICY IF EXISTS "Admins can view all agreements" ON t_vereinbarungen;
CREATE POLICY "Admins can view all agreements" ON t_vereinbarungen FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can view their own agreements" ON t_vereinbarungen;
CREATE POLICY "Users can view their own agreements" ON t_vereinbarungen FOR SELECT TO authenticated
  USING (ersteller_user_id = (select auth.uid()) OR empfaenger_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can insert agreements" ON t_vereinbarungen;
CREATE POLICY "Admins can insert agreements" ON t_vereinbarungen FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update agreements" ON t_vereinbarungen;
CREATE POLICY "Admins can update agreements" ON t_vereinbarungen FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete agreements" ON t_vereinbarungen;
CREATE POLICY "Admins can delete agreements" ON t_vereinbarungen FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- T_VEREINBARUNGS_LOGS
DROP POLICY IF EXISTS "Admins can view all agreement logs" ON t_vereinbarungs_logs;
CREATE POLICY "Admins can view all agreement logs" ON t_vereinbarungs_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can view logs for their agreements" ON t_vereinbarungs_logs;
CREATE POLICY "Users can view logs for their agreements" ON t_vereinbarungs_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM t_vereinbarungen 
    WHERE t_vereinbarungen.id = t_vereinbarungs_logs.vereinbarung_id 
    AND (t_vereinbarungen.ersteller_user_id = (select auth.uid()) OR t_vereinbarungen.empfaenger_user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Admins can insert agreement logs" ON t_vereinbarungs_logs;
CREATE POLICY "Admins can insert agreement logs" ON t_vereinbarungs_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- T_PLATZHALTER_DEFINITIONEN
DROP POLICY IF EXISTS "Admins can manage placeholder definitions" ON t_platzhalter_definitionen;
CREATE POLICY "Admins can manage placeholder definitions" ON t_platzhalter_definitionen FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

