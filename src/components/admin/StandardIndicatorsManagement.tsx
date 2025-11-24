import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Trash2, CreditCard as Edit2, Save, X, Upload, Lock, Unlock, Search, Tag } from 'lucide-react';
import { getApiBaseUrl } from '../../lib/api-client';

// Type definitions
export interface MoodIndicator {
  id: string;
  name: string;
  min_value: number;
  max_value: number;
  step_value: number;
  color_start: string;
  color_end: string;
  icon_url: string | null;
  category_id: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  user_id: string | null;
  category?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface IndicatorCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

type TabType = 'indicators' | 'categories';

export function StandardIndicatorsManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('indicators');
  const [indicators, setIndicators] = useState<MoodIndicator[]>([]);
  const [categories, setCategories] = useState<IndicatorCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_value: 0,
    max_value: 10,
    step_value: 1,
    color_start: '#ef4444',
    color_end: '#10b981',
    icon_url: null as string | null,
    category_id: null as string | null,
    description: '',
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadIndicators();
    loadCategories();
  }, []);

  const loadIndicators = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=standard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Standard-Indikatoren');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setIndicators(result.data);
      }
    } catch (err) {
      console.error('Error loading standard indicators:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kategorien');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const filteredIndicators = indicators.filter((indicator) =>
    indicator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      // Für jetzt: Konvertiere zu Data URL (später kann man einen Upload-Endpunkt hinzufügen)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const size = 128;
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0, size, size);

      const dataUrl = canvas.toDataURL('image/png');
      
      // Verwende Data URL direkt (später kann man einen Upload-Endpunkt hinzufügen)
      setFormData({ ...formData, icon_url: dataUrl });
      setIconPreview(dataUrl);
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Fehler beim Hochladen des Icons');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=create-standard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          color: formData.color_start,
          is_active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Erstellen' }));
        throw new Error(errorData.error || 'Fehler beim Erstellen');
      }

      resetForm();
      await loadIndicators();
    } catch (err: any) {
      console.error('Error creating indicator:', err);
      alert(err.message || 'Fehler beim Erstellen des Indikators');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=update-standard&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          color: formData.color_start,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Aktualisieren' }));
        throw new Error(errorData.error || 'Fehler beim Aktualisieren');
      }

      setEditingId(null);
      resetForm();
      await loadIndicators();
    } catch (err: any) {
      console.error('Error updating indicator:', err);
      alert(err.message || 'Fehler beim Aktualisieren des Indikators');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Standard-Indikator löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=delete-standard&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Löschen' }));
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      await loadIndicators();
    } catch (err: any) {
      console.error('Error deleting indicator:', err);
      alert(err.message || 'Fehler beim Löschen des Indikators');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=toggle-active-standard&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus ? 1 : 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Ändern des Status' }));
        throw new Error(errorData.error || 'Fehler beim Ändern des Status');
      }

      await loadIndicators();
    } catch (err: any) {
      console.error('Error toggling indicator status:', err);
      alert(err.message || 'Fehler beim Ändern des Status');
    }
  };

  const handleCategoryCreate = async () => {
    if (!categoryFormData.name.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=create-category`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Erstellen' }));
        throw new Error(errorData.error || 'Fehler beim Erstellen');
      }

      resetCategoryForm();
      await loadCategories();
    } catch (err: any) {
      console.error('Error creating category:', err);
      alert(err.message || 'Fehler beim Erstellen der Kategorie');
    }
  };

  const handleCategoryUpdate = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=update-category&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Aktualisieren' }));
        throw new Error(errorData.error || 'Fehler beim Aktualisieren');
      }

      setEditingCategoryId(null);
      resetCategoryForm();
      await loadCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
      alert(err.message || 'Fehler beim Aktualisieren der Kategorie');
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Kategorie löschen? Indikatoren mit dieser Kategorie werden nicht gelöscht, aber die Zuordnung wird entfernt.')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/mood-indicators.php?action=delete-category&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Löschen' }));
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      await loadCategories();
      await loadIndicators();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert(err.message || 'Fehler beim Löschen der Kategorie');
    }
  };

  const startEdit = (indicator: MoodIndicator) => {
    setEditingId(indicator.id);
    setFormData({
      name: indicator.name,
      min_value: indicator.min_value,
      max_value: indicator.max_value,
      step_value: indicator.step_value,
      color_start: indicator.color_start,
      color_end: indicator.color_end,
      icon_url: indicator.icon_url || null,
      category_id: indicator.category_id || null,
      description: indicator.description || '',
    });
    setIconPreview(indicator.icon_url || null);
  };

  const startCategoryEdit = (category: IndicatorCategory) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      min_value: 0,
      max_value: 10,
      step_value: 1,
      color_start: '#ef4444',
      color_end: '#10b981',
      icon_url: null,
      category_id: null,
      description: '',
    });
    setEditingId(null);
    setIconPreview(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
    });
    setEditingCategoryId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Standard-Indikatoren verwalten</h2>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('indicators')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'indicators'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Indikatoren
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag size={18} />
          Kategorien
        </button>
      </div>

      {/* Indikatoren Tab */}
      {activeTab === 'indicators' && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Indikator bearbeiten' : 'Neuer Standard-Indikator'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indikator Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Freundlichkeit, Energie..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keine Kategorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindestwert
                </label>
                <input
                  type="number"
                  value={formData.min_value}
                  onChange={(e) => setFormData({ ...formData, min_value: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Höchstwert
                </label>
                <input
                  type="number"
                  value={formData.max_value}
                  onChange={(e) => setFormData({ ...formData, max_value: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schrittweite
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.step_value}
                  onChange={(e) => setFormData({ ...formData, step_value: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farbe (Start/Niedrig)
                </label>
                <input
                  type="color"
                  value={formData.color_start}
                  onChange={(e) => setFormData({ ...formData, color_start: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farbe (Ende/Hoch)
                </label>
                <input
                  type="color"
                  value={formData.color_end}
                  onChange={(e) => setFormData({ ...formData, color_end: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (optional)
                </label>
                <div className="flex items-center gap-4">
                  {iconPreview && (
                    <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      <img src={iconPreview} alt="Icon Preview" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconUpload(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingIcon ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Wird hochgeladen...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Icon hochladen
                      </>
                    )}
                  </button>
                  {iconPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, icon_url: null });
                        setIconPreview(null);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Icon entfernen"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG oder SVG · Max. 2MB · Wird automatisch auf 128x128px skaliert
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Wissenschaftliche oder detaillierte Beschreibung des Indikators..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              {editingId ? (
                <>
                  <button
                    onClick={() => handleUpdate(editingId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={18} />
                    Speichern
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!formData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
                >
                  <Plus size={18} />
                  Erstellen
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indikatoren suchen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nach Indikator-Namen suchen..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredIndicators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {indicators.length === 0 ? (
                  <>
                    <p className="mb-2">Noch keine Standard-Indikatoren vorhanden</p>
                    <p className="text-sm">Erstelle deinen ersten Standard-Indikator oben</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">Keine Indikatoren gefunden</p>
                    <p className="text-sm">Versuche einen anderen Suchbegriff</p>
                  </>
                )}
              </div>
            ) : (
              filteredIndicators.map((indicator) => {
                const category = indicator.category || (categories.find(c => c.id === indicator.category_id));
                return (
                  <div
                    key={indicator.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg ${
                      indicator.is_active
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    {indicator.icon_url ? (
                      (indicator.icon_url.startsWith('http://') || indicator.icon_url.startsWith('https://') || indicator.icon_url.startsWith('/')) ? (
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200">
                          <img src={indicator.icon_url} alt={indicator.name} className="w-10 h-10 object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200 text-2xl">
                          {indicator.icon_url}
                        </div>
                      )
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{
                          background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{indicator.name}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                          Standard
                        </span>
                        {category && (
                          <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                            {category.name}
                          </span>
                        )}
                        {!indicator.is_active && (
                          <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">
                            Gesperrt
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {indicator.min_value} - {indicator.max_value} (Schritt: {indicator.step_value})
                      </p>
                      {indicator.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate" title={indicator.description}>
                          {indicator.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(indicator.id, indicator.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          indicator.is_active
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={indicator.is_active ? 'Sperren' : 'Entsperren'}
                      >
                        {indicator.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button
                        onClick={() => startEdit(indicator)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Bearbeiten"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(indicator.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Kategorien Tab */}
      {activeTab === 'categories' && (
        <>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategoryId ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie Name
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="z.B. Positive Stimmung (VALENZ POSITIV)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Beschreibung der Kategorie..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              {editingCategoryId ? (
                <>
                  <button
                    onClick={() => handleCategoryUpdate(editingCategoryId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={18} />
                    Speichern
                  </button>
                  <button
                    onClick={resetCategoryForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCategoryCreate}
                  disabled={!categoryFormData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  <Plus size={18} />
                  Erstellen
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">Noch keine Kategorien vorhanden</p>
                <p className="text-sm">Erstelle deine erste Kategorie oben</p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-gray-300"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startCategoryEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Bearbeiten"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
