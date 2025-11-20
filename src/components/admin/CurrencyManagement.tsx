import { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Save, X, TrendingUp } from 'lucide-react';
import {
  getAllCurrencies,
  createCurrency,
  updateCurrency,
  getAllExchangeRates,
  createExchangeRate,
  type Currency,
  type ExchangeRate,
} from '../../lib/billing';

export function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [showAddRate, setShowAddRate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [currenciesRes, ratesRes] = await Promise.all([
      getAllCurrencies(),
      getAllExchangeRates(),
    ]);

    if (currenciesRes.data) setCurrencies(currenciesRes.data);
    if (ratesRes.data) setExchangeRates(ratesRes.data);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-gray-600">Lädt Währungen...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Währungen</h3>
          <button
            onClick={() => setShowAddCurrency(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} />
            Währung hinzufügen
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Basis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currencies.map(currency => (
                <tr key={currency.code}>
                  <td className="px-4 py-3 font-mono font-medium">{currency.code}</td>
                  <td className="px-4 py-3">{currency.name}</td>
                  <td className="px-4 py-3">{currency.symbol}</td>
                  <td className="px-4 py-3">
                    {currency.is_base && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Basis</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      currency.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currency.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} />
            Wechselkurse
          </h3>
          <button
            onClick={() => setShowAddRate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus size={16} />
            Wechselkurs hinzufügen
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Von</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kurs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Gültig ab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exchangeRates.slice(0, 10).map(rate => (
                <tr key={rate.id}>
                  <td className="px-4 py-3 font-mono font-medium">{rate.from_currency}</td>
                  <td className="px-4 py-3 font-mono font-medium">{rate.to_currency}</td>
                  <td className="px-4 py-3 font-mono">{parseFloat(rate.rate.toString()).toFixed(4)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(rate.valid_from).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddCurrency && (
        <AddCurrencyModal
          onClose={() => setShowAddCurrency(false)}
          onSuccess={() => {
            setShowAddCurrency(false);
            loadData();
          }}
        />
      )}

      {showAddRate && (
        <AddExchangeRateModal
          currencies={currencies}
          onClose={() => setShowAddRate(false)}
          onSuccess={() => {
            setShowAddRate(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function AddCurrencyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    is_base: false,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await createCurrency(formData);
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Neue Währung hinzufügen</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Währungscode (ISO 4217)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              maxLength={3}
              pattern="[A-Z]{3}"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="EUR"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Währungsname
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Euro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={e => setFormData({ ...formData, symbol: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="€"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_base}
                onChange={e => setFormData({ ...formData, is_base: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm">Basiswährung</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm">Aktiv</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Währung hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddExchangeRateModal({
  currencies,
  onClose,
  onSuccess
}: {
  currencies: Currency[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    from_currency: '',
    to_currency: '',
    rate: '',
    valid_from: new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await createExchangeRate({
      from_currency: formData.from_currency,
      to_currency: formData.to_currency,
      rate: parseFloat(formData.rate),
      valid_from: formData.valid_from,
    });
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Wechselkurs hinzufügen</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von Währung
              </label>
              <select
                value={formData.from_currency}
                onChange={e => setFormData({ ...formData, from_currency: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auswählen...</option>
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zu Währung
              </label>
              <select
                value={formData.to_currency}
                onChange={e => setFormData({ ...formData, to_currency: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auswählen...</option>
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wechselkurs
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.rate}
              onChange={e => setFormData({ ...formData, rate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="1.0850"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gültig ab
            </label>
            <input
              type="datetime-local"
              value={formData.valid_from}
              onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kurs hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
