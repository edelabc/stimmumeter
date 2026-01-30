import { apiClient } from './api-client';

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
  try {
    const response = await apiClient.get('/billing.php?action=currencies');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Währungen') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function createCurrency(currency: Omit<Currency, 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post('/billing.php?action=currencies', currency);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Erstellen der Währung') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updateCurrency(code: string, updates: Partial<Currency>) {
  try {
    const response = await apiClient.put(`/billing.php?action=currency&code=${encodeURIComponent(code)}`, updates);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Aktualisieren der Währung') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getAllExchangeRates() {
  try {
    const response = await apiClient.get('/billing.php?action=exchange-rates');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Wechselkurse') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function createExchangeRate(rate: Omit<ExchangeRate, 'id' | 'created_at' | 'created_by'>) {
  try {
    const response = await apiClient.post('/billing.php?action=exchange-rates', rate);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Erstellen des Wechselkurses') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getAllPricingPlans() {
  try {
    const response = await apiClient.get('/billing.php?action=pricing-plans');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Preispläne') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getActivePricingPlans() {
  try {
    const response = await apiClient.get('/billing.php?action=pricing-plans&active_only=1');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der aktiven Preispläne') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function createPricingPlan(plan: Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post('/billing.php?action=pricing-plans', plan);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Erstellen des Preisplans') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>) {
  try {
    const response = await apiClient.put(`/billing.php?action=pricing-plan&id=${encodeURIComponent(id)}`, updates);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Aktualisieren des Preisplans') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function deletePricingPlan(id: string) {
  try {
    const response = await apiClient.delete(`/billing.php?action=pricing-plan&id=${encodeURIComponent(id)}`);
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPlanTrialConfig(planId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=plan-trial-config&plan_id=${encodeURIComponent(planId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPlanTrialConfig(config: Omit<PlanTrialConfig, 'id'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=plan-trial-config&plan_id=${encodeURIComponent(config.plan_id)}`, config);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern der Trial-Konfiguration') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPlanTrialLimits(trialConfigId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=plan-trial-limits&trial_config_id=${encodeURIComponent(trialConfigId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPlanTrialLimits(limits: Omit<PlanTrialLimits, 'id'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=plan-trial-limits&trial_config_id=${encodeURIComponent(limits.trial_config_id)}`, limits);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern der Trial-Limits') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPlanSubscriptionConfig(planId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=plan-subscription-config&plan_id=${encodeURIComponent(planId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPlanSubscriptionConfig(config: Omit<PlanSubscriptionConfig, 'id'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=plan-subscription-config&plan_id=${encodeURIComponent(config.plan_id)}`, config);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern der Subscription-Konfiguration') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPlanSubscriptionLimits(subscriptionConfigId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=plan-subscription-limits&subscription_config_id=${encodeURIComponent(subscriptionConfigId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPlanSubscriptionLimits(limits: Omit<PlanSubscriptionLimits, 'id'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=plan-subscription-limits&subscription_config_id=${encodeURIComponent(limits.subscription_config_id)}`, limits);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern der Subscription-Limits') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getAllBillingItemTypes() {
  try {
    const response = await apiClient.get('/billing.php?action=billing-item-types');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Billing-Item-Typen') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getPlanBillingItems(planId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=plan-billing-items&plan_id=${encodeURIComponent(planId)}`);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Plan-Billing-Items') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPlanBillingItem(item: Omit<PlanBillingItem, 'id'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=plan-billing-items&plan_id=${encodeURIComponent(item.plan_id)}`, item);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern des Plan-Billing-Items') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function deletePlanBillingItem(id: string) {
  try {
    const response = await apiClient.delete(`/billing.php?action=plan-billing-item&id=${encodeURIComponent(id)}`);
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=user-subscription&user_id=${encodeURIComponent(userId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getUserInvoices(userId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=invoices&user_id=${encodeURIComponent(userId)}`);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Rechnungen') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getUserUsageRecords(userId: string, startDate: string, endDate: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=usage-records&user_id=${encodeURIComponent(userId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Nutzungsdaten') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getAllHelpTexts() {
  try {
    const response = await apiClient.get('/billing.php?action=help-texts');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Hilfe-Texte') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getHelpText(code: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=help-texts&code=${encodeURIComponent(code)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function createHelpText(helpText: Omit<HelpText, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post('/billing.php?action=help-texts', helpText);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Erstellen des Hilfe-Texts') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updateHelpText(id: string, updates: Partial<HelpText>) {
  try {
    const response = await apiClient.put(`/billing.php?action=help-text&id=${encodeURIComponent(id)}`, updates);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Aktualisieren des Hilfe-Texts') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function deleteHelpText(id: string) {
  try {
    const response = await apiClient.delete(`/billing.php?action=help-text&id=${encodeURIComponent(id)}`);
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function recordUsage(
  userId: string,
  itemTypeCode: string,
  quantity: number = 1,
  referenceId: string | null = null
) {
  try {
    const response = await apiClient.post('/billing.php?action=record-usage', {
      user_id: userId,
      item_type_code: itemTypeCode,
      quantity,
      reference_id: referenceId,
    });
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Aufzeichnen der Nutzung') };
  } catch (error: any) {
    return { data: null, error };
  }
}

// User Account Config Functions
export async function getUserAccountConfig(userId: string) {
  try {
    const response = await apiClient.get(`/billing.php?action=user-account-config&user_id=${encodeURIComponent(userId)}`);
    return { data: response.data || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertUserAccountConfig(config: Omit<UserAccountConfig, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post(`/billing.php?action=user-account-config&user_id=${encodeURIComponent(config.user_id)}`, config);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern der Account-Konfiguration') };
  } catch (error: any) {
    return { data: null, error };
  }
}

// Account Transactions Functions
export async function getAccountTransactions(userId: string, limit = 50) {
  try {
    const response = await apiClient.get(`/billing.php?action=account-transactions&user_id=${encodeURIComponent(userId)}&limit=${limit}`);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Transaktionen') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function createAccountTransaction(transaction: Omit<AccountTransaction, 'id' | 'created_at'>) {
  try {
    const response = await apiClient.post('/billing.php?action=account-transactions', transaction);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Erstellen der Transaktion') };
  } catch (error: any) {
    return { data: null, error };
  }
}

// Prepaid Recharge Amounts Functions
export async function getPrepaidRechargeAmounts() {
  try {
    const response = await apiClient.get('/billing.php?action=prepaid-recharge-amounts&active_only=1');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden der Prepaid-Aufladebeträge') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function getAllPrepaidRechargeAmounts() {
  try {
    const response = await apiClient.get('/billing.php?action=prepaid-recharge-amounts');
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Laden aller Prepaid-Aufladebeträge') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function upsertPrepaidRechargeAmount(amount: Omit<PrepaidRechargeAmount, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post('/billing.php?action=prepaid-recharge-amounts', amount);
    if (response.data) {
      return { data: response.data, error: null };
    }
    return { data: null, error: new Error(response.error || 'Fehler beim Speichern des Prepaid-Aufladebetrags') };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function deletePrepaidRechargeAmount(id: string) {
  try {
    const response = await apiClient.delete(`/billing.php?action=prepaid-recharge-amount&id=${encodeURIComponent(id)}`);
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

