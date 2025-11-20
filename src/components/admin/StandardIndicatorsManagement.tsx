import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Trash2, CreditCard as Edit2, Save, X, Upload, Lock, Unlock, Search } from 'lucide-react';
import { supabase, MoodIndicator } from '../../lib/supabase';

export function StandardIndicatorsManagement() {
  const [indicators, setIndicators] = useState<MoodIndicator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_value: 0,
    max_value: 10,
    step_value: 1,
    color_start: '#ef4444',
    color_end: '#10b981',
    icon_url: null as string | null,
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    const { data, error } = await supabase
      .from('mood_indicators')
      .select('*')
      .is('user_id', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading standard indicators:', error);
      return;
    }

    setIndicators(data || []);
  };

  const filteredIndicators = indicators.filter((indicator) =>
    indicator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin/${Date.now()}.${fileExt}`;

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

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      const { data, error } = await supabase.storage
        .from('indicator-icons')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('indicator-icons')
        .getPublicUrl(data.path);

      setFormData({ ...formData, icon_url: urlData.publicUrl });
      setIconPreview(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Fehler beim Hochladen des Icons');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    const trimmedName = formData.name.trim();
    
    // Prüfe, ob ein Standard-Indikator mit diesem Namen bereits existiert
    const existingIndicator = indicators.find(
      (ind) => ind.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );

    if (existingIndicator) {
      alert('Ein Standard-Indikator mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
      return;
    }

    const maxSortOrder = Math.max(...indicators.map(i => i.sort_order), 0);

    const { error } = await supabase
      .from('mood_indicators')
      .insert([{
        ...formData,
        name: trimmedName,
        user_id: null,
        sort_order: maxSortOrder + 1,
        color: formData.color_start,
        is_active: true,
      }]);

    if (error) {
      console.error('Error creating indicator:', error);
      if (error.code === '23505') {
        alert('Ein Standard-Indikator mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
      } else {
        alert('Fehler: ' + error.message);
      }
      return;
    }

    resetForm();
    await loadIndicators();
  };

  const handleUpdate = async (id: string) => {
    const trimmedName = formData.name.trim();
    
    // Prüfe, ob ein anderer Standard-Indikator mit diesem Namen bereits existiert
    const existingIndicator = indicators.find(
      (ind) => ind.id !== id && ind.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );

    if (existingIndicator) {
      alert('Ein Standard-Indikator mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
      return;
    }

    const { error } = await supabase
      .from('mood_indicators')
      .update({
        ...formData,
        name: trimmedName,
        color: formData.color_start,
      })
      .eq('id', id)
      .is('user_id', null);

    if (error) {
      console.error('Error updating indicator:', error);
      if (error.code === '23505') {
        alert('Ein Standard-Indikator mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
      } else {
        alert('Fehler: ' + error.message);
      }
      return;
    }

    setEditingId(null);
    resetForm();
    await loadIndicators();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Standard-Indikator löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.')) return;

    const { error } = await supabase
      .from('mood_indicators')
      .delete()
      .eq('id', id)
      .is('user_id', null);

    if (error) {
      console.error('Error deleting indicator:', error);
      alert('Fehler: ' + error.message);
      return;
    }

    await loadIndicators();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('mood_indicators')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .is('user_id', null);

    if (error) {
      console.error('Error toggling indicator status:', error);
      alert('Fehler: ' + error.message);
      return;
    }

    await loadIndicators();
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
    });
    setIconPreview(indicator.icon_url || null);
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
    });
    setEditingId(null);
    setIconPreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Standard-Indikatoren verwalten</h2>
        </div>
      </div>

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
          filteredIndicators.map((indicator) => (
            <div
              key={indicator.id}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg ${
                indicator.is_active
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-gray-100 border-gray-300 opacity-60'
              }`}
            >
              {indicator.icon_url ? (
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200">
                  <img src={indicator.icon_url} alt={indicator.name} className="w-10 h-10 object-contain" />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{
                    background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
                  }}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{indicator.name}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                    Standard
                  </span>
                  {!indicator.is_active && (
                    <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">
                      Gesperrt
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {indicator.min_value} - {indicator.max_value} (Schritt: {indicator.step_value})
                </p>
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
          ))
        )}
      </div>
    </div>
  );
}

