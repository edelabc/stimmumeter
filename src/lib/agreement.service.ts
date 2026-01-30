// Umstellung auf MySQL-API
import { apiClient } from './api-client';
import { getAuthHeaders } from './auth-mysql';

// Type Definitions
export interface Vereinbarungstitel {
  id: string;
  titel: string;
  beschreibung: string | null;
  erstellt_von_user_id: string;
  gesperrt: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vereinbarung {
  id: string;
  titel_id: string;
  inhalt: string;
  ersteller_user_id: string;
  empfaenger_user_id: string | null;
  status: 'Entwurf' | 'Unterzeichnet' | 'Archiviert';
  version: number;
  parent_vereinbarung_id: string | null;
  unterzeichnet_am: string | null;
  bearbeiter_von: string | null;
  bearbeiter_an: string | null;
  kurze_zusammenfassung: string | null;
  anlagen: string | null;
  unterzeichnungsdatum_ersteller: string | null;
  unterzeichnungsdatum_empfaenger: string | null;
  gueltigkeit_von: string | null;
  gueltigkeit_bis: string | null;
  kuendigungsfrist_wert: number | null;
  kuendigungsfrist_einheit: 'Tag(e)' | 'Woche(n)' | 'Monat(e)' | 'Jahre' | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  titel?: Vereinbarungstitel;
  ersteller?: { id: string; email: string; raw_user_meta_data?: any };
  empfaenger?: { id: string; email: string; raw_user_meta_data?: any };
}

export interface VereinbarungsLog {
  id: string;
  vereinbarung_id: string;
  user_id: string;
  aktion: string;
  details: any | null;
  created_at: string;
  user?: { id: string; email: string; raw_user_meta_data?: any };
}

export interface PlatzhalterDefinition {
  id: string;
  platzhalter_schluessel: string;
  beschreibung: string;
  quell_tabelle: string;
  quell_spalte: string;
  zulaessige_rollen: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAgreementData {
  titel_id: string;
  inhalt: string;
  empfaenger_user_id?: string | null;
  bearbeiter_von?: string | null;
  bearbeiter_an?: string | null;
  kurze_zusammenfassung?: string | null;
  anlagen?: string | null;
  gueltigkeit_von?: string | null;
  gueltigkeit_bis?: string | null;
  kuendigungsfrist_wert?: number | null;
  kuendigungsfrist_einheit?: 'Tag(e)' | 'Woche(n)' | 'Monat(e)' | 'Jahre' | null;
}

export interface UpdateAgreementData extends Partial<CreateAgreementData> {
  status?: 'Entwurf' | 'Unterzeichnet' | 'Archiviert';
}

// Service Functions

/**
 * Get all agreement titles
 */
export async function getAllAgreementTitles(): Promise<Vereinbarungstitel[]> {
  try {
    const response = await apiClient.get('/agreements.php?action=titles');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error loading agreement titles:', error);
    return [];
  }
}

/**
 * Get agreement title by ID
 */
export async function getAgreementTitleById(id: string): Promise<Vereinbarungstitel | null> {
  try {
    const response = await apiClient.get(`/agreements.php?action=titles`);
    if (response.success && response.data) {
      const title = response.data.find((t: Vereinbarungstitel) => t.id === id);
      return title || null;
    }
    return null;
  } catch (error) {
    console.error('Error loading agreement title by ID:', error);
    return null;
  }
}

/**
 * Create agreement title
 */
export async function createAgreementTitle(
  titel: string,
  beschreibung?: string
): Promise<Vereinbarungstitel> {
  try {
    const response = await apiClient.post('/agreements.php?action=createTitle', {
      titel,
      beschreibung: beschreibung || null,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Erstellen des Titels');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update agreement title
 */
export async function updateAgreementTitle(
  id: string,
  updates: { titel?: string; beschreibung?: string; gesperrt?: boolean }
): Promise<Vereinbarungstitel> {
  try {
    const response = await apiClient.post('/agreements.php?action=updateTitle', {
      id,
      ...updates,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Aktualisieren des Titels');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Toggle agreement title lock
 */
export async function toggleAgreementTitleLock(
  id: string,
  gesperrt: boolean
): Promise<Vereinbarungstitel> {
  return updateAgreementTitle(id, { gesperrt });
}

/**
 * Delete agreement title
 */
export async function deleteAgreementTitle(id: string): Promise<void> {
  try {
    const response = await apiClient.post('/agreements.php?action=deleteTitle', {
      id,
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Fehler beim Löschen des Titels');
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get all agreements (for admin)
 */
export async function getAllAgreements(): Promise<Vereinbarung[]> {
  try {
    const response = await apiClient.get('/agreements.php?action=list');
    if (response.success && response.data) {
      // API gibt bereits titel_name zurück, mappen wir auf titel-Objekt
      return response.data.map((agreement: any) => ({
        ...agreement,
        titel: agreement.titel_name ? {
          id: agreement.titel_id,
          titel: agreement.titel_name,
          beschreibung: agreement.titel_beschreibung,
        } : undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading agreements:', error);
    return [];
  }
}

/**
 * Get agreement by ID with placeholder replacement
 */
export async function getAgreementById(id: string, replacePlaceholders: boolean = true): Promise<Vereinbarung | null> {
  try {
    const response = await apiClient.get(`/agreements.php?action=get&id=${id}`);
    if (response.success && response.data) {
      const data = response.data;
      
      // Mappe titel_name auf titel-Objekt
      const agreementWithUsers = {
        ...data,
        titel: data.titel_name ? {
          id: data.titel_id,
          titel: data.titel_name,
          beschreibung: data.titel_beschreibung,
        } : undefined,
      };

      // Replace placeholders if requested
      if (replacePlaceholders) {
        agreementWithUsers.inhalt = await replacePlaceholdersInContent(agreementWithUsers.inhalt, agreementWithUsers);
      }

      return agreementWithUsers;
    }
    return null;
  } catch (error) {
    console.error('Error loading agreement by ID:', error);
    return null;
  }
}

/**
 * Get agreement by slug (directly from agreement or from menu_items/footer_menu_items)
 */
export async function getAgreementBySlug(slug: string): Promise<Vereinbarung | null> {
  try {
    const response = await apiClient.get(`/agreements.php?action=getBySlug&slug=${encodeURIComponent(slug)}`);
    if (response.success && response.data) {
      const data = response.data;
      
      // Mappe titel_name auf titel-Objekt
      const agreementWithUsers = {
        ...data,
        titel: data.titel_name ? {
          id: data.titel_id,
          titel: data.titel_name,
          beschreibung: data.titel_beschreibung,
        } : undefined,
      };

      // Replace placeholders
      agreementWithUsers.inhalt = await replacePlaceholdersInContent(agreementWithUsers.inhalt, agreementWithUsers);

      return agreementWithUsers;
    }
    return null;
  } catch (error) {
    console.error('Error loading agreement by slug:', error);
    return null;
  }
}

/**
 * Create agreement
 */
export async function createAgreement(
  agreementData: CreateAgreementData
): Promise<Vereinbarung> {
  try {
    const response = await apiClient.post('/agreements.php?action=create', agreementData);
    if (response.success && response.data) {
      // Log creation (optional, kann später implementiert werden)
      // await logAgreementAction(response.data.id, 'ERSTELLT', {});
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Erstellen');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update agreement
 */
export async function updateAgreement(
  id: string,
  updates: UpdateAgreementData
): Promise<Vereinbarung> {
  try {
    const response = await apiClient.post(`/agreements.php?id=${id}`, { ...updates, id });
    if (response.success && response.data) {
      // Log update (optional)
      // await logAgreementAction(id, 'AKTUALISIERT', updates);
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Aktualisieren');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete agreement
 */
export async function deleteAgreement(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/agreements.php?id=${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Fehler beim Löschen');
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * Create new version of agreement
 */
export async function createAgreementVersion(
  id: string,
  updates?: Partial<CreateAgreementData>
): Promise<Vereinbarung> {
  try {
    const response = await apiClient.post('/agreements.php?action=createVersion', {
      id,
      ...updates,
    });
    
    if (response.success && response.data) {
      // Mappe titel_name auf titel-Objekt
      const agreementWithUsers = {
        ...response.data,
        titel: response.data.titel_name ? {
          id: response.data.titel_id,
          titel: response.data.titel_name,
          beschreibung: response.data.titel_beschreibung,
        } : undefined,
      };
      
      return agreementWithUsers;
    }
    throw new Error(response.error || 'Fehler beim Erstellen der neuen Version');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get version history for agreement
 */
export async function getAgreementVersionHistory(id: string): Promise<Array<{ id: string; version: number; status: string; created_at: string }>> {
  try {
    const response = await apiClient.get(`/agreements.php?action=versionHistory&id=${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Laden der Versionshistorie');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get agreement logs
 */
export async function getAgreementLogs(id: string): Promise<VereinbarungsLog[]> {
  try {
    const response = await apiClient.get(`/agreements.php?action=logs&id=${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Laden der Logs');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Log agreement action
 */
export async function logAgreementAction(
  vereinbarungId: string,
  aktion: string,
  details?: any
): Promise<void> {
  try {
    const response = await apiClient.post('/agreements.php?action=logAction', {
      vereinbarung_id: vereinbarungId,
      aktion,
      details: details || null,
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Fehler beim Speichern des Logs');
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get all placeholder definitions
 */
export async function getAllPlaceholderDefinitions(): Promise<PlatzhalterDefinition[]> {
  try {
    const response = await apiClient.get('/agreements.php?action=placeholderDefinitions');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Fehler beim Laden der Platzhalter-Definitionen');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Replace placeholders in content
 */
export async function replacePlaceholdersInContent(
  content: string,
  agreement: Vereinbarung | { ersteller?: { email?: string }; empfaenger?: { email?: string } }
): Promise<string> {
  // Get all placeholder definitions
  const definitions = await getAllPlaceholderDefinitions();

  // Find all placeholders in content
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches = [...content.matchAll(placeholderRegex)];

  if (matches.length === 0) return content;

  // Replace each placeholder
  let result = content;
  for (const match of matches) {
    const fullMatch = match[0]; // e.g., "{{ersteller.username}}"
    const key = match[1].trim(); // e.g., "ersteller.username"

    // Find definition
    const definition = definitions.find(
      d => d.platzhalter_schluessel === fullMatch
    );

    if (!definition) {
      result = result.replace(fullMatch, `[FEHLER: Platzhalter ${fullMatch} nicht gefunden]`);
      continue;
    }

    // Extract context and field
    const [context, field] = key.split('.');
    let value = '';

    // Get value based on context
    if (context === 'ersteller' && agreement.ersteller) {
      // Map common fields
      if (field === 'username' || field === 'email') {
        value = agreement.ersteller.email || '';
      } else {
        value = getNestedValue(agreement.ersteller, field) || '';
      }
    } else if (context === 'empfaenger' && agreement.empfaenger) {
      // Map common fields
      if (field === 'username' || field === 'email') {
        value = agreement.empfaenger.email || '';
      } else {
        value = getNestedValue(agreement.empfaenger, field) || '';
      }
    } else if (context === 'datum') {
      value = getDateValue(field);
    }

    if (!value) {
      value = `[FEHLER: Wert für ${fullMatch} nicht gefunden]`;
    }

    // Replace all occurrences
    result = result.replace(new RegExp(fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Helper: Get nested value from object
 */
function getNestedValue(obj: any, path: string): string | null {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }

  return current ? String(current) : null;
}

/**
 * Helper: Get date value
 */
function getDateValue(field: string): string {
  const now = new Date();
  
  switch (field) {
    case 'heute':
      return now.toLocaleDateString('de-DE');
    case 'jahr':
      return now.getFullYear().toString();
    default:
      return '';
  }
}

/**
 * Generate PDF from agreement (client-side)
 * Note: This requires html2pdf.js library
 */
export async function generateAgreementPdf(_agreement: Vereinbarung): Promise<Blob> {
  // This will be implemented using html2pdf.js in the component
  // For now, return empty blob - implementation in DocumentViewer component
  throw new Error('PDF generation should be handled in component using html2pdf.js');
}

