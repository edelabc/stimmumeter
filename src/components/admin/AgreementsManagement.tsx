import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, History } from 'lucide-react';
import {
  getAllAgreements,
  getAllAgreementTitles,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  createAgreementVersion,
  getAgreementVersionHistory,
  getAgreementLogs,
  Vereinbarung,
  Vereinbarungstitel,
  CreateAgreementData,
} from '../../lib/agreement.service';
import { PlatzhalterAuswahlModal } from './PlatzhalterAuswahlModal';

export function AgreementsManagement() {
  const [agreements, setAgreements] = useState<Vereinbarung[]>([]);
  const [titles, setTitles] = useState<Vereinbarungstitel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Vereinbarung | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; version: number; status: string; created_at: string }>>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<CreateAgreementData & { status?: 'Entwurf' | 'Unterzeichnet' | 'Archiviert' }>({
    titel_id: '',
    inhalt: '',
    empfaenger_user_id: null,
    bearbeiter_von: '',
    bearbeiter_an: '',
    kurze_zusammenfassung: '',
    anlagen: '',
    gueltigkeit_von: '',
    gueltigkeit_bis: '',
    kuendigungsfrist_wert: null,
    kuendigungsfrist_einheit: null,
    status: 'Entwurf',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agreementsData, titlesData] = await Promise.all([
        getAllAgreements(),
        getAllAgreementTitles(),
      ]);
      setAgreements(agreementsData);
      setTitles(titlesData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.titel_id || !formData.inhalt) {
        alert('Bitte füllen Sie Titel und Inhalt aus.');
        return;
      }

      if (editingId) {
        await updateAgreement(editingId, formData);
      } else {
        await createAgreement(formData);
      }

      setEditingId(null);
      setIsAdding(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleEdit = (agreement: Vereinbarung) => {
    setEditingId(agreement.id);
    setFormData({
      titel_id: agreement.titel_id,
      inhalt: agreement.inhalt,
      empfaenger_user_id: agreement.empfaenger_user_id || null,
      bearbeiter_von: agreement.bearbeiter_von || '',
      bearbeiter_an: agreement.bearbeiter_an || '',
      kurze_zusammenfassung: agreement.kurze_zusammenfassung || '',
      anlagen: agreement.anlagen || '',
      gueltigkeit_von: agreement.gueltigkeit_von || '',
      gueltigkeit_bis: agreement.gueltigkeit_bis || '',
      kuendigungsfrist_wert: agreement.kuendigungsfrist_wert || null,
      kuendigungsfrist_einheit: agreement.kuendigungsfrist_einheit || null,
      status: agreement.status,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Vereinbarung löschen möchten?')) {
      return;
    }

    try {
      await deleteAgreement(id);
      loadData();
    } catch (error: any) {
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleCreateVersion = async (id: string) => {
    if (!confirm('Möchten Sie eine neue Version dieser Vereinbarung erstellen?')) {
      return;
    }

    try {
      await createAgreementVersion(id);
      loadData();
      alert('Neue Version erfolgreich erstellt!');
    } catch (error: any) {
      alert('Fehler beim Erstellen der Version: ' + error.message);
    }
  };

  const handleViewHistory = async (agreement: Vereinbarung) => {
    try {
      const historyData = await getAgreementVersionHistory(agreement.id);
      setHistory(historyData);
      setSelectedAgreement(agreement);
      setShowHistory(true);
    } catch (error: any) {
      alert('Fehler beim Laden der Versionshistorie: ' + error.message);
    }
  };

  const handleViewLogs = async (agreement: Vereinbarung) => {
    try {
      const logsData = await getAgreementLogs(agreement.id);
      setLogs(logsData);
      setSelectedAgreement(agreement);
      setShowLogs(true);
    } catch (error: any) {
      alert('Fehler beim Laden der Logs: ' + error.message);
    }
  };

  const handleSelectPlaceholder = (placeholderKey: string) => {
    if (contentTextareaRef.current) {
      const textarea = contentTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.inhalt;
      const newText = text.substring(0, start) + placeholderKey + text.substring(end);
      setFormData({ ...formData, inhalt: newText });
      
      // Set cursor position after inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholderKey.length, start + placeholderKey.length);
      }, 0);
    }
  };

  const resetForm = () => {
    setFormData({
      titel_id: '',
      inhalt: '',
      empfaenger_user_id: null,
      bearbeiter_von: '',
      bearbeiter_an: '',
      kurze_zusammenfassung: '',
      anlagen: '',
      gueltigkeit_von: '',
      gueltigkeit_bis: '',
      kuendigungsfrist_wert: null,
      kuendigungsfrist_einheit: null,
      status: 'Entwurf',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Entwurf: 'bg-gray-100 text-gray-700',
      Unterzeichnet: 'bg-green-100 text-green-700',
      Archiviert: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-700'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Lade Vereinbarungen...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vereinbarungen verwalten</h2>
          <p className="text-gray-600 text-sm mt-1">
            Erstellen und verwalten Sie rechtliche Dokumente wie AGB, Datenschutz, etc.
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
            Neue Vereinbarung
          </button>
        )}
      </div>

      {/* Form */}
      {(isAdding || editingId) && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            {editingId ? 'Vereinbarung bearbeiten' : 'Neue Vereinbarung erstellen'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vereinbarungstitel *
              </label>
              <select
                value={formData.titel_id}
                onChange={(e) => setFormData({ ...formData, titel_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Bitte wählen --</option>
                {titles.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.titel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Inhalt (HTML) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPlaceholderModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Platzhalter einfügen
                </button>
              </div>
              <textarea
                ref={contentTextareaRef}
                value={formData.inhalt}
                onChange={(e) => setFormData({ ...formData, inhalt: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="HTML-Inhalt mit Platzhaltern wie {{ersteller.username}}..."
              />
              <p className="text-xs text-gray-500 mt-1">
                HTML wird unterstützt. Verwenden Sie Platzhalter wie {'{{ersteller.username}}'} oder {'{{empfaenger.email}}'}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bearbeiter (Von)
                </label>
                <input
                  type="text"
                  value={formData.bearbeiter_von || ''}
                  onChange={(e) => setFormData({ ...formData, bearbeiter_von: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bearbeiter (An)
                </label>
                <input
                  type="text"
                  value={formData.bearbeiter_an || ''}
                  onChange={(e) => setFormData({ ...formData, bearbeiter_an: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurze Zusammenfassung
              </label>
              <textarea
                value={formData.kurze_zusammenfassung || ''}
                onChange={(e) => setFormData({ ...formData, kurze_zusammenfassung: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anlagen
              </label>
              <textarea
                value={formData.anlagen || ''}
                onChange={(e) => setFormData({ ...formData, anlagen: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Eine Anlage pro Zeile"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gültigkeit von
                </label>
                <input
                  type="date"
                  value={formData.gueltigkeit_von || ''}
                  onChange={(e) => setFormData({ ...formData, gueltigkeit_von: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gültigkeit bis
                </label>
                <input
                  type="date"
                  value={formData.gueltigkeit_bis || ''}
                  onChange={(e) => setFormData({ ...formData, gueltigkeit_bis: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kündigungsfrist (Wert)
                </label>
                <input
                  type="number"
                  value={formData.kuendigungsfrist_wert || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kuendigungsfrist_wert: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kündigungsfrist (Einheit)
                </label>
                <select
                  value={formData.kuendigungsfrist_einheit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kuendigungsfrist_einheit: e.target.value as any || null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Bitte wählen --</option>
                  <option value="Tag(e)">Tag(e)</option>
                  <option value="Woche(n)">Woche(n)</option>
                  <option value="Monat(e)">Monat(e)</option>
                  <option value="Jahre">Jahre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'Entwurf'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Entwurf' | 'Unterzeichnet' | 'Archiviert',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Entwurf">Entwurf</option>
                <option value="Unterzeichnet">Unterzeichnet</option>
                <option value="Archiviert">Archiviert</option>
              </select>
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

      {/* Agreements List */}
      <div className="space-y-3">
        {agreements.map((agreement) => (
          <div
            key={agreement.id}
            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {agreement.titel?.titel || 'Unbekannter Titel'}
                </h3>
                {getStatusBadge(agreement.status)}
                <span className="text-xs text-gray-500">v{agreement.version}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {agreement.kurze_zusammenfassung || 'Keine Zusammenfassung'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Erstellt: {new Date(agreement.created_at).toLocaleDateString('de-DE')}
                </span>
                {agreement.gueltigkeit_von && (
                  <span>
                    Gültig: {new Date(agreement.gueltigkeit_von).toLocaleDateString('de-DE')}
                    {agreement.gueltigkeit_bis &&
                      ` - ${new Date(agreement.gueltigkeit_bis).toLocaleDateString('de-DE')}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleViewHistory(agreement)}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title="Versionshistorie"
              >
                <History size={18} />
              </button>
              <button
                onClick={() => handleViewLogs(agreement)}
                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                title="Aktionsprotokoll"
              >
                <FileText size={18} />
              </button>
              <button
                onClick={() => handleEdit(agreement)}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                title="Bearbeiten"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleCreateVersion(agreement.id)}
                className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                title="Neue Version erstellen"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => handleDelete(agreement.id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                title="Löschen"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Modal */}
      <PlatzhalterAuswahlModal
        show={showPlaceholderModal}
        onHide={() => setShowPlaceholderModal(false)}
        onSelectPlaceholder={handleSelectPlaceholder}
      />

      {/* History Modal */}
      {showHistory && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Versionshistorie: {selectedAgreement.titel?.titel}
              </h2>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setSelectedAgreement(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {history.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Version {version.version}</span>
                      {getStatusBadge(version.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Erstellt: {new Date(version.created_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Aktionsprotokoll: {selectedAgreement.titel?.titel}
              </h2>
              <button
                onClick={() => {
                  setShowLogs(false);
                  setSelectedAgreement(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{log.aktion}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Benutzer: {log.user?.email || 'Unbekannt'}
                    </p>
                    {log.details && (
                      <pre className="text-xs text-gray-500 mt-2 bg-white p-2 rounded">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

