/**
 * Menu Service für lokale PHP Backend-Kommunikation
 * Ersetzt Supabase-Aufrufe für Menu-Items
 */

import { apiClient } from './api-client';

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  required_role: 'public' | 'user' | 'admin';
  linked_agreement_id?: string | null;
  slug?: string | null;
  icon?: string | null;
}

export interface FooterMenuItem {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  category: string;
  linked_agreement_id?: string | null;
  slug?: string | null;
}

export interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  is_active: boolean;
}

export interface FooterLink {
  title: string;
  url: string;
}

export interface FooterContent {
  text: string;
  links: FooterLink[];
}

export interface FooterSettings {
  id: string;
  content: FooterContent;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lädt alle Menu-Items von der PHP-API
 */
export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await apiClient.request('/menu-items.php?action=list');
    return response.data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Menu-Items:', error);
    throw error;
  }
};

/**
 * Erstellt ein neues Menu-Item über die PHP-API
 */
export const createMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
  try {
    const response = await apiClient.request('/menu-items.php', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Menu-Items:', error);
    throw error;
  }
};

/**
 * Aktualisiert ein Menu-Item über die PHP-API
 */
export const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<MenuItem> => {
  try {
    const response = await apiClient.request(`/menu-items.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Menu-Items:', error);
    throw error;
  }
};

/**
 * Löscht ein Menu-Item über die PHP-API
 */
export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    await apiClient.request(`/menu-items.php?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Menu-Items:', error);
    throw error;
  }
};

/**
 * Lädt alle Footer-Menu-Items von der PHP-API
 */
export const getAllFooterMenuItems = async (): Promise<FooterMenuItem[]> => {
  try {
    const response = await apiClient.request('/footer-menu-items.php?action=list');
    return response.data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Footer-Menu-Items:', error);
    throw error;
  }
};

/**
 * Erstellt ein neues Footer-Menu-Item über die PHP-API
 */
export const createFooterMenuItem = async (item: Omit<FooterMenuItem, 'id'>): Promise<FooterMenuItem> => {
  try {
    const response = await apiClient.request('/footer-menu-items.php', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Footer-Menu-Items:', error);
    throw error;
  }
};

/**
 * Aktualisiert ein Footer-Menu-Item über die PHP-API
 */
export const updateFooterMenuItem = async (id: string, item: Partial<FooterMenuItem>): Promise<FooterMenuItem> => {
  try {
    const response = await apiClient.request(`/footer-menu-items.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Footer-Menu-Items:', error);
    throw error;
  }
};

/**
 * Löscht ein Footer-Menu-Item über die PHP-API
 */
export const deleteFooterMenuItem = async (id: string): Promise<void> => {
  try {
    await apiClient.request(`/footer-menu-items.php?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Footer-Menu-Items:', error);
    throw error;
  }
};

/**
 * Lädt alle Legal Pages von der PHP-API
 */
export const getAllLegalPages = async (): Promise<LegalPage[]> => {
  try {
    const response = await apiClient.request('/legal-pages.php?action=list');
    return response.data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Legal Pages:', error);
    throw error;
  }
};

/**
 * Aktualisiert eine Legal Page über die PHP-API
 */
export const updateLegalPage = async (id: string, page: Partial<LegalPage>): Promise<LegalPage> => {
  try {
    const response = await apiClient.request(`/legal-pages.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(page),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Legal Page:', error);
    throw error;
  }
};

/**
 * Lädt Footer-Einstellungen von der PHP-API
 */
export const getFooterSettings = async (): Promise<FooterSettings> => {
  try {
    const response = await apiClient.request('/footer-settings.php');
    return response.data;
  } catch (error) {
    console.error('Fehler beim Laden der Footer-Einstellungen:', error);
    throw error;
  }
};

/**
 * Aktualisiert Footer-Einstellungen über die PHP-API
 */
export const updateFooterSettings = async (content: FooterContent): Promise<FooterSettings> => {
  try {
    const response = await apiClient.request('/footer-settings.php', {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Footer-Einstellungen:', error);
    throw error;
  }
};
