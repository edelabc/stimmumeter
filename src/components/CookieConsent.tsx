import { useState, useEffect } from 'react';
import { X, Settings, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/api-client';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentProps {
  onNavigate?: (url: string) => void;
}

export function CookieConsent({ onNavigate }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [_agreementContent, setAgreementContent] = useState<string>('');
  const [agreementVersion, setAgreementVersion] = useState<number>(1);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    checkConsent();
    loadAgreement();
  }, []);

  const checkConsent = () => {
    const consent = sessionStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  };

  const loadAgreement = async () => {
    try {
      const response = await apiClient.get<{ inhalt: string; version: number } | null>(
        '/agreements.php?action=getByTitle&title=Cookie-Einstellungen'
      );
      if (response.data) {
        setAgreementContent(response.data.inhalt || '');
        setAgreementVersion(response.data.version || 1);
      }
    } catch (error) {
      console.warn('⚠️ Fehler beim Laden der Cookie-Vereinbarung:', error);
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const consentData = {
      ...prefs,
      version: agreementVersion,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem('cookieConsent', JSON.stringify(consentData));
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleViewDetails = () => {
    if (onNavigate) {
      onNavigate('/agreement/cookie-einstellungen');
    } else {
      window.location.href = '/agreement/cookie-einstellungen';
    }
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
          {!showSettings ? (
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Cookie-Einstellungen
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Wir respektieren Ihre Privatsphäre
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                Wir verwenden Cookies und ähnliche Technologien, um Ihnen ein optimales
                Nutzererlebnis zu bieten. Einige Cookies sind für den Betrieb der Webseite
                technisch notwendig, während andere uns helfen, diese Webseite und Ihre
                Erfahrung zu verbessern.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Rechtliche Grundlage:</strong> Diese Cookie-Einwilligung entspricht
                  den Anforderungen der DSGVO (EU) 2016/679 und des TTDSG. Sie können Ihre
                  Einwilligung jederzeit widerrufen oder ändern.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Alle akzeptieren
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Personalisieren
                </button>

                <button
                  onClick={handleRejectNonEssential}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-colors"
                >
                  Nur notwendige
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={handleViewDetails}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Detaillierte Cookie-Informationen anzeigen
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Cookie-Einstellungen anpassen
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-not-allowed"
                      />
                      <h3 className="font-semibold text-gray-900">
                        Notwendige Cookies
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      ERFORDERLICH
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Diese Cookies sind für die grundlegende Funktionalität der Webseite
                    unerlässlich und können nicht deaktiviert werden.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <h3 className="font-semibold text-gray-900">
                        Funktionale Cookies
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Ermöglichen erweiterte Funktionalität und Personalisierung, wie z.B.
                    Spracheinstellungen und UI-Präferenzen.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <h3 className="font-semibold text-gray-900">
                        Analyse-Cookies
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Helfen uns zu verstehen, wie Besucher mit der Webseite interagieren,
                    um die Benutzererfahrung zu verbessern.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <h3 className="font-semibold text-gray-900">
                        Marketing-Cookies
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Werden verwendet, um relevante Werbung anzuzeigen und die
                    Effektivität unserer Marketingkampagnen zu messen.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-900">
                  <strong>Hinweis:</strong> Sie können Ihre Einstellungen jederzeit ändern.
                  Die Ablehnung bestimmter Cookies kann die Funktionalität der Webseite
                  beeinträchtigen.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Auswahl speichern
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Alle akzeptieren
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={handleViewDetails}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Detaillierte Cookie-Informationen anzeigen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
