import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Lock, Unlock, FileText } from 'lucide-react';
import {
  getAllAgreementTitles,
  createAgreementTitle,
  updateAgreementTitle,
  deleteAgreementTitle,
  toggleAgreementTitleLock,
  Vereinbarungstitel,
} from '../../lib/agreement.service';

interface DocumentTitleManagementProps {
  onTitleChange?: () => void;
}

export function DocumentTitleManagement({ onTitleChange }: DocumentTitleManagementProps = {}) {
  const [titles, setTitles] = useState<Vereinbarungstitel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
  });

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await getAllAgreementTitles();
      setTitles(data);
    } catch (error: any) {
      console.error('Error loading titles:', error);
      alert('Fehler beim Laden der Dokumententitel: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.titel.trim()) {
        alert('Bitte geben Sie einen Titel ein.');
        return;
      }

      if (editingId) {
        await updateAgreementTitle(editingId, formData);
      } else {
        await createAgreementTitle(formData.titel, formData.beschreibung);
      }

      setEditingId(null);
      setIsAdding(false);
      resetForm();
      await loadTitles();
      if (onTitleChange) onTitleChange();
    } catch (error: any) {
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleEdit = (title: Vereinbarungstitel) => {
    setEditingId(title.id);
    setFormData({
      titel: title.titel,
      beschreibung: title.beschreibung || '',
    });
  };

  const handleDelete = async (id: string, gesperrt: boolean) => {
    if (gesperrt) {
      alert('Gesperrte Dokumententitel können nicht gelöscht werden. Entsperren Sie den Titel zuerst.');
      return;
    }

    if (!confirm('Sind Sie sicher, dass Sie diesen Dokumententitel löschen möchten?')) {
      return;
    }

    try {
      await deleteAgreementTitle(id);
      await loadTitles();
      if (onTitleChange) onTitleChange();
    } catch (error: any) {
      if (error.message.includes('violates foreign key constraint')) {
        alert('Dieser Dokumententitel kann nicht gelöscht werden, da er bereits in Vereinbarungen verwendet wird.');
      } else {
        alert('Fehler beim Löschen: ' + error.message);
      }
    }
  };

  const handleToggleLock = async (id: string, currentLockState: boolean) => {
    try {
      await toggleAgreementTitleLock(id, !currentLockState);
      await loadTitles();
      if (onTitleChange) onTitleChange();
    } catch (error: any) {
      alert('Fehler beim Ändern des Sperrstatus: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      titel: '',
      beschreibung: '',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Lade Dokumententitel...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dokumententitel verwalten</h2>
          <p className="text-gray-600 text-sm mt-1">
            Erstellen und verwalten Sie Dokumententitel (z.B. AGB, Datenschutz, Impressum)
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Neuer Dokumententitel
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            {editingId ? 'Dokumententitel bearbeiten' : 'Neuen Dokumententitel erstellen'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.titel}
                onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Allgemeine Geschäftsbedingungen, Datenschutzerklärung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optionale Beschreibung des Dokumententyps"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={20} />
                Speichern
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setIsAdding(false);
                  resetForm();
                }}
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
        {titles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-900">Keine Dokumententitel vorhanden</p>
            <p className="text-sm text-gray-500 mt-1">Erstellen Sie Ihren ersten Dokumententitel</p>
          </div>
        ) : (
          titles.map((title) => (
            <div
              key={title.id}
              className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                title.gesperrt
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{title.titel}</h3>
                  {title.gesperrt && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                      <Lock size={12} />
                      Gesperrt
                    </span>
                  )}
                </div>
                {title.beschreibung && (
                  <p className="text-sm text-gray-600 mb-2">{title.beschreibung}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>ID: {title.id}</span>
                  <span>
                    Erstellt: {new Date(title.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(title)}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleToggleLock(title.id, title.gesperrt)}
                  className={`p-2 rounded-lg transition-colors ${
                    title.gesperrt
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  title={title.gesperrt ? 'Entsperren' : 'Sperren'}
                >
                  {title.gesperrt ? <Unlock size={18} /> : <Lock size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(title.id, title.gesperrt)}
                  className={`p-2 rounded-lg transition-colors ${
                    title.gesperrt
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={title.gesperrt ? 'Gesperrte Titel können nicht gelöscht werden' : 'Löschen'}
                  disabled={title.gesperrt}
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

