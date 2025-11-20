import { useState, useEffect } from 'react';
import { X, Check, Info } from 'lucide-react';
import { getActivePricingPlans, type PricingPlan } from '../lib/billing';

interface PlanSelectionModalProps {
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
  accountType: 'prepaid' | 'postpaid';
}

export function PlanSelectionModal({ onClose, onSelectPlan, accountType }: PlanSelectionModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await getActivePricingPlans();
    if (data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    if (selectedPlanId) {
      onSelectPlan(selectedPlanId);
    } else {
      alert('Bitte wählen Sie einen Tarif aus');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tarif auswählen</h2>
            <p className="text-sm text-gray-600 mt-1">
              Kontotyp: <span className="font-medium">{accountType === 'prepaid' ? 'Prepaid' : 'Postpaid'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-600">Lädt Tarife...</div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-2">Keine Tarife verfügbar</p>
            <p className="text-sm text-gray-500">Bitte kontaktieren Sie den Administrator</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  const subscriptionConfig = Array.isArray(plan.subscription_config)
                    ? plan.subscription_config[0]
                    : plan.subscription_config;
                  const trialConfig = Array.isArray(plan.trial_config)
                    ? plan.trial_config[0]
                    : plan.trial_config;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      style={{ borderTopColor: isSelected ? plan.color : undefined }}
                    >
                      {isSelected && (
                        <div
                          className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
                          style={{ backgroundColor: plan.color }}
                        >
                          <Check size={18} />
                        </div>
                      )}

                      <div className="mb-4">
                        <div
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-3"
                          style={{ backgroundColor: plan.color }}
                        >
                          v{plan.version}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                        )}
                      </div>

                      {trialConfig && trialConfig.is_enabled && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                            <Info size={16} />
                            Testphase verfügbar
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            {trialConfig.is_permanent
                              ? 'Dauerhaft kostenlos'
                              : `${trialConfig.duration_value} ${trialConfig.duration_unit === 'days' ? 'Tage' : 'Monate'} kostenlos`
                            }
                          </p>
                        </div>
                      )}

                      {subscriptionConfig && subscriptionConfig.is_enabled && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Abrechnungstyp:</span>
                            <span className="font-medium text-gray-900">
                              {subscriptionConfig.billing_type === 'usage_based' && 'Nutzungsbasiert'}
                              {subscriptionConfig.billing_type === 'flat_rate' && 'Pauschale'}
                              {subscriptionConfig.billing_type === 'mixed' && 'Gemischt'}
                            </span>
                          </div>

                          {subscriptionConfig.base_fee && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Grundgebühr:</span>
                              <span className="font-bold text-gray-900">
                                {subscriptionConfig.base_fee.toFixed(2)} €
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Vertragslaufzeit:</span>
                            <span className="font-medium text-gray-900">
                              {subscriptionConfig.contract_period_value}{' '}
                              {subscriptionConfig.contract_period_unit === 'days' && 'Tage'}
                              {subscriptionConfig.contract_period_unit === 'months' && 'Monate'}
                              {subscriptionConfig.contract_period_unit === 'years' && 'Jahre'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Kündigungsfrist:</span>
                            <span className="font-medium text-gray-900">
                              {subscriptionConfig.notice_period_value}{' '}
                              {subscriptionConfig.notice_period_unit === 'days' ? 'Tage' : 'Monate'}
                            </span>
                          </div>
                        </div>
                      )}

                      {plan.billing_items && plan.billing_items.length > 0 && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase">
                            Abrechnungspositionen
                          </h4>
                          <div className="space-y-1">
                            {plan.billing_items.slice(0, 3).map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{item.item_type?.name}</span>
                                <span className="font-medium text-gray-900">
                                  {item.price_per_unit?.toFixed(2)} {item.currency_code}
                                </span>
                              </div>
                            ))}
                            {plan.billing_items.length > 3 && (
                              <div className="text-xs text-gray-500 italic">
                                +{plan.billing_items.length - 3} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedPlanId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Tarif buchen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
