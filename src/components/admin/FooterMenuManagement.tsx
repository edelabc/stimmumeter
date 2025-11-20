import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAllAgreements, Vereinbarung } from '../../lib/agreement.service';

interface FooterMenuItem {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  category: string;
  linked_agreement_id?: string | null;
  slug?: string | null;
}

const CATEGORIES = [
  { value: 'legal', label: 'Rechtliches' },
  { value: 'company', label: 'Unternehmen' },
  { value: 'support', label: 'Support' },
  { value: 'general', label: 'Allgemein' }
];

export function FooterMenuManagement() {
  const [items, setItems] = useState<FooterMenuItem[]>([]);
  const [agreements, setAgreements] = useState<Vereinbarung[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    position: 0,
    is_active: true,
    category: 'general',
    linked_agreement_id: null as string | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadFooterItems(), loadAgreements()]);
  };

  const loadFooterItems = async () => {
    const { data } = await supabase
      .from('footer_menu_items')
      .select('*')
      .order('category')
      .order('position');

    if (data) setItems(data);
    setLoading(false);
  };

  const loadAgreements = async () => {
    try {
      const data = await getAllAgreements();
      setAgreements(data.filter(a => a.status === 'Unterzeichnet'));
    } catch (error) {
      console.error('Error loading agreements:', error);
    }
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase
        .from('footer_menu_items')
        .update(formData)
        .eq('id', editingId);
    } else {
      await supabase
        .from('footer_menu_items')
        .insert(formData);
    }

    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', url: '', position: 0, is_active: true, category: 'general', linked_agreement_id: null });
    loadFooterItems();
  };

  const handleEdit = (item: FooterMenuItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      url: item.url,
      position: item.position,
      is_active: item.is_active,
      category: item.category,
      linked_agreement_id: item.linked_agreement_id || null
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Footer-Menüpunkt wirklich löschen?')) {
      await supabase.from('footer_menu_items').delete().eq('id', id);
      loadFooterItems();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', url: '', position: 0, is_active: true, category: 'general', linked_agreement_id: null });
  };

  if (loading) return <div className="text-center py-8">Lade Footer-Menü...</div>;

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FooterMenuItem[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Footer-Menü bearbeiten</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Hinzufügen
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Footer-Menüpunkt bearbeiten' : 'Neuer Footer-Menüpunkt'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Impressum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vereinbarung verknüpfen (optional)</label>
              <select
                value={formData.linked_agreement_id || ''}
                onChange={(e) => {
                  const agreementId = e.target.value || null;
                  setFormData({
                    ...formData,
                    linked_agreement_id: agreementId,
                    url: agreementId ? '/agreement/' : formData.url
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Keine Vereinbarung --</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.titel?.titel || 'Ohne Titel'} (Version {agreement.version})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Wenn eine Vereinbarung verknüpft ist, wird die URL automatisch generiert
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. /legal/impressum"
                disabled={!!formData.linked_agreement_id}
              />
              {formData.linked_agreement_id && (
                <p className="text-xs text-blue-600 mt-1">
                  Die URL wird automatisch generiert basierend auf der Vereinbarung
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Aktiv
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={20} />
                Speichern
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={20} />
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">
              {CATEGORIES.find(c => c.value === category)?.label || category}
            </h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {!item.is_active && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                          Inaktiv
                        </span>
                      )}
                      {item.linked_agreement_id && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          Vereinbarung
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.url} • Position: {item.position}
                      {item.slug && <span> • Slug: {item.slug}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

