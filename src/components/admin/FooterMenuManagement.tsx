import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { getAllAgreements, Vereinbarung } from '../../lib/agreement.service';
import { getAllFooterMenuItems, createFooterMenuItem, updateFooterMenuItem, deleteFooterMenuItem, FooterMenuItem } from '../../lib/menu.service';

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
    linked_agreement_id: null as string | null,
    slug: null as string | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadFooterItems(), loadAgreements()]);
  };

  const loadFooterItems = async () => {
    try {
      const data = await getAllFooterMenuItems();
      setItems(data);
    } catch (error) {
      console.error('Fehler beim Laden der Footer-Menü-Items:', error);
      setItems([]); // Leeres Array statt null
    } finally {
      setLoading(false);
    }
  };

  const loadAgreements = async () => {
    try {
      const data = await getAllAgreements();
      // Only show "Unterzeichnet" agreements that have slugs
      setAgreements(data.filter(a => a.status === 'Unterzeichnet' && a.slug));
    } catch (error) {
      console.error('Error loading agreements:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateFooterMenuItem(editingId, formData);
      } else {
        await createFooterMenuItem(formData);
      }

      setEditingId(null);
      setIsAdding(false);
      setFormData({ title: '', url: '', position: 0, is_active: true, category: 'general', linked_agreement_id: null, slug: null });
      loadFooterItems();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Footer-Menü-Items');
    }
  };

  const handleEdit = (item: FooterMenuItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      url: item.url,
      position: item.position,
      is_active: item.is_active,
      category: item.category,
      linked_agreement_id: item.linked_agreement_id || null,
      slug: item.slug || null
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Footer-Menüpunkt wirklich löschen?')) {
      try {
        await deleteFooterMenuItem(id);
        loadFooterItems();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen des Footer-Menü-Items');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', url: '', position: 0, is_active: true, category: 'general', linked_agreement_id: null, slug: null });
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
                  if (agreementId) {
                    const agreement = agreements.find((a) => a.id === agreementId);
                    if (agreement && agreement.slug) {
                      // Use the slug from the agreement (already generated when status was set to "Unterzeichnet")
                      setFormData({
                        ...formData,
                        linked_agreement_id: agreementId,
                        slug: agreement.slug,
                        // Only set URL if no manual URL was entered
                        url: formData.url && !formData.url.startsWith('/agreement/') && !formData.url.startsWith('/docs/') 
                          ? formData.url 
                          : `/agreement/${agreement.slug}`,
                      });
                    }
                  } else {
                    setFormData({
                      ...formData,
                      linked_agreement_id: null,
                      slug: null,
                      // Keep manual URL if it doesn't look like an auto-generated agreement URL
                      url: formData.url.startsWith('/agreement/') || formData.url.startsWith('/docs/') ? '' : formData.url,
                    });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Keine Vereinbarung --</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.titel?.titel || 'Ohne Titel'} (Version {agreement.version}) - {agreement.slug ? `/agreement/${agreement.slug}` : 'Kein Slug'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Wählen Sie eine bereits erstellte Vereinbarung mit Status "Unterzeichnet" aus. Der Link wird automatisch generiert.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => {
                  // Manual URL has priority - if user enters something, use it
                  const newUrl = e.target.value;
                  setFormData({ 
                    ...formData, 
                    url: newUrl,
                    // Clear linked_agreement_id if manual URL doesn't match agreement pattern
                    linked_agreement_id: newUrl && !newUrl.startsWith('/agreement/') && !newUrl.startsWith('/docs/') 
                      ? null 
                      : formData.linked_agreement_id
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. /legal/impressum oder /agreement/..."
              />
              {formData.linked_agreement_id && formData.url.startsWith('/agreement/') && (
                <p className="text-xs text-blue-600 mt-1">
                  URL wird automatisch aus Vereinbarung generiert. Slug: <code className="bg-blue-50 px-1 rounded">{formData.slug}</code>
                  <br />
                  <span className="text-gray-500">Tipp: Sie können eine manuelle URL eingeben, die dann Priorität hat.</span>
                </p>
              )}
              {formData.url && !formData.url.startsWith('/agreement/') && !formData.url.startsWith('/docs/') && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Manuelle URL wird verwendet (hat Priorität)
                </p>
              )}
            </div>
            {formData.linked_agreement_id && formData.url.includes('/agreement/') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL-Identifier)</label>
                <input
                  type="text"
                  value={formData.url.replace('/agreement/', '')}
                  onChange={(e) => {
                    const newSlug = e.target.value;
                    setFormData({
                      ...formData,
                      slug: newSlug,
                      url: `/agreement/${newSlug}`,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="impressum"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-freundlicher Identifier. Wird automatisch aus dem Titel generiert.
                </p>
              </div>
            )}
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

