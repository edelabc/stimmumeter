import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Save, Trash2, X } from 'lucide-react';
import {
  getAllHelpTexts,
  createHelpText,
  updateHelpText,
  deleteHelpText,
  type HelpText,
} from '../../lib/billing';

export function HelpTextManagement() {
  const [helpTexts, setHelpTexts] = useState<HelpText[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHelp, setEditingHelp] = useState<HelpText | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadHelpTexts();
  }, []);

  const loadHelpTexts = async () => {
    setLoading(true);
    const { data } = await getAllHelpTexts();
    if (data) setHelpTexts(data);
    setLoading(false);
  };

  const handleCreate = async (helpText: Omit<HelpText, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await createHelpText(helpText);
    if (data) {
      setHelpTexts([...helpTexts, data]);
      setShowCreateModal(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<HelpText>) => {
    const { data, error } = await updateHelpText(id, updates);
    if (data) {
      setHelpTexts(helpTexts.map(h => h.id === id ? data : h));
      setEditingHelp(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this help text?')) return;

    const { error } = await deleteHelpText(id);
    if (!error) {
      setHelpTexts(helpTexts.filter(h => h.id !== id));
      if (editingHelp?.id === id) setEditingHelp(null);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading help texts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle size={20} />
            Hilfetexte
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Kontextuelle Hilfe-Tooltips in der gesamten Anwendung verwalten
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Hilfetext erstellen
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Titel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kontext</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {helpTexts.map(helpText => (
              <tr key={helpText.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{helpText.code}</td>
                <td className="px-4 py-3 font-medium">{helpText.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{helpText.context || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    helpText.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {helpText.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingHelp(helpText)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(helpText.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <HelpTextModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {editingHelp && (
        <HelpTextModal
          helpText={editingHelp}
          onClose={() => setEditingHelp(null)}
          onSave={(updates) => handleUpdate(editingHelp.id, updates)}
        />
      )}
    </div>
  );
}

interface HelpTextModalProps {
  helpText?: HelpText;
  onClose: () => void;
  onSave: (helpText: any) => void;
}

function HelpTextModal({ helpText, onClose, onSave }: HelpTextModalProps) {
  const [formData, setFormData] = useState({
    code: helpText?.code || '',
    title: helpText?.title || '',
    content: helpText?.content || '',
    context: helpText?.context || '',
    is_active: helpText?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {helpText ? 'Hilfetext bearbeiten' : 'Hilfetext erstellen'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code (eindeutiger Schlüssel)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              disabled={!!helpText}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="billing_plan_overview"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Was sind Tarife?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inhalt
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Detailed explanation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontext (wo wird er verwendet)
            </label>
            <input
              type="text"
              value={formData.context}
              onChange={e => setFormData({ ...formData, context: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="billing, user_account, etc."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is-active" className="text-sm font-medium text-gray-700">
              Aktiv (für Benutzer sichtbar)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={18} />
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
