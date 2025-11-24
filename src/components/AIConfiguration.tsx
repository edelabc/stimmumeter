import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Eye, EyeOff, AlertCircle, Edit2, Code, Zap } from 'lucide-react';
import { AITermsModal } from './AITermsModal';
import { AIService } from '../lib/ai-service';
import { getApiBaseUrl } from '../lib/api-client';

// Type definition
export interface AIConfiguration {
  id: string;
  user_id: string;
  nickname: string;
  provider: 'openai' | 'gemini' | 'claude' | 'xai' | 'manus';
  model: string;
  api_key: string;
  text_color: string;
  background_color: string;
  is_active: boolean;
  is_enabled: boolean;
  system_prompt?: string | null;
  created_at: string;
  updated_at: string;
}

type AIConfigType = AIConfiguration;

interface AIConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4' },
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-pro' },
  { id: 'claude', name: 'Claude (Anthropic)', defaultModel: 'claude-3-sonnet-20240229' },
  { id: 'xai', name: 'xAI (Grok)', defaultModel: 'grok-1' },
  { id: 'manus', name: 'Manus AI', defaultModel: 'manus-1' }
] as const;

export function AIConfiguration({ isOpen, onClose, userId }: AIConfigurationProps) {
  const [configurations, setConfigurations] = useState<AIConfigType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [showPrompt, setShowPrompt] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ configId: string; success: boolean; message: string } | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nickname: '',
    provider: 'openai' as AIConfigType['provider'],
    model: 'gpt-4',
    api_key: '',
    text_color: '#000000',
    background_color: '#f0f9ff',
    is_enabled: true,
    system_prompt: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadConfigurations();
      loadEnabledProviders();
    }
  }, [isOpen]);

  const loadEnabledProviders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=enabled-providers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Provider');
      }

      const result = await response.json();
      setEnabledProviders(result.data || AI_PROVIDERS.map(p => p.id));
    } catch (err) {
      console.error('Error loading enabled providers:', err);
      setEnabledProviders(AI_PROVIDERS.map(p => p.id));
    }
  };

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=list&user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Konfigurationen');
      }

      const result = await response.json();
      if (result.data) {
        setConfigurations(result.data);
      } else {
        setConfigurations([]);
      }
    } catch (err) {
      console.error('Error loading AI configurations:', err);
      setError('Fehler beim Laden der Konfigurationen');
    } finally {
      setLoading(false);
    }
  };

  const checkTermsAcceptance = async (provider: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=check-terms&provider=${provider}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.data?.accepted === true;
    } catch (err) {
      console.error('Error checking terms acceptance:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if terms are accepted for new configurations
    if (!editingId) {
      const hasAccepted = await checkTermsAcceptance(formData.provider);
      if (!hasAccepted) {
        setPendingProvider(formData.provider);
        setShowTermsModal(true);
        return;
      }
    }

    await saveConfiguration();
  };

  const saveConfiguration = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (editingId) {
        // Update existing configuration
        const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=update&id=${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nickname: formData.nickname,
            provider: formData.provider,
            model: formData.model,
            api_key: formData.api_key,
            text_color: formData.text_color,
            background_color: formData.background_color,
            is_enabled: formData.is_enabled,
            system_prompt: formData.system_prompt || null
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Fehler beim Aktualisieren' }));
          throw new Error(errorData.error || 'Fehler beim Aktualisieren');
        }

        const result = await response.json();
        setConfigurations(configurations.map(c => c.id === editingId ? result.data : c));
        setEditingId(null);
      } else {
        // Create new configuration
        const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            nickname: formData.nickname,
            provider: formData.provider,
            model: formData.model,
            api_key: formData.api_key,
            text_color: formData.text_color,
            background_color: formData.background_color,
            is_enabled: formData.is_enabled,
            system_prompt: formData.system_prompt || null,
            is_active: configurations.length === 0
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Fehler beim Erstellen' }));
          throw new Error(errorData.error || 'Fehler beim Erstellen');
        }

        const result = await response.json();
        setConfigurations([result.data, ...configurations]);
      }

      setShowTermsModal(false);
      setPendingProvider(null);
      setIsAdding(false);
      setFormData({
        nickname: '',
        provider: 'openai',
        model: 'gpt-4',
        api_key: '',
        text_color: '#000000',
        background_color: '#f0f9ff',
        is_enabled: true,
        system_prompt: ''
      });
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Fehler beim Speichern der Konfiguration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diese KI-Konfiguration wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=delete&id=${id}`, {
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

      setConfigurations(configurations.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting configuration:', err);
      setError(err.message || 'Fehler beim Löschen der Konfiguration');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=set-active&id=${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Aktivieren' }));
        throw new Error(errorData.error || 'Fehler beim Aktivieren');
      }

      const result = await response.json();
      
      // Update all configurations: set the active one and deactivate others
      setConfigurations(configurations.map(c => ({
        ...c,
        is_active: c.id === id
      })));
    } catch (err: any) {
      console.error('Error setting active configuration:', err);
      setError(err.message || 'Fehler beim Aktivieren der Konfiguration');
    }
  };

  const handleToggleEnabled = async (id: string, currentState: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=update&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_enabled: !currentState
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Umschalten' }));
        throw new Error(errorData.error || 'Fehler beim Umschalten');
      }

      setConfigurations(configurations.map(c =>
        c.id === id ? { ...c, is_enabled: !currentState } : c
      ));
    } catch (err: any) {
      console.error('Error toggling enabled state:', err);
      setError(err.message || 'Fehler beim Umschalten des Status');
    }
  };

  const handleProviderChange = (provider: AIConfigType['provider']) => {
    const defaultModel = AI_PROVIDERS.find(p => p.id === provider)?.defaultModel || '';
    setFormData({ ...formData, provider, model: defaultModel });
  };

  const handleTestConnection = async (config: AIConfigType) => {
    setTestingConfig(config.id);
    setTestResult(null);

    try {
      const result = await AIService.testConnection(config);
      setTestResult({
        configId: config.id,
        success: result.success,
        message: result.message
      });
    } catch (err: any) {
      setTestResult({
        configId: config.id,
        success: false,
        message: `Test fehlgeschlagen: ${err.message}`
      });
    } finally {
      setTestingConfig(null);
    }
  };

  const handleEdit = (config: AIConfigType) => {
    setEditingId(config.id);
    setFormData({
      nickname: config.nickname,
      provider: config.provider,
      model: config.model,
      api_key: config.api_key,
      text_color: config.text_color,
      background_color: config.background_color,
      is_enabled: config.is_enabled,
      system_prompt: config.system_prompt || ''
    });
    setIsAdding(true);
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      nickname: '',
      provider: 'openai',
      model: 'gpt-4',
      api_key: '',
      text_color: '#000000',
      background_color: '#f0f9ff',
      is_enabled: true,
      system_prompt: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">KI-Konfigurationen</h3>
          <p className="text-sm text-gray-600 mt-1">
            Verwalte deine KI-Integrationen für präzisere Stimmungsanalysen und Prognosen
          </p>
        </div>

        <div>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Neue KI-Konfiguration
            </button>
          )}

          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingId ? 'KI-Konfiguration bearbeiten' : 'Neue KI-Konfiguration'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spitzname *
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Mein GPT-4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider *
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value as AIConfigType['provider'])}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {AI_PROVIDERS.filter(p => enabledProviders.includes(p.id)).map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  {enabledProviders.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Keine Provider verfügbar. Bitte kontaktieren Sie den Administrator.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. gpt-4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Textfarbe
                  </label>
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hintergrundfarbe
                  </label>
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    System Prompt (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPrompt({ ...showPrompt, form: !showPrompt.form })}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Code size={14} />
                    {showPrompt.form ? 'Verstecken' : 'Anzeigen'}
                  </button>
                </div>
                {showPrompt.form && (
                  <textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={6}
                    placeholder="Optionaler benutzerdefinierter System Prompt für diese KI..."
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Leer lassen für Standard-Prompt. Verwende eigenen Prompt für spezielle Analysen.
                </p>
              </div>

              {!editingId && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        KI-Nutzungsbedingungen erforderlich
                      </h4>
                      <p className="text-sm text-blue-800">
                        Bevor Sie diese KI-Konfiguration speichern können, müssen Sie die
                        KI-Nutzungsbedingungen für <strong>{formData.provider}</strong> lesen und akzeptieren.
                        Diese werden nach dem Klick auf "Speichern" angezeigt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Speichern' : 'Weiter zu Nutzungsbedingungen'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Lade Konfigurationen...</div>
          ) : configurations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine KI-Konfigurationen vorhanden
            </div>
          ) : (
            <div className="space-y-4">
              {configurations.map(config => (
                <div
                  key={config.id}
                  className={`border rounded-lg p-4 ${
                    config.is_active ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  style={config.is_active ? {
                    backgroundColor: config.background_color,
                    color: config.text_color
                  } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{config.nickname}</h3>
                        {config.is_active && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            Aktiv
                          </span>
                        )}
                        {!config.is_enabled && (
                          <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                            Deaktiviert
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Provider:</span> {config.provider}
                        </div>
                        <div>
                          <span className="font-medium">Model:</span> {config.model}
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <span className="font-medium">API Key:</span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {showApiKey[config.id]
                              ? config.api_key
                              : '••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => setShowApiKey({
                              ...showApiKey,
                              [config.id]: !showApiKey[config.id]
                            })}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            {showApiKey[config.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestConnection(config)}
                        disabled={testingConfig === config.id}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="API-Verbindung testen"
                      >
                        <Zap size={20} className={testingConfig === config.id ? 'animate-pulse' : ''} />
                      </button>
                      {!config.is_active && (
                        <button
                          onClick={() => handleSetActive(config.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Als aktiv setzen"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(config)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleEnabled(config.id, config.is_enabled)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          config.is_enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {config.is_enabled ? 'Ein' : 'Aus'}
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {testResult && testResult.configId === config.id && (
                    <div className={`mt-3 p-3 rounded-lg border-2 ${
                      testResult.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <Check size={20} className="text-green-600" />
                        ) : (
                          <AlertCircle size={20} className="text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          testResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResult.message}
                        </span>
                      </div>
                    </div>
                  )}

                  {config.system_prompt && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Code size={14} />
                          System Prompt:
                        </span>
                        <button
                          onClick={() => setShowPrompt({
                            ...showPrompt,
                            [config.id]: !showPrompt[config.id]
                          })}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {showPrompt[config.id] ? 'Verstecken' : 'Anzeigen'}
                        </button>
                      </div>
                      {showPrompt[config.id] && (
                        <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                          {config.system_prompt}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AITermsModal
        isOpen={showTermsModal}
        onClose={() => {
          setShowTermsModal(false);
          setPendingProvider(null);
        }}
        onAccept={() => saveConfiguration()}
        provider={pendingProvider || formData.provider}
        userId={userId}
      />
    </div>
  );
}
