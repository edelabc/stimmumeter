import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
}

interface FooterContent {
  text?: string;
  links?: Array<{ title: string; url: string }>;
}

interface FooterProps {
  onNavigate?: (url: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [footerContent, setFooterContent] = useState<FooterContent>({
    text: '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
    links: []
  });
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);

  useEffect(() => {
    loadFooterSettings();
    loadLegalPages();
  }, []);

  const loadFooterSettings = async () => {
    const { data } = await supabase
      .from('footer_settings')
      .select('content')
      .single();

    if (data?.content) {
      setFooterContent(data.content as FooterContent);
    }
  };

  const loadLegalPages = async () => {
    const { data } = await supabase
      .from('legal_pages')
      .select('id, page_type, title')
      .eq('is_active', true);

    if (data) setLegalPages(data);
  };

  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Stimmungs-Tracker</h3>
            <p className="text-sm leading-relaxed">
              Deine persönliche App zur Verfolgung und Analyse deines emotionalen Wohlbefindens.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2">
              {legalPages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => handleNavigate(`/legal/${page.page_type}`)}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {page.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Links</h4>
            <ul className="space-y-2">
              {footerContent.links?.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigate(link.url)}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{footerContent.text}</p>
        </div>
      </div>
    </footer>
  );
}
