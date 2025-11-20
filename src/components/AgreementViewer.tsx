import { useEffect, useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { getAgreementBySlug, Vereinbarung } from '../lib/agreement.service';
import DOMPurify from 'isomorphic-dompurify';

interface AgreementViewerProps {
  slug: string;
}

export function AgreementViewer({ slug }: AgreementViewerProps) {
  const [agreement, setAgreement] = useState<Vereinbarung | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgreement();
  }, [slug]);

  const formatContent = (content: string): string => {
    // Check if content already contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return content;
    }

    // Convert plain text to formatted HTML
    let formatted = content;

    // Convert multiple newlines to paragraph breaks
    formatted = formatted.split('\n\n').map(para => {
      if (!para.trim()) return '';

      // Check for heading patterns (lines ending with : or starting with ##)
      if (para.trim().match(/^#+\s/)) {
        const level = para.match(/^(#+)/)?.[1].length || 2;
        const text = para.replace(/^#+\s/, '').trim();
        return `<h${Math.min(level, 6)} class="font-bold text-gray-900 mt-6 mb-3">${text}</h${Math.min(level, 6)}>`;
      }

      // Bold text with **text** or __text__
      para = para.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      para = para.replace(/__([^_]+)__/g, '<strong>$1</strong>');

      // Italic text with *text* or _text_
      para = para.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      para = para.replace(/_([^_]+)_/g, '<em>$1</em>');

      // Line breaks
      para = para.replace(/\n/g, '<br>');

      // Detect lists
      if (para.match(/^[\s]*[-*•]\s/m)) {
        const items = para.split(/\n/).filter(line => line.trim());
        const listItems = items.map(item => {
          const cleaned = item.replace(/^[\s]*[-*•]\s/, '').trim();
          return `<li>${cleaned}</li>`;
        }).join('');
        return `<ul class="list-disc pl-6 my-4">${listItems}</ul>`;
      }

      // Numbered lists
      if (para.match(/^[\s]*\d+\.\s/m)) {
        const items = para.split(/\n/).filter(line => line.trim());
        const listItems = items.map(item => {
          const cleaned = item.replace(/^[\s]*\d+\.\s/, '').trim();
          return `<li>${cleaned}</li>`;
        }).join('');
        return `<ol class="list-decimal pl-6 my-4">${listItems}</ol>`;
      }

      return `<p class="mb-4 leading-relaxed">${para}</p>`;
    }).join('\n');

    return formatted;
  };

  const loadAgreement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAgreementBySlug(slug);

      if (!data) {
        setError('Dokument nicht gefunden');
        return;
      }

      setAgreement(data);
    } catch (err: any) {
      console.error('Error loading agreement:', err);
      setError('Fehler beim Laden des Dokuments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!agreement) return;

    const element = document.getElementById('agreement-content');
    if (!element) return;

    const opt = {
      margin: 1,
      filename: `${agreement.titel?.titel || 'dokument'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Fehler beim Erstellen des PDFs');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dokument wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Dokument nicht gefunden'}
          </h2>
          <p className="text-gray-600 mb-6">
            Das angeforderte Dokument konnte nicht geladen werden.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">
                    {agreement.titel?.titel || 'Dokument'}
                  </h1>
                </div>

                {agreement.titel?.beschreibung && (
                  <p className="text-blue-100 text-lg">
                    {agreement.titel.beschreibung}
                  </p>
                )}
              </div>

              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-lg"
              >
                <Download className="w-5 h-5" />
                Als PDF
              </button>
            </div>

            {(agreement.gueltigkeit_von || agreement.gueltigkeit_bis) && (
              <div className="mt-6 flex items-center gap-2 text-blue-100">
                <Calendar className="w-5 h-5" />
                <span>
                  Gültig {agreement.gueltigkeit_von && `ab ${formatDate(agreement.gueltigkeit_von)}`}
                  {agreement.gueltigkeit_bis && ` bis ${formatDate(agreement.gueltigkeit_bis)}`}
                </span>
              </div>
            )}
          </div>

          <div className="px-8 py-10">
            <div
              id="agreement-content"
              className="prose prose-lg prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-gray-700 prose-li:mb-2
                prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
                prose-table:w-full prose-table:border-collapse
                prose-th:bg-gray-100 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                prose-td:border prose-td:border-gray-300 prose-td:p-3"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(formatContent(agreement.inhalt), {
                  ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'table', 'thead',
                    'tbody', 'tr', 'th', 'td', 'hr', 'pre', 'code'
                  ],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id']
                })
              }}
            />

            {agreement.anlagen && (
              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Anlagen
                </h3>
                <p className="text-gray-700">{agreement.anlagen}</p>
              </div>
            )}

            {agreement.kuendigungsfrist_wert && agreement.kuendigungsfrist_einheit && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Kündigungsfrist:</span>{' '}
                  {agreement.kuendigungsfrist_wert} {agreement.kuendigungsfrist_einheit}
                </p>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Stand: {formatDate(agreement.updated_at)} | Version {agreement.version}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );
}

