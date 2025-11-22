import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export function SEO({ title, description, keywords }: SEOProps) {
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'Stimmungs-Tracker',
    site_description: 'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden',
    meta_keywords: 'Stimmung, Tracker, Mental Health, Wohlbefinden'
  });

  useEffect(() => {
    loadSiteSettings();
  }, []);

  useEffect(() => {
    updateMetaTags();
  }, [title, description, keywords, siteSettings]);

  const loadSiteSettings = async () => {
    if (!supabase || !isSupabaseConfigured()) return; // Supabase nicht verfügbar
    
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (data) setSiteSettings(data);
    } catch (error) {
      console.warn('Fehler beim Laden der Site-Settings:', error);
    }
  };

  const updateMetaTags = () => {
    const finalTitle = title ? `${title} | ${siteSettings.site_name}` : siteSettings.site_name;
    const finalDescription = description || siteSettings.site_description;
    const finalKeywords = keywords || siteSettings.meta_keywords;

    document.title = finalTitle;

    updateMetaTag('name', 'description', finalDescription);
    updateMetaTag('name', 'keywords', finalKeywords);

    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDescription);
    updateMetaTag('property', 'og:type', 'website');

    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDescription);
  };

  const updateMetaTag = (attribute: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${key}"]`);

    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }

    element.setAttribute('content', content);
  };

  return null;
}
