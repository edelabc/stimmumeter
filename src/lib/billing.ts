import { supabase } from './supabase';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_base: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  valid_from: string;
  created_by: string | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  color: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PlanTrialConfig {
  id: string;
  plan_id: string;
  is_enabled: boolean;
  duration_value: number | null;
  duration_unit: 'days' | 'months' | 'permanent' | null;
  is_permanent: boolean;
}

export interface PlanTrialLimits {
  id: string;
  trial_config_id: string;
  limit_period_value: number;
  limit_period_unit: 'days' | 'months';
  pseudonym_limit: number | null;
  entry_limit: number | null;
  ai_integration_limit: number | null;
}

export interface PlanSubscriptionConfig {
  id: string;
  plan_id: string;
  is_enabled: boolean;
  billing_type: 'usage_based' | 'flat_rate' | 'mixed';
  contract_period_value: number;
  contract_period_unit: 'days' | 'months' | 'years';
  notice_period_value: number;
  notice_period_unit: 'days' | 'months';
  billing_cycle_value: number;
  billing_cycle_unit: 'days' | 'months' | 'years';
  base_fee: number | null;
}

export interface PlanSubscriptionLimits {
  id: string;
  subscription_config_id: string;
  limit_period_value: number;
  limit_period_unit: 'days' | 'months';
  pseudonym_limit: number | null;
  entry_limit: number | null;
  ai_integration_limit: number | null;
}

export interface BillingItemType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlanBillingItem {
  id: string;
  plan_id: string;
  billing_item_type_id: string;
  price_per_unit: number;
  currency_code: string;
  is_active: boolean;
}

export interface UserAccountConfig {
  id: string;
  user_id: string;
  account_type: 'prepaid' | 'postpaid';
  current_plan_id: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  user_id: string;
  transaction_date: string;
  document_number: string | null;
  description: string;
  debit: number | null;
  credit: number | null;
  balance_after: number;
  transaction_type: 'payment' | 'charge' | 'refund' | 'adjustment' | 'prepaid_purchase';
  related_invoice_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
}

export interface PrepaidRechargeAmount {
  id: string;
  amount: number;
  currency_code: string;
  is_active: boolean;
  sort_order: number;
  bonus_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  start_date: string;
  end_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  cancellation_date: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  item_type_id: string;
  quantity: number;
  reference_id: string | null;
  recorded_at: string;
  billing_period_start: string;
  billing_period_end: string;
  is_billed: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  subscription_id: string | null;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

export interface HelpText {
  id: string;
  code: string;
  title: string;
  content: string;
  context: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllCurrencies() {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .order('code');
  return { data, error };
}

export async function createCurrency(currency: Omit<Currency, 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('currencies')
    .insert(currency)
    .select()
    .single();
  return { data, error };
}

export async function updateCurrency(code: string, updates: Partial<Currency>) {
  const { data, error } = await supabase
    .from('currencies')
    .update(updates)
    .eq('code', code)
    .select()
    .single();
  return { data, error };
}

export async function getAllExchangeRates() {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('valid_from', { ascending: false });
  return { data, error };
}

export async function createExchangeRate(rate: Omit<ExchangeRate, 'id' | 'created_at' | 'created_by'>) {
  const { data, error } = await supabase
    .from('exchange_rates')
    .insert(rate)
    .select()
    .single();
  return { data, error };
}

export async function getAllPricingPlans() {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .order('sort_order');
  return { data, error };
}

export async function getActivePricingPlans() {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return { data, error };
}

export async function createPricingPlan(plan: Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('pricing_plans')
    .insert(plan)
    .select()
    .single();
  return { data, error };
}

export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>) {
  const { data, error } = await supabase
    .from('pricing_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deletePricingPlan(id: string) {
  const { data, error } = await supabase
    .from('pricing_plans')
    .delete()
    .eq('id', id);
  return { data, error };
}

export async function getPlanTrialConfig(planId: string) {
  const { data, error } = await supabase
    .from('plan_trial_config')
    .select('*')
    .eq('plan_id', planId)
    .maybeSingle();
  return { data, error };
}

export async function upsertPlanTrialConfig(config: Omit<PlanTrialConfig, 'id'>) {
  const { data, error } = await supabase
    .from('plan_trial_config')
    .upsert(config, { onConflict: 'plan_id' })
    .select()
    .single();
  return { data, error };
}

export async function getPlanTrialLimits(trialConfigId: string) {
  const { data, error } = await supabase
    .from('plan_trial_limits')
    .select('*')
    .eq('trial_config_id', trialConfigId)
    .maybeSingle();
  return { data, error };
}

export async function upsertPlanTrialLimits(limits: Omit<PlanTrialLimits, 'id'>) {
  const { data, error } = await supabase
    .from('plan_trial_limits')
    .upsert(limits, { onConflict: 'trial_config_id' })
    .select()
    .single();
  return { data, error };
}

export async function getPlanSubscriptionConfig(planId: string) {
  const { data, error } = await supabase
    .from('plan_subscription_config')
    .select('*')
    .eq('plan_id', planId)
    .maybeSingle();
  return { data, error };
}

export async function upsertPlanSubscriptionConfig(config: Omit<PlanSubscriptionConfig, 'id'>) {
  const { data, error } = await supabase
    .from('plan_subscription_config')
    .upsert(config, { onConflict: 'plan_id' })
    .select()
    .single();
  return { data, error };
}

export async function getPlanSubscriptionLimits(subscriptionConfigId: string) {
  const { data, error } = await supabase
    .from('plan_subscription_limits')
    .select('*')
    .eq('subscription_config_id', subscriptionConfigId)
    .maybeSingle();
  return { data, error };
}

export async function upsertPlanSubscriptionLimits(limits: Omit<PlanSubscriptionLimits, 'id'>) {
  const { data, error } = await supabase
    .from('plan_subscription_limits')
    .upsert(limits, { onConflict: 'subscription_config_id' })
    .select()
    .single();
  return { data, error };
}

export async function getAllBillingItemTypes() {
  const { data, error } = await supabase
    .from('billing_item_types')
    .select('*')
    .order('sort_order');
  return { data, error };
}

export async function getPlanBillingItems(planId: string) {
  const { data, error } = await supabase
    .from('plan_billing_items')
    .select(`
      *,
      item_type:billing_item_types(*)
    `)
    .eq('plan_id', planId);
  return { data, error };
}

export async function upsertPlanBillingItem(item: Omit<PlanBillingItem, 'id'>) {
  const { data, error } = await supabase
    .from('plan_billing_items')
    .upsert(item, { onConflict: 'plan_id,billing_item_type_id' })
    .select()
    .single();
  return { data, error };
}

export async function deletePlanBillingItem(id: string) {
  const { data, error } = await supabase
    .from('plan_billing_items')
    .delete()
    .eq('id', id);
  return { data, error };
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:pricing_plans(*)
    `)
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .maybeSingle();
  return { data, error };
}

export async function getUserInvoices(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*)
    `)
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });
  return { data, error };
}

export async function getUserUsageRecords(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('usage_records')
    .select(`
      *,
      item_type:billing_item_types(*)
    `)
    .eq('user_id', userId)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate)
    .order('recorded_at', { ascending: false });
  return { data, error };
}

export async function getAllHelpTexts() {
  const { data, error } = await supabase
    .from('help_texts')
    .select('*')
    .order('code');
  return { data, error };
}

export async function getHelpText(code: string) {
  const { data, error } = await supabase
    .from('help_texts')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  return { data, error };
}

export async function createHelpText(helpText: Omit<HelpText, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('help_texts')
    .insert(helpText)
    .select()
    .single();
  return { data, error };
}

export async function updateHelpText(id: string, updates: Partial<HelpText>) {
  const { data, error } = await supabase
    .from('help_texts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteHelpText(id: string) {
  const { data, error } = await supabase
    .from('help_texts')
    .delete()
    .eq('id', id);
  return { data, error };
}

export async function recordUsage(
  userId: string,
  itemTypeCode: string,
  quantity: number = 1,
  referenceId: string | null = null
) {
  const { data: itemType } = await supabase
    .from('billing_item_types')
    .select('id')
    .eq('code', itemTypeCode)
    .single();

  if (!itemType) {
    return { data: null, error: new Error(`Billing item type ${itemTypeCode} not found`) };
  }

  const { data: subscription } = await getUserSubscription(userId);

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from('usage_records')
    .insert({
      user_id: userId,
      subscription_id: subscription?.id || null,
      item_type_id: itemType.id,
      quantity,
      reference_id: referenceId,
      billing_period_start: periodStart.toISOString(),
      billing_period_end: periodEnd.toISOString(),
      is_billed: false,
    })
    .select()
    .single();

  return { data, error };
}

// User Account Config Functions
export async function getUserAccountConfig(userId: string) {
  const { data, error } = await supabase
    .from('user_account_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return { data, error };
}

export async function upsertUserAccountConfig(config: Omit<UserAccountConfig, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_account_config')
    .upsert(config, { onConflict: 'user_id' })
    .select()
    .single();
  return { data, error };
}

// Account Transactions Functions
export async function getAccountTransactions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('account_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function createAccountTransaction(transaction: Omit<AccountTransaction, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('account_transactions')
    .insert(transaction)
    .select()
    .single();
  return { data, error };
}

// Prepaid Recharge Amounts Functions
export async function getPrepaidRechargeAmounts() {
  const { data, error } = await supabase
    .from('prepaid_recharge_amounts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return { data, error };
}

export async function getAllPrepaidRechargeAmounts() {
  const { data, error } = await supabase
    .from('prepaid_recharge_amounts')
    .select('*')
    .order('sort_order');
  return { data, error };
}

export async function upsertPrepaidRechargeAmount(amount: Omit<PrepaidRechargeAmount, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('prepaid_recharge_amounts')
    .upsert(amount, { onConflict: 'amount,currency_code' })
    .select()
    .single();
  return { data, error };
}

export async function deletePrepaidRechargeAmount(id: string) {
  const { data, error } = await supabase
    .from('prepaid_recharge_amounts')
    .delete()
    .eq('id', id);
  return { data, error };
}

