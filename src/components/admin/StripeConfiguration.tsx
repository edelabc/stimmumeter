import { useState, useEffect } from 'react';
import { Key, Globe, Shield, CheckCircle2, AlertCircle, Save, Eye, EyeOff, Copy, Check, Webhook } from 'lucide-react';
import {
  getPaymentProvider,
  upsertPaymentProvider,
  activatePaymentProvider,
  getProviderWebhooks,
  upsertProviderWebhook,
  validateStripeConnection,
  STRIPE_WEBHOOK_EVENTS,
  type PaymentProvider,
  type PaymentProviderWebhook,
} from '../../lib/payment-providers';
import { encryptValue, decryptValue, maskApiKey, validateStripeKey } from '../../lib/encryption';

export function StripeConfiguration() {
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [webhooks, setWebhooks] = useState<PaymentProviderWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Configuration state
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isTestMode, setIsTestMode] = useState(true);
  const [isActive, setIsActive] = useState(false);

  // UI state
  const [showPublishableKey, setShowPublishableKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);

    const { data: providerData } = await getPaymentProvider('stripe');

    if (providerData) {
      setProvider(providerData);
      setIsTestMode(providerData.is_test_mode);
      setIsActive(providerData.is_active);

      // Decrypt stored keys
      if (providerData.config.publishable_key) {
        setPublishableKey(decryptValue(providerData.config.publishable_key));
      }
      if (providerData.config.secret_key) {
        setSecretKey(decryptValue(providerData.config.secret_key));
      }
      if (providerData.config.app_url) {
        setAppUrl(providerData.config.app_url);
      }

      // Load webhooks
      const { data: webhookData } = await getProviderWebhooks(providerData.id);
      if (webhookData && webhookData.length > 0) {
        const webhook = webhookData[0];
        setWebhooks(webhookData);
        setWebhookSecret(decryptValue(webhook.webhook_secret || ''));
        setWebhookUrl(webhook.webhook_url || '');
        setSelectedEvents(webhook.events || []);
      }
    }

    setLoading(false);
  };

  const handleTestConnection = async () => {
    if (!publishableKey || !secretKey) {
      alert('Bitte geben Sie beide API-Keys ein');
      return;
    }

    setTesting(true);

    // Validate key formats
    if (!validateStripeKey(publishableKey, 'publishable')) {
      alert('Ungültiger Publishable Key Format. Muss mit pk_test_ oder pk_live_ beginnen.');
      setTesting(false);
      return;
    }

    if (!validateStripeKey(secretKey, 'secret')) {
      alert('Ungültiger Secret Key Format. Muss mit sk_test_ oder sk_live_ beginnen.');
      setTesting(false);
      return;
    }

    const isValid = await validateStripeConnection(publishableKey, secretKey);

    if (isValid) {
      alert('✅ Stripe-Verbindung erfolgreich getestet!\n\nDie API-Keys sind gültig und im gleichen Modus (Test/Live).');
    } else {
      alert('❌ Stripe-Verbindung fehlgeschlagen!\n\nBitte stellen Sie sicher, dass beide Keys im gleichen Modus sind (Test oder Live).');
    }

    setTesting(false);
  };

  const handleSave = async () => {
    if (!publishableKey || !secretKey) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Validate keys
    if (!validateStripeKey(publishableKey, 'publishable')) {
      alert('Ungültiger Publishable Key');
      return;
    }

    if (!validateStripeKey(secretKey, 'secret')) {
      alert('Ungültiger Secret Key');
      return;
    }

    setSaving(true);

    // Encrypt keys before storing
    const encryptedConfig = {
      publishable_key: encryptValue(publishableKey),
      secret_key: encryptValue(secretKey),
      app_url: appUrl || '',
      description: 'Stripe payment gateway',
    };

    const { data: savedProvider, error } = await upsertPaymentProvider({
      code: 'stripe',
      name: 'Stripe',
      is_active: isActive,
      is_test_mode: isTestMode,
      config: encryptedConfig,
    });

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
      setSaving(false);
      return;
    }

    // Save webhook if any webhook data is provided
    if (savedProvider && (webhookSecret || webhookUrl || selectedEvents.length > 0)) {
      const webhookData: any = {
        provider_id: savedProvider.id,
        is_active: !!(webhookSecret && webhookUrl && selectedEvents.length > 0),
      };

      // Only include fields that have values
      if (webhookSecret) {
        webhookData.webhook_secret = encryptValue(webhookSecret);
      }
      if (webhookUrl) {
        webhookData.webhook_url = webhookUrl;
      }
      if (selectedEvents.length > 0) {
        webhookData.events = selectedEvents;
      }

      const { error: webhookError } = await upsertProviderWebhook(webhookData);

      if (webhookError) {
        console.error('Webhook save error:', webhookError);
        alert('⚠️ API-Keys gespeichert, aber Webhook-Konfiguration hatte einen Fehler: ' + webhookError.message);
        setSaving(false);
        await loadConfiguration();
        return;
      }
    }

    alert('✅ Stripe-Konfiguration erfolgreich gespeichert!');
    setSaving(false);
    await loadConfiguration();
  };

  const handleToggleActive = async () => {
    if (!provider) return;

    const newStatus = !isActive;
    const { error } = await activatePaymentProvider('stripe', newStatus);

    if (error) {
      alert('Fehler beim Aktivieren: ' + error.message);
    } else {
      setIsActive(newStatus);
      alert(newStatus ? '✅ Stripe aktiviert!' : 'Stripe deaktiviert');
      await loadConfiguration();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Lädt Konfiguration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Stripe Integration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Konfiguriere deine Stripe-Zahlungsabwicklung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? '✅ Aktiv' : 'Inaktiv'}
          </div>
          <button
            onClick={handleToggleActive}
            disabled={!publishableKey || !secretKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isActive ? 'Deaktivieren' : 'Aktivieren'}
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={20} />
          Modus
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsTestMode(true)}
            className={`p-4 border-2 rounded-lg transition-all ${
              isTestMode
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isTestMode ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isTestMode && <Check size={14} className="text-white" />}
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Test-Modus</div>
                <div className="text-xs text-gray-600">Für Entwicklung und Tests</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsTestMode(false)}
            className={`p-4 border-2 rounded-lg transition-all ${
              !isTestMode
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                !isTestMode ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {!isTestMode && <Check size={14} className="text-white" />}
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Live-Modus</div>
                <div className="text-xs text-gray-600">Für echte Zahlungen</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key size={20} />
          API-Keys
        </h4>

        <div className="space-y-4">
          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publishable Key *
              <span className="ml-2 text-xs text-gray-500">
                (pk_{isTestMode ? 'test' : 'live'}_...)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPublishableKey ? 'text' : 'password'}
                value={publishableKey}
                onChange={e => setPublishableKey(e.target.value)}
                placeholder={`pk_${isTestMode ? 'test' : 'live'}_...`}
                className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  onClick={() => setShowPublishableKey(!showPublishableKey)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title={showPublishableKey ? 'Verbergen' : 'Anzeigen'}
                >
                  {showPublishableKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {publishableKey && (
                  <button
                    onClick={() => copyToClipboard(publishableKey, 'publishable')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Kopieren"
                  >
                    {copiedField === 'publishable' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                )}
              </div>
            </div>
            {publishableKey && !validateStripeKey(publishableKey, 'publishable') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Ungültiges Format
              </p>
            )}
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key *
              <span className="ml-2 text-xs text-gray-500">
                (sk_{isTestMode ? 'test' : 'live'}_...)
              </span>
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder={`sk_${isTestMode ? 'test' : 'live'}_...`}
                className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title={showSecretKey ? 'Verbergen' : 'Anzeigen'}
                >
                  {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {secretKey && (
                  <button
                    onClick={() => copyToClipboard(secretKey, 'secret')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Kopieren"
                  >
                    {copiedField === 'secret' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                )}
              </div>
            </div>
            {secretKey && !validateStripeKey(secretKey, 'secret') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Ungültiges Format
              </p>
            )}
          </div>

          <button
            onClick={handleTestConnection}
            disabled={!publishableKey || !secretKey || testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Teste Verbindung...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Verbindung testen
              </>
            )}
          </button>
        </div>
      </div>

      {/* App URL */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={20} />
          App URL (Redirect URLs)
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App URL *
            </label>
            <input
              type="url"
              value={appUrl}
              onChange={e => setAppUrl(e.target.value)}
              placeholder="https://ihre-domain.de"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-600">
              Die URL Ihrer App, zu der Stripe nach erfolgreicher/abgebrochener Zahlung zurückleitet.
              <br />
              <strong>Beispiele:</strong>
              <br />
              • Lokal: <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:5173</code>
              <br />
              • Produktion: <code className="bg-gray-100 px-1 py-0.5 rounded">https://ihre-domain.de</code>
            </p>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Webhook size={20} />
          Webhooks
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={webhookSecret}
                onChange={e => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="w-full px-4 py-3 pr-20 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <button
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-2 top-2 p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                {showWebhookSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/api/webhooks/stripe"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Events ({selectedEvents.length} ausgewählt)
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {STRIPE_WEBHOOK_EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 font-mono">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Sicherheitshinweis</p>
            <p>Ihre API-Keys werden verschlüsselt in der Datenbank gespeichert. Teilen Sie Ihre Secret Keys niemals öffentlich.</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !publishableKey || !secretKey}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Speichert...
            </>
          ) : (
            <>
              <Save size={18} />
              Konfiguration speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}
