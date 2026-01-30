import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getAllPlaceholderDefinitions, PlatzhalterDefinition } from '../../lib/agreement.service';

interface PlatzhalterAuswahlModalProps {
  show: boolean;
  onHide: () => void;
  onSelectPlaceholder: (placeholderKey: string) => void;
}

export function PlatzhalterAuswahlModal({
  show,
  onHide,
  onSelectPlaceholder,
}: PlatzhalterAuswahlModalProps) {
  const [placeholders, setPlaceholders] = useState<PlatzhalterDefinition[]>([]);
  const [filteredPlaceholders, setFilteredPlaceholders] = useState<PlatzhalterDefinition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadPlaceholders();
    }
  }, [show]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlaceholders(placeholders);
    } else {
      const filtered = placeholders.filter(
        (p) =>
          p.platzhalter_schluessel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.beschreibung.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlaceholders(filtered);
    }
  }, [searchTerm, placeholders]);

  const loadPlaceholders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPlaceholderDefinitions();
      setPlaceholders(data);
      setFilteredPlaceholders(data);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Platzhalter');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (placeholder: PlatzhalterDefinition) => {
    onSelectPlaceholder(placeholder.platzhalter_schluessel);
    onHide();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">🏷️ Platzhalter auswählen</h2>
          <button
            onClick={onHide}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Platzhalter suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Lade Platzhalter...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && filteredPlaceholders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Keine Platzhalter gefunden</p>
            </div>
          )}

          {!loading && !error && filteredPlaceholders.length > 0 && (
            <div className="space-y-2">
              {filteredPlaceholders.map((placeholder) => (
                <button
                  key={placeholder.id}
                  onClick={() => handleSelect(placeholder)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {placeholder.platzhalter_schluessel}
                      </code>
                      <p className="text-sm text-gray-600 mt-2">{placeholder.beschreibung}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          Quelle: {placeholder.quell_tabelle}.{placeholder.quell_spalte}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onHide}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

