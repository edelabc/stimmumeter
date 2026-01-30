import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getFooterSettings, updateFooterSettings, FooterContent } from '../../lib/menu.service';

export function FooterManagement() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<FooterContent>({
    text: '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
    links: []
  });
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  useEffect(() => {
    loadFooterSettings();
  }, []);

  const loadFooterSettings = async () => {
    try {
      const settings = await getFooterSettings();
      if (settings.content) {
        // Stelle sicher, dass links immer ein Array ist
        setContent({
          text: settings.content.text || '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
          links: settings.content.links || []
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Footer-Einstellungen:', error);
      // Behalte Standard-Content bei Fehler
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      await updateFooterSettings(content);
      alert('Footer erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Footer-Einstellungen');
    }
  };

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setContent({
        ...content,
        links: [...content.links, newLink]
      });
      setNewLink({ title: '', url: '' });
    }
  };

  const handleRemoveLink = (index: number) => {
    setContent({
      ...content,
      links: content.links.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div className="text-center py-8">Lade Footer-Einstellungen...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Footer bearbeiten</h2>
        <p className="text-gray-600 text-sm">
          Gestalte den Footer-Text und füge zusätzliche Links hinzu.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer-Text (Copyright)
          </label>
          <input
            type="text"
            value={content.text}
            onChange={(e) => setContent({ ...content, text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. © 2025 Meine Website. Alle Rechte vorbehalten."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Zusätzliche Footer-Links
          </label>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Link-Titel"
              />
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="URL"
              />
            </div>
            <button
              onClick={handleAddLink}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Link hinzufügen
            </button>
          </div>

          {(content.links?.length || 0) > 0 && (
            <div className="space-y-2">
              {content.links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{link.title}</p>
                    <p className="text-sm text-gray-500">{link.url}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Save size={20} />
          Änderungen speichern
        </button>
      </div>
    </div>
  );
}
