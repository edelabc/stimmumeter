import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { apiClient } from '../lib/api-client';

interface LegalPageViewerProps {
  pageType: string;
}

export function LegalPageViewer({ pageType }: LegalPageViewerProps) {
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [pageType]);

  const loadPage = async () => {
    try {
      const response = await apiClient.get<{ title: string; content: string } | null>(
        `/legal-pages.php?action=get&type=${encodeURIComponent(pageType)}`
      );
      setPage(response.data || null);
    } catch (error) {
      console.warn('Fehler beim Laden der Legal Page:', error);
      setPage(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Seite...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seite nicht gefunden</h1>
          <p className="text-gray-600">Diese Seite ist derzeit nicht verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
            {page.title}
          </h1>
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {page.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
