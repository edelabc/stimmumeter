import { useState, useEffect } from 'react';
import { Brain, Save, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { getAllAIProviderSettings, updateAIProviderSetting, AIProviderSetting } from '../../lib/ai-provider.service';

interface AIProviderSetting {
  id: string;
  provider: string;
  is_enabled: boolean;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

const PROVIDER_NAMES = {
  openai: 'OpenAI (GPT)',
  gemini: 'Google Gemini',
  claude: 'Claude (Anthropic)',
  xai: 'xAI (Grok)',
  manus: 'Manus AI'
};

export function AIModuleManagement() {
  const [providers, setProviders] = useState<AIProviderSetting[]>([]);
  const [showPrompt, setShowPrompt] = useState<{ [key: string]: boolean }>({});
  const [editingPrompt, setEditingPrompt] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await getAllAIProviderSettings();
      setProviders(data);

      const initialPrompts: { [key: string]: string } = {};
      data.forEach(p => {
        initialPrompts[p.id] = p.system_prompt || '';
      });
      setEditingPrompt(initialPrompts);
    } catch (err) {
      console.error('Error loading providers:', err);
      setError('Fehler beim Laden der Provider-Einstellungen');
      setProviders([]); // Leeres Array bei Fehler
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (id: string, currentState: boolean) => {
    try {
      const updatedProvider = await updateAIProviderSetting(id, {
        is_enabled: !currentState
      });

      setProviders(providers.map(p =>
        p.id === id ? updatedProvider : p
      ));
      setSuccess(`Provider ${!currentState ? 'aktiviert' : 'deaktiviert'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling provider:', err);
      setError('Fehler beim Umschalten des Providers');
    }
  };

  const handleSavePrompt = async (id: string) => {
    try {
      const updatedProvider = await updateAIProviderSetting(id, {
        system_prompt: editingPrompt[id] || null
      });

      setProviders(providers.map(p =>
        p.id === id ? updatedProvider : p
      ));
      setSuccess('System Prompt gespeichert');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError('Fehler beim Speichern des System Prompts');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Provider-Einstellungen...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain size={32} className="text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KI-Modul Verwaltung</h2>
          <p className="text-sm text-gray-600">Provider aktivieren/deaktivieren und System Prompts verwalten</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`border-2 rounded-lg p-6 transition-all ${
              provider.is_enabled
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {PROVIDER_NAMES[provider.provider as keyof typeof PROVIDER_NAMES] || provider.provider}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    provider.is_enabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {provider.is_enabled ? 'Aktiv' : 'Deaktiviert'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Provider Code: <code className="bg-white px-2 py-1 rounded">{provider.provider}</code>
                </p>
              </div>

              <button
                onClick={() => handleToggleProvider(provider.id, provider.is_enabled)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  provider.is_enabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {provider.is_enabled ? 'Deaktivieren' : 'Aktivieren'}
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  System Prompt (Standard für diesen Provider)
                </label>
                <button
                  onClick={() => setShowPrompt({
                    ...showPrompt,
                    [provider.id]: !showPrompt[provider.id]
                  })}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showPrompt[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPrompt[provider.id] ? 'Verstecken' : 'Anzeigen'}
                </button>
              </div>

              {showPrompt[provider.id] && (
                <div className="space-y-3">
                  <textarea
                    value={editingPrompt[provider.id] || ''}
                    onChange={(e) => setEditingPrompt({
                      ...editingPrompt,
                      [provider.id]: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={8}
                    placeholder="Standard System Prompt für diesen Provider..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSavePrompt(provider.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save size={18} />
                      Prompt speichern
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Hinweise:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Deaktivierte Provider können von Benutzern nicht ausgewählt werden</li>
          <li>System Prompts werden als Standard verwendet, wenn Benutzer keinen eigenen Prompt definieren</li>
          <li>Änderungen wirken sich sofort auf alle neuen AI-Analysen aus</li>
        </ul>
      </div>
    </div>
  );
}
