import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface FooterMenuItem {
  id: string;
  title: string;
  url: string;
  category: string;
  linked_agreement_id?: string | null;
  slug?: string | null;
}

interface FooterContent {
  text?: string;
}

interface FooterProps {
  onNavigate?: (url: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [footerContent, setFooterContent] = useState<FooterContent>({
    text: '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
  });
  const [footerMenuItems, setFooterMenuItems] = useState<FooterMenuItem[]>([]);

  useEffect(() => {
    loadFooterSettings();
    loadFooterMenuItems();
  }, []);

  const loadFooterSettings = async () => {
    try {
      const response = await apiClient.get<{ content?: FooterContent } | null>('/footer-settings.php');
      if (response && (response as any).content) {
        setFooterContent((response as any).content);
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Footer-Settings:', error);
    }
  };

  const loadFooterMenuItems = async () => {
    try {
      const response = await apiClient.get<{ data: FooterMenuItem[] }>('/footer-menu-items.php?action=list');
      const items = response?.data || [];
      if (Array.isArray(items)) {
        const itemsWithUrls = items.map((item: FooterMenuItem) => ({
          ...item,
          url: item.linked_agreement_id && item.slug
            ? `/agreement/${item.slug}`
            : item.url
        }));
        setFooterMenuItems(itemsWithUrls);
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Footer-Menu-Items:', error);
    }
  };

  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const groupedItems = footerMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FooterMenuItem[]>);

  const categoryLabels: Record<string, string> = {
    legal: 'Rechtliches',
    company: 'Unternehmen',
    support: 'Support',
    general: 'Links'
  };

  return (
    <div className="relative z-50">
      <footer className="bg-black text-white py-12 mt-auto border-t border-gray-800 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-white font-bold text-lg mb-4">Stimmungs-Tracker</h3>
              <p className="text-sm text-white leading-relaxed">
                Deine persönliche App zur Verfolgung und Analyse deines emotionalen Wohlbefindens.
              </p>
            </div>

            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-white font-semibold mb-4">
                  {categoryLabels[category] || category}
                </h4>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigate(item.url)}
                        className="text-sm text-white hover:text-gray-200 transition-colors"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-white">
            <p>{footerContent.text}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
