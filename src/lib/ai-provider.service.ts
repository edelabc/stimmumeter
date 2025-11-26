/**
 * AI Service für lokale PHP Backend-Kommunikation
 * Ersetzt Supabase-Aufrufe für AI-Provider-Settings und AI-Konfigurationen
 */

import { apiClient } from './api-client';

export interface AIProviderSetting {
  id: string;
  provider: string;
  is_enabled: boolean;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConfiguration {
  id: string;
  user_id: string;
  nickname: string;
  provider: string;
  model: string;
  api_key: string;
  text_color: string;
  background_color: string;
  is_active: boolean;
  is_enabled: boolean;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lädt alle AI-Provider-Settings von der PHP-API
 */
export const getAllAIProviderSettings = async (): Promise<AIProviderSetting[]> => {
  try {
    const response = await apiClient.request('/ai-provider-settings.php');
    return response.data || [];
  } catch (error) {
    console.error('Fehler beim Laden der AI-Provider-Settings:', error);
    throw error;
  }
};

/**
 * Aktualisiert AI-Provider-Settings über die PHP-API
 */
export const updateAIProviderSetting = async (id: string, updates: Partial<AIProviderSetting>): Promise<AIProviderSetting> => {
  try {
    const response = await apiClient.request(`/ai-provider-settings.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der AI-Provider-Settings:', error);
    throw error;
  }
};

/**
 * Lädt AI-Konfigurationen für einen User von der PHP-API
 */
export const getAIConfigurationsByUser = async (userId: string, enabledOnly: boolean = true): Promise<AIConfiguration[]> => {
  try {
    const params = new URLSearchParams({
      action: 'list',
      user_id: userId,
    });
    
    const response = await apiClient.request(`/ai-configurations.php?${params.toString()}`);
    let configs = response.data || [];
    
    // Filter für aktivierte Konfigurationen
    if (enabledOnly) {
      configs = configs.filter((c: AIConfiguration) => c.is_enabled);
    }
    
    return configs;
  } catch (error) {
    console.error('Fehler beim Laden der AI-Konfigurationen:', error);
    throw error;
  }
};
