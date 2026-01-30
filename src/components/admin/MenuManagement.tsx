import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText } from 'lucide-react';
import { getAllAgreements, Vereinbarung } from '../../lib/agreement.service';
import { getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, MenuItem } from '../../lib/menu.service';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  required_role: 'public' | 'user' | 'admin';
  linked_agreement_id?: string | null;
  slug?: string | null;
  icon?: string | null;
}

export function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [agreements, setAgreements] = useState<Vereinbarung[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    position: 0,
    is_active: true,
    required_role: 'public' as 'public' | 'user' | 'admin',
    linked_agreement_id: null as string | null,
    slug: null as string | null,
    icon: null as string | null,
  });

  useEffect(() => {
    loadMenuItems();
    loadAgreements();
  }, []);

  // Note: URL auto-generation is handled in handleAgreementChange

  const loadMenuItems = async () => {
    try {
      const data = await getAllMenuItems();
      setItems(data);
    } catch (error) {
      console.error('Fehler beim Laden der Menu-Items:', error);
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
        await updateMenuItem(editingId, formData);
      } else {
        await createMenuItem(formData);
      }

      setEditingId(null);
      setIsAdding(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Menu-Items');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      url: item.url,
      position: item.position,
      is_active: item.is_active,
      required_role: item.required_role,
      linked_agreement_id: item.linked_agreement_id || null,
      slug: item.slug || null,
      icon: item.icon || null,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Menüpunkt wirklich löschen?')) {
      try {
        await deleteMenuItem(id);
        loadMenuItems();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen des Menu-Items');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      position: 0,
      is_active: true,
      required_role: 'public',
      linked_agreement_id: null,
      slug: null,
      icon: null,
    });
  };

  const handleAgreementChange = (agreementId: string | null) => {
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
  };

  if (loading) return <div className="text-center py-8">Lade Menü...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Menü bearbeiten</h2>
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
            {editingId ? 'Menüpunkt bearbeiten' : 'Neuer Menüpunkt'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Home"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mit Agreement verknüpfen
              </label>
              <select
                value={formData.linked_agreement_id || ''}
                onChange={(e) => handleAgreementChange(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Keine Verknüpfung (normale URL) --</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.titel?.titel || 'Unbekannt'} (v{agreement.version}) - {agreement.status}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Wenn ein Agreement ausgewählt wird, wird automatisch eine URL generiert.
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
                placeholder={formData.linked_agreement_id ? '/agreement/...' : 'z.B. / oder /custom-url'}
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
            {formData.slug && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL-Identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    const newSlug = e.target.value;
                    setFormData({
                      ...formData,
                      slug: newSlug,
                      url: formData.linked_agreement_id ? `/agreement/${newSlug}` : formData.url,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="agb-datenschutz"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Erforderliche Rolle</label>
              <select
                value={formData.required_role}
                onChange={(e) => setFormData({ ...formData, required_role: e.target.value as 'public' | 'user' | 'admin' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Öffentlich (alle sehen)</option>
                <option value="user">Benutzer (nur angemeldete)</option>
                <option value="admin">Admin (nur Admins)</option>
              </select>
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

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{item.title}</p>
                {!item.is_active && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                    Inaktiv
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  item.required_role === 'admin' ? 'bg-red-100 text-red-700' :
                  item.required_role === 'user' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.required_role === 'admin' ? 'Admin' : item.required_role === 'user' ? 'Benutzer' : 'Öffentlich'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{item.url}</span>
                <span>•</span>
                <span>Position: {item.position}</span>
                {item.linked_agreement_id && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <FileText size={14} />
                      Agreement verknüpft
                    </span>
                  </>
                )}
              </div>
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
  );
}
