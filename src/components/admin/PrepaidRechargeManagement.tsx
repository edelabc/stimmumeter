import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  getAllPrepaidRechargeAmounts,
  upsertPrepaidRechargeAmount,
  deletePrepaidRechargeAmount,
  getAllCurrencies,
  type PrepaidRechargeAmount,
  type Currency,
} from '../../lib/billing';

export function PrepaidRechargeManagement() {
  const [amounts, setAmounts] = useState<PrepaidRechargeAmount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PrepaidRechargeAmount>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [amountsRes, currenciesRes] = await Promise.all([
      getAllPrepaidRechargeAmounts(),
      getAllCurrencies(),
    ]);

    if (amountsRes.data) setAmounts(amountsRes.data);
    if (currenciesRes.data) setCurrencies(currenciesRes.data);
    setLoading(false);
  };

  const handleEdit = (amount: PrepaidRechargeAmount) => {
    setEditingId(amount.id);
    setEditForm(amount);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editForm.amount || !editForm.currency_code) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (editForm.amount <= 0) {
      alert('Betrag muss größer als 0 sein');
      return;
    }

    const { error } = await upsertPrepaidRechargeAmount({
      amount: editForm.amount,
      currency_code: editForm.currency_code,
      is_active: editForm.is_active ?? true,
      sort_order: editForm.sort_order ?? 0,
      bonus_percentage: editForm.bonus_percentage ?? 0,
    });

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      alert('Aufladebetrag erfolgreich gespeichert!');
      handleCancel();
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Aufladebetrag wirklich löschen?')) return;

    const { error } = await deletePrepaidRechargeAmount(id);
    if (error) {
      alert('Fehler beim Löschen: ' + error.message);
    } else {
      alert('Aufladebetrag erfolgreich gelöscht!');
      await loadData();
    }
  };

  const handleAdd = () => {
    const baseCurrency = currencies.find(c => c.is_base) || currencies[0];
    setEditingId('new');
    setEditForm({
      amount: 0,
      currency_code: baseCurrency?.code || 'EUR',
      is_active: true,
      sort_order: amounts.length + 1,
      bonus_percentage: 0,
    });
  };

  if (loading) {
    return <div className="p-4 text-gray-600">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prepaid Aufladebeträge</h3>
          <p className="text-sm text-gray-600 mt-1">
            Definieren Sie verfügbare Beträge für Prepaid-Aufladungen
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Neuer Betrag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {editingId === 'new' && (
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-gray-900 mb-4">Neuer Aufladebetrag</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betrag *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount || ''}
                  onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Währung *
                </label>
                <select
                  value={editForm.currency_code || ''}
                  onChange={e => setEditForm({ ...editForm, currency_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.bonus_percentage || ''}
                  onChange={e => setEditForm({ ...editForm, bonus_percentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sortierung
                </label>
                <input
                  type="number"
                  value={editForm.sort_order || 0}
                  onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-active"
                  checked={editForm.is_active ?? true}
                  onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="new-active" className="text-sm text-gray-700">
                  Aktiv
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save size={16} />
                  Speichern
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {amounts.map(amount => (
          <div
            key={amount.id}
            className={`border-2 rounded-lg p-4 transition-all ${
              editingId === amount.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {editingId === amount.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Betrag *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount || ''}
                    onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Währung *
                  </label>
                  <select
                    value={editForm.currency_code || ''}
                    onChange={e => setEditForm({ ...editForm, currency_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonus (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.bonus_percentage || ''}
                    onChange={e => setEditForm({ ...editForm, bonus_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sortierung
                  </label>
                  <input
                    type="number"
                    value={editForm.sort_order || 0}
                    onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-active-${amount.id}`}
                    checked={editForm.is_active ?? true}
                    onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor={`edit-active-${amount.id}`} className="text-sm text-gray-700">
                    Aktiv
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={16} />
                    Speichern
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {amount.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">{amount.currency_code}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(amount)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(amount.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {amount.bonus_percentage > 0 && (
                  <div className="mb-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    +{amount.bonus_percentage}% Bonus
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Sortierung: {amount.sort_order}
                </div>

                {!amount.is_active && (
                  <div className="mt-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded inline-block">
                    Inaktiv
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {amounts.length === 0 && editingId !== 'new' && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-2">Keine Aufladebeträge konfiguriert</p>
          <p className="text-sm text-gray-500 mb-4">
            Erstellen Sie Aufladebeträge für Prepaid-Konten
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Ersten Betrag hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}
