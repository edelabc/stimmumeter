import { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  is_active: boolean;
}

export function LegalPagesManagement() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const { data } = await supabase
      .from('legal_pages')
      .select('*')
      .order('page_type');

    if (data) setPages(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase
        .from('legal_pages')
        .update(formData)
        .eq('id', editingId);
    }

    setEditingId(null);
    setFormData({ title: '', content: '', is_active: true });
    loadPages();
  };

  const handleEdit = (page: LegalPage) => {
    setEditingId(page.id);
    setFormData({
      title: page.title,
      content: page.content,
      is_active: page.is_active
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', is_active: true });
  };

  const getPageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      impressum: 'Impressum',
      dsgvo: 'DSGVO',
      cookies: 'Cookie-Richtlinie',
      datenschutz: 'Datenschutzbestimmungen'
    };
    return labels[type] || type;
  };

  if (loading) return <div className="text-center py-8">Lade Seiten...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rechtliche Seiten</h2>
        <p className="text-gray-600 text-sm">
          Diese Inhalte werden automatisch im Footer und auf den entsprechenden Seiten verlinkt.
        </p>
      </div>

      {editingId && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Seite bearbeiten</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Gib hier den Inhalt der Seite ein..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="page_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="page_active" className="text-sm font-medium text-gray-700">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{page.title}</h3>
                  {!page.is_active && (
                    <span className="px-2 py-1 bg-gray-300 text-gray-600 text-xs font-semibold rounded-full">
                      Inaktiv
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{getPageTypeLabel(page.page_type)}</p>
              </div>
              <button
                onClick={() => handleEdit(page)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">
                {page.content || 'Kein Inhalt vorhanden'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
