import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  HelpCircle,
  ArrowUpDown,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  getAllPricingPlans,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  getAllCurrencies,
  getAllBillingItemTypes,
  getPlanTrialConfig,
  upsertPlanTrialConfig,
  getPlanTrialLimits,
  upsertPlanTrialLimits,
  getPlanSubscriptionConfig,
  upsertPlanSubscriptionConfig,
  getPlanSubscriptionLimits,
  upsertPlanSubscriptionLimits,
  getPlanBillingItems,
  upsertPlanBillingItem,
  deletePlanBillingItem,
  type PricingPlan,
  type Currency,
  type BillingItemType,
  type PlanTrialConfig,
  type PlanTrialLimits,
  type PlanSubscriptionConfig,
  type PlanSubscriptionLimits,
  type PlanBillingItem,
} from '../../lib/billing';

import { HelpTooltip } from '../HelpTooltip';
import { CurrencyManagement } from './CurrencyManagement';
import { HelpTextManagement } from './HelpTextManagement';

export function BillingManagement() {
  const [activeTab, setActiveTab] = useState<'plans' | 'currencies' | 'help'>('plans');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign size={28} />
          Rechnungs- & Tarifverwaltung
        </h2>
        <p className="text-gray-600 mt-1">
          Tarife, Währungen und Abrechnungskonfiguration verwalten
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tarife
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'currencies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Währungen & Wechselkurse
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'help'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hilfetexte
          </button>
        </nav>
      </div>

      {activeTab === 'plans' && <PricingPlansManagement />}
      {activeTab === 'currencies' && <CurrencyManagement />}
      {activeTab === 'help' && <HelpTextManagement />}
    </div>
  );
}

function PricingPlansManagement() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [billingItemTypes, setBillingItemTypes] = useState<BillingItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [plansRes, currenciesRes, itemTypesRes] = await Promise.all([
      getAllPricingPlans(),
      getAllCurrencies(),
      getAllBillingItemTypes(),
    ]);

    if (plansRes.data) setPlans(plansRes.data);
    if (currenciesRes.data) setCurrencies(currenciesRes.data);
    if (itemTypesRes.data) setBillingItemTypes(itemTypesRes.data);
    setLoading(false);
  };

  const handleCreatePlan = async () => {
    const newPlan = {
      name: 'Neuer Tarif',
      description: '',
      is_active: false,
      sort_order: plans.length,
      color: '#3B82F6',
      version: 1,
    };

    const { data, error } = await createPricingPlan(newPlan);
    if (error) {
      alert('Fehler beim Erstellen des Tarifs: ' + error.message);
      return;
    }
    if (data) {
      setPlans([...plans, data]);
      setEditingPlan(data);
      setShowCreateModal(false);
    }
  };

  const handleUpdatePlan = async (id: string, updates: Partial<PricingPlan>) => {
    const { data, error } = await updatePricingPlan(id, updates);
    if (data) {
      setPlans(plans.map(p => p.id === id ? data : p));
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Möchten Sie diesen Tarif wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    const { error } = await deletePricingPlan(id);
    if (error) {
      alert('Fehler beim Löschen: ' + error.message);
      return;
    }
    setPlans(plans.filter(p => p.id !== id));
    if (editingPlan?.id === id) {
      setEditingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tarife</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Neuer Tarif
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                editingPlan?.id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setEditingPlan(plan)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: plan.color }}
                    />
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        plan.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <span className="text-xs text-gray-500">
                      v{plan.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {editingPlan ? (
            <PlanEditor
              plan={editingPlan}
              currencies={currencies}
              billingItemTypes={billingItemTypes}
              onUpdate={handleUpdatePlan}
              onDelete={handleDeletePlan}
              onClose={() => setEditingPlan(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Wähle einen Tarif zum Bearbeiten</p>
                <p className="text-sm text-gray-500">oder erstelle einen neuen</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Neuen Tarif erstellen</h3>
            <p className="text-gray-600 mb-6">
              Ein neuer Tarif wird mit Standard-Einstellungen erstellt. Du kannst ihn danach anpassen.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tarif erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlanEditorProps {
  plan: PricingPlan;
  currencies: Currency[];
  billingItemTypes: BillingItemType[];
  onUpdate: (id: string, updates: Partial<PricingPlan>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

function PlanEditor({ plan, currencies, billingItemTypes, onUpdate, onDelete, onClose }: PlanEditorProps) {
  const [activeSection, setActiveSection] = useState<'basic' | 'trial' | 'subscription' | 'items'>('basic');
  const [basicInfo, setBasicInfo] = useState({
    name: plan.name,
    description: plan.description || '',
    color: plan.color,
    is_active: plan.is_active,
    sort_order: plan.sort_order,
  });

  const handleSaveBasicInfo = async () => {
    await onUpdate(plan.id, basicInfo);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tarif bearbeiten: {plan.name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(plan.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Tarif löschen"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {[
            { id: 'basic', label: 'Basis' },
            { id: 'trial', label: 'Testphase' },
            { id: 'subscription', label: 'Abonnement' },
            { id: 'items', label: 'Positionen' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeSection === 'basic' && (
          <BasicInfoSection
            info={basicInfo}
            onChange={setBasicInfo}
            onSave={handleSaveBasicInfo}
          />
        )}
        {activeSection === 'trial' && (
          <TrialConfigSection planId={plan.id} />
        )}
        {activeSection === 'subscription' && (
          <SubscriptionConfigSection planId={plan.id} />
        )}
        {activeSection === 'items' && (
          <BillingItemsSection
            planId={plan.id}
            currencies={currencies}
            billingItemTypes={billingItemTypes}
          />
        )}
      </div>
    </div>
  );
}

interface BasicInfoSectionProps {
  info: {
    name: string;
    description: string;
    color: string;
    is_active: boolean;
    sort_order: number;
  };
  onChange: (info: any) => void;
  onSave: () => void;
}

function BasicInfoSection({ info, onChange, onSave }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tarifname
        </label>
        <input
          type="text"
          value={info.name}
          onChange={e => onChange({ ...info, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beschreibung
        </label>
        <textarea
          value={info.description}
          onChange={e => onChange({ ...info, description: e.target.value })}
          rows={3}
          placeholder="Optionale Beschreibung des Tarifs"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farbe
          </label>
          <input
            type="color"
            value={info.color}
            onChange={e => onChange({ ...info, color: e.target.value })}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sortierung
          </label>
          <input
            type="number"
            value={info.sort_order}
            onChange={e => onChange({ ...info, sort_order: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-active"
          checked={info.is_active}
          onChange={e => onChange({ ...info, is_active: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="is-active" className="text-sm font-medium text-gray-700">
          Aktiv (verfügbar für neue Abonnements)
        </label>
      </div>

      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Save size={18} />
        Änderungen speichern
      </button>
    </div>
  );
}

function TrialConfigSection({ planId }: { planId: string }) {
  const [config, setConfig] = useState<PlanTrialConfig | null>(null);
  const [limits, setLimits] = useState<PlanTrialLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [planId]);

  const loadConfig = async () => {
    setLoading(true);
    const configRes = await getPlanTrialConfig(planId);
    if (configRes.data) {
      setConfig(configRes.data);
      const limitsRes = await getPlanTrialLimits(configRes.data.id);
      if (limitsRes.data) setLimits(limitsRes.data);
    } else {
      setConfig({
        id: '',
        plan_id: planId,
        is_enabled: false,
        duration_value: 30,
        duration_unit: 'days',
        is_permanent: false,
      } as PlanTrialConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    const { data: savedConfig } = await upsertPlanTrialConfig({
      plan_id: planId,
      is_enabled: config.is_enabled,
      duration_value: config.duration_value,
      duration_unit: config.duration_unit,
      is_permanent: config.is_permanent,
    });

    if (savedConfig && limits) {
      await upsertPlanTrialLimits({
        trial_config_id: savedConfig.id,
        limit_period_value: limits.limit_period_value,
        limit_period_unit: limits.limit_period_unit,
        pseudonym_limit: limits.pseudonym_limit,
        entry_limit: limits.entry_limit,
        ai_integration_limit: limits.ai_integration_limit,
      });
    }

    alert('Testphasen-Konfiguration erfolgreich gespeichert!');
  };

  if (loading || !config) {
    return <div className="text-gray-600">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="trial-enabled"
          checked={config.is_enabled}
          onChange={e => setConfig({ ...config, is_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
        />
        <div className="flex-1">
          <label htmlFor="trial-enabled" className="font-medium text-gray-900 cursor-pointer flex items-center gap-2">
            Testphase aktivieren
            <HelpTooltip code="trial_period" />
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Benutzer können den Service vor der Abrechnung testen
          </p>
        </div>
      </div>

      {config.is_enabled && (
        <>
          <div className="space-y-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Testphasen-Dauer
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.duration_value || ''}
                  onChange={e => setConfig({ ...config, duration_value: parseInt(e.target.value) || null })}
                  disabled={config.is_permanent}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <select
                  value={config.duration_unit || 'days'}
                  onChange={e => setConfig({ ...config, duration_unit: e.target.value as any })}
                  disabled={config.is_permanent}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="days">Tage</option>
                  <option value="months">Monate</option>
                  <option value="permanent">Dauerhaft</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-permanent"
                checked={config.is_permanent}
                onChange={e => setConfig({ ...config, is_permanent: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is-permanent" className="text-sm font-medium text-gray-700">
                Dauerhaft (Kostenloser Tarif - keine Abrechnung nach Testphase)
              </label>
            </div>

            {!config.is_permanent && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  Testphasen-Limits
                  <HelpTooltip code="usage_limits" />
                </h4>

                {!limits && (
                  <button
                    onClick={() => setLimits({
                      id: '',
                      trial_config_id: config.id,
                      limit_period_value: 1,
                      limit_period_unit: 'months',
                      pseudonym_limit: null,
                      entry_limit: null,
                      ai_integration_limit: null,
                    } as PlanTrialLimits)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Limits hinzufügen
                  </button>
                )}

                {limits && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Limit-Zeitraum
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={limits.limit_period_value}
                          onChange={e => setLimits({ ...limits, limit_period_value: parseInt(e.target.value) })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={limits.limit_period_unit}
                          onChange={e => setLimits({ ...limits, limit_period_unit: e.target.value as any })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="days">Tage</option>
                          <option value="months">Monate</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pseudonyme
                        </label>
                        <input
                          type="number"
                          value={limits.pseudonym_limit || ''}
                          onChange={e => setLimits({ ...limits, pseudonym_limit: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Unbegrenzt"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Einträge
                        </label>
                        <input
                          type="number"
                          value={limits.entry_limit || ''}
                          onChange={e => setLimits({ ...limits, entry_limit: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Unbegrenzt"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          KI-Integrationen
                        </label>
                        <input
                          type="number"
                          value={limits.ai_integration_limit || ''}
                          onChange={e => setLimits({ ...limits, ai_integration_limit: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Unbegrenzt"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            Testphasen-Konfiguration speichern
          </button>
        </>
      )}
    </div>
  );
}

function SubscriptionConfigSection({ planId }: { planId: string }) {
  const [config, setConfig] = useState<PlanSubscriptionConfig | null>(null);
  const [limits, setLimits] = useState<PlanSubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [planId]);

  const loadConfig = async () => {
    setLoading(true);
    const configRes = await getPlanSubscriptionConfig(planId);
    if (configRes.data) {
      setConfig(configRes.data);
      const limitsRes = await getPlanSubscriptionLimits(configRes.data.id);
      if (limitsRes.data) setLimits(limitsRes.data);
    } else {
      setConfig({
        id: '',
        plan_id: planId,
        is_enabled: false,
        billing_type: 'usage_based',
        contract_period_value: 1,
        contract_period_unit: 'months',
        notice_period_value: 1,
        notice_period_unit: 'months',
        billing_cycle_value: 1,
        billing_cycle_unit: 'months',
        base_fee: null,
      } as PlanSubscriptionConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    // Validation
    if ((config.billing_type === 'flat_rate' || config.billing_type === 'mixed') && !config.base_fee) {
      alert('Bitte geben Sie eine Grundgebühr ein für diesen Abrechnungstyp');
      return;
    }

    if (config.contract_period_value <= 0 || config.notice_period_value < 0 || config.billing_cycle_value <= 0) {
      alert('Bitte geben Sie gültige Zeitwerte ein (größer als 0)');
      return;
    }

    const { data: savedConfig, error: configError } = await upsertPlanSubscriptionConfig({
      plan_id: planId,
      is_enabled: config.is_enabled,
      billing_type: config.billing_type,
      contract_period_value: config.contract_period_value,
      contract_period_unit: config.contract_period_unit,
      notice_period_value: config.notice_period_value,
      notice_period_unit: config.notice_period_unit,
      billing_cycle_value: config.billing_cycle_value,
      billing_cycle_unit: config.billing_cycle_unit,
      base_fee: config.base_fee,
    });

    if (configError) {
      alert('Fehler beim Speichern der Konfiguration: ' + configError.message);
      return;
    }

    if (savedConfig && limits) {
      const { error: limitsError } = await upsertPlanSubscriptionLimits({
        subscription_config_id: savedConfig.id,
        limit_period_value: limits.limit_period_value,
        limit_period_unit: limits.limit_period_unit,
        pseudonym_limit: limits.pseudonym_limit,
        entry_limit: limits.entry_limit,
        ai_integration_limit: limits.ai_integration_limit,
      });

      if (limitsError) {
        alert('Fehler beim Speichern der Limits: ' + limitsError.message);
        return;
      }
    }

    alert('Abonnement-Konfiguration erfolgreich gespeichert!');
    await loadConfig(); // Reload to get latest data
  };

  if (loading || !config) {
    return <div className="text-gray-600">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="subscription-enabled"
          checked={config.is_enabled}
          onChange={e => setConfig({ ...config, is_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
        />
        <div className="flex-1">
          <label htmlFor="subscription-enabled" className="font-medium text-gray-900 cursor-pointer flex items-center gap-2">
            Abonnement aktivieren
            <HelpTooltip code="subscription_config" />
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Benutzer können diesen Tarif als bezahltes Abonnement buchen
          </p>
        </div>
      </div>

      {config.is_enabled && (
        <>
          <div className="space-y-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abrechnungstyp
              </label>
              <select
                value={config.billing_type}
                onChange={e => setConfig({ ...config, billing_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="usage_based">Nutzungsbasiert (Pay-per-use)</option>
                <option value="flat_rate">Pauschale (Flat Rate)</option>
                <option value="mixed">Gemischt (Grundgebühr + Nutzung)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {config.billing_type === 'usage_based' && 'Benutzer zahlen nur für tatsächliche Nutzung'}
                {config.billing_type === 'flat_rate' && 'Feste monatliche Gebühr, unbegrenzte Nutzung'}
                {config.billing_type === 'mixed' && 'Grundgebühr plus zusätzliche Kosten bei Überschreitung'}
              </p>
            </div>

            {(config.billing_type === 'flat_rate' || config.billing_type === 'mixed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grundgebühr (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.base_fee || ''}
                  onChange={e => setConfig({ ...config, base_fee: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="9.99"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vertragslaufzeit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.contract_period_value}
                  onChange={e => setConfig({ ...config, contract_period_value: parseInt(e.target.value) })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={config.contract_period_unit}
                  onChange={e => setConfig({ ...config, contract_period_unit: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days">Tage</option>
                  <option value="months">Monate</option>
                  <option value="years">Jahre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kündigungsfrist
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.notice_period_value}
                  onChange={e => setConfig({ ...config, notice_period_value: parseInt(e.target.value) })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={config.notice_period_unit}
                  onChange={e => setConfig({ ...config, notice_period_unit: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days">Tage</option>
                  <option value="months">Monate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abrechnungszyklus
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.billing_cycle_value}
                  onChange={e => setConfig({ ...config, billing_cycle_value: parseInt(e.target.value) })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={config.billing_cycle_unit}
                  onChange={e => setConfig({ ...config, billing_cycle_unit: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days">Tage</option>
                  <option value="months">Monate</option>
                  <option value="years">Jahre</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wie oft wird abgerechnet und eine Rechnung erstellt
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                Nutzungslimits (Optional)
                <HelpTooltip code="subscription_limits" />
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Bei Überschreitung werden je nach Abrechnungstyp zusätzliche Kosten fällig oder die Nutzung blockiert
              </p>

              {!limits && (
                <button
                  onClick={() => setLimits({
                    id: '',
                    subscription_config_id: config.id,
                    limit_period_value: 1,
                    limit_period_unit: 'months',
                    pseudonym_limit: null,
                    entry_limit: null,
                    ai_integration_limit: null,
                  } as PlanSubscriptionLimits)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Limits hinzufügen
                </button>
              )}

              {limits && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limit-Zeitraum
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={limits.limit_period_value}
                        onChange={e => setLimits({ ...limits, limit_period_value: parseInt(e.target.value) })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={limits.limit_period_unit}
                        onChange={e => setLimits({ ...limits, limit_period_unit: e.target.value as any })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="days">Tage</option>
                        <option value="months">Monate</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pseudonyme
                      </label>
                      <input
                        type="number"
                        value={limits.pseudonym_limit || ''}
                        onChange={e => setLimits({ ...limits, pseudonym_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Unbegrenzt"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Einträge
                      </label>
                      <input
                        type="number"
                        value={limits.entry_limit || ''}
                        onChange={e => setLimits({ ...limits, entry_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Unbegrenzt"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KI-Integrationen
                      </label>
                      <input
                        type="number"
                        value={limits.ai_integration_limit || ''}
                        onChange={e => setLimits({ ...limits, ai_integration_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Unbegrenzt"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setLimits(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Limits entfernen
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            Abonnement-Konfiguration speichern
          </button>
        </>
      )}
    </div>
  );
}

function BillingItemsSection({ planId, currencies, billingItemTypes }: {
  planId: string;
  currencies: Currency[];
  billingItemTypes: BillingItemType[];
}) {
  const [items, setItems] = useState<PlanBillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PlanBillingItem | null>(null);

  useEffect(() => {
    loadItems();
  }, [planId]);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await getPlanBillingItems(planId);
    if (data) setItems(data);
    setLoading(false);
  };

  const handleSave = async (item: Partial<PlanBillingItem>) => {
    if (!item.price_per_unit || item.price_per_unit <= 0) {
      alert('Bitte geben Sie einen gültigen Preis ein (größer als 0)');
      return;
    }

    const { error } = await upsertPlanBillingItem({
      plan_id: planId,
      billing_item_type_id: item.billing_item_type_id!,
      currency_code: item.currency_code!,
      price_per_unit: item.price_per_unit!,
      is_active: item.is_active ?? true,
    });

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      alert('Abrechnungsposition erfolgreich gespeichert!');
      await loadItems();
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Abrechnungsposition wirklich löschen?')) return;

    const { error } = await deletePlanBillingItem(id);
    if (error) {
      alert('Fehler beim Löschen: ' + error.message);
    } else {
      alert('Abrechnungsposition erfolgreich gelöscht!');
      await loadItems();
      if (editingItem?.id === id) setEditingItem(null);
    }
  };

  const baseCurrency = currencies.find(c => c.is_base) || currencies[0];

  if (loading) {
    return <div className="text-gray-600">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          Abrechnungspositionen
          <HelpTooltip code="billing_items" />
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Legen Sie Preise pro Einheit für jeden Abrechnungstyp fest. Diese werden bei nutzungsbasierter Abrechnung verwendet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {billingItemTypes.map(itemType => {
          const existingItem = items.find(i => i.billing_item_type_id === itemType.id);
          const isEditing = editingItem?.billing_item_type_id === itemType.id;

          return (
            <div
              key={itemType.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {itemType.icon && <span className="text-blue-600 text-xl">{itemType.icon}</span>}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{itemType.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{itemType.description}</p>

                    {isEditing ? (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Preis pro Einheit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingItem.price_per_unit || ''}
                              onChange={e => setEditingItem({
                                ...editingItem,
                                price_per_unit: e.target.value ? parseFloat(e.target.value) : null as any
                              })}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Währung
                            </label>
                            <select
                              value={editingItem.currency_code || baseCurrency?.code}
                              onChange={e => setEditingItem({ ...editingItem, currency_code: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              {currencies.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                  {curr.code} ({curr.symbol})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`active-${itemType.id}`}
                            checked={editingItem.is_active ?? true}
                            onChange={e => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor={`active-${itemType.id}`} className="text-sm text-gray-700">
                            Aktiv (wird berechnet)
                          </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSave(editingItem)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Save size={14} />
                            Speichern
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                          >
                            Abbrechen
                          </button>
                          {existingItem && (
                            <button
                              onClick={() => handleDelete(existingItem.id)}
                              className="ml-auto px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </div>
                    ) : existingItem ? (
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {existingItem.price_per_unit?.toFixed(2)} {existingItem.currency_code}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">pro Einheit</span>
                          {!existingItem.is_active && (
                            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              Inaktiv
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingItem(existingItem)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingItem({
                          id: '',
                          plan_id: planId,
                          billing_item_type_id: itemType.id,
                          currency_code: baseCurrency?.code || 'EUR',
                          price_per_unit: null as any,
                          is_active: true,
                        } as PlanBillingItem)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Preis festlegen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-2">Noch keine Abrechnungspositionen konfiguriert</p>
          <p className="text-sm text-gray-500">
            Klicke auf "+ Preis festlegen" bei einem der obigen Abrechnungstypen
          </p>
        </div>
      )}
    </div>
  );
}
