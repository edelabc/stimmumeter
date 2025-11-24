import { useState, useEffect } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { getAgreementBySlug, Vereinbarung } from '../lib/agreement.service';
import DOMPurify from 'dompurify';

interface DocumentViewerProps {
  slug: string;
}

export function DocumentViewer({ slug }: DocumentViewerProps) {
  const [agreement, setAgreement] = useState<Vereinbarung | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgreement();
  }, [slug]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAgreementBySlug(slug);
      if (!data) {
        setError('Dokument nicht gefunden');
      } else {
        setAgreement(data);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!agreement) return;

    try {
      // Use html2pdf.js for client-side PDF generation
      // Statischer Import für bessere Vite-Kompatibilität
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const element = document.getElementById('agreement-content');
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${agreement.titel?.titel || 'dokument'}_v${agreement.version}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      if (typeof html2pdf === 'function') {
        await html2pdf().set(opt).from(element).save();
      } else if (html2pdf && typeof html2pdf.set === 'function') {
        await html2pdf.set(opt).from(element).save();
      } else {
        throw new Error('html2pdf.js konnte nicht korrekt geladen werden');
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('Fehler beim Generieren der PDF. Bitte stellen Sie sicher, dass html2pdf.js installiert ist.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Dokument...</p>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dokument nicht gefunden</h1>
          <p className="text-gray-600">{error || 'Das angeforderte Dokument konnte nicht geladen werden.'}</p>
        </div>
      </div>
    );
  }

  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(agreement.inhalt, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'class'],
  });

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {agreement.titel?.titel || 'Unbekannter Titel'}
              </h1>
              {agreement.kurze_zusammenfassung && (
                <p className="text-gray-600 text-lg mb-4">{agreement.kurze_zusammenfassung}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>Version {agreement.version}</span>
                {agreement.gueltigkeit_von && (
                  <span>
                    Gültig ab: {new Date(agreement.gueltigkeit_von).toLocaleDateString('de-DE')}
                  </span>
                )}
                {agreement.gueltigkeit_bis && (
                  <span>
                    Gültig bis: {new Date(agreement.gueltigkeit_bis).toLocaleDateString('de-DE')}
                  </span>
                )}
                {agreement.kuendigungsfrist_wert && agreement.kuendigungsfrist_einheit && (
                  <span>
                    Kündigungsfrist: {agreement.kuendigungsfrist_wert} {agreement.kuendigungsfrist_einheit}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              PDF herunterladen
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div
            id="agreement-content"
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>

        {/* Anlagen */}
        {agreement.anlagen && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Anlagen</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{agreement.anlagen}</div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Erstellt am: {new Date(agreement.created_at).toLocaleDateString('de-DE')}
            {agreement.updated_at && agreement.updated_at !== agreement.created_at && (
              <> • Aktualisiert am: {new Date(agreement.updated_at).toLocaleDateString('de-DE')}</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

