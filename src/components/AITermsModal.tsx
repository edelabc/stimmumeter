import { useState, useEffect } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getApiBaseUrl } from '../lib/api-client';

interface AITermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  provider: string;
  userId: string;
}

export function AITermsModal({ isOpen, onClose, onAccept, provider, userId }: AITermsModalProps) {
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTerms();
      checkAcceptance();
    }
  }, [isOpen, provider, userId]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/legal-pages.php?action=get&page_type=ai-terms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data?.content) {
        const rawHtml = await marked(result.data.content);
        const sanitized = DOMPurify.sanitize(rawHtml);
        setTermsContent(sanitized);
      } else {
        setTermsContent('<p>Keine Nutzungsbedingungen verfügbar.</p>');
      }
    } catch (err) {
      console.error('Error loading AI terms:', err);
      setTermsContent('<p>Fehler beim Laden der Nutzungsbedingungen.</p>');
    } finally {
      setLoading(false);
      // Prüfe nach dem Laden, ob Content scrollbar ist
      setTimeout(() => checkIfScrollable(), 100);
    }
  };

  const checkIfScrollable = () => {
    const element = document.querySelector('[data-terms-content]');
    if (element) {
      const isScrollable = element.scrollHeight > element.clientHeight;
      // Wenn nicht scrollbar, erlaube sofort das Akzeptieren
      if (!isScrollable) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const checkAcceptance = async () => {
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
        return;
      }

      const result = await response.json();
      setHasAccepted(result.data?.accepted === true);
    } catch (err) {
      console.error('Error checking acceptance:', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/ai-configurations.php?action=accept-terms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          terms_version: '1.0'
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data?.accepted) {
        setHasAccepted(true);
        onAccept();
      }
    } catch (err) {
      console.error('Error accepting terms:', err);
    }
  };

  if (!isOpen) return null;

  if (hasAccepted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bereits akzeptiert</h2>
            <p className="text-gray-600 mb-6">
              Sie haben die KI-Nutzungsbedingungen für {provider} bereits akzeptiert.
            </p>
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fortfahren
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">KI-Nutzungsbedingungen</h2>
              <p className="text-sm text-gray-600">Provider: {provider}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll} data-terms-content>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Lade Nutzungsbedingungen...</p>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: termsContent }}
            />
          )}
        </div>

        <div className="border-t p-6 flex-shrink-0 bg-gray-50">
          {!hasScrolledToBottom && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-sm">
                Bitte scrollen Sie nach unten und lesen Sie die gesamten Nutzungsbedingungen.
              </span>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasScrolledToBottom
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Akzeptieren und fortfahren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
