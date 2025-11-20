import { supabase } from './supabase';

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
  const { data, error } = await supabase
    .from('t_vereinbarungstitel')
    .select('*')
    .order('titel');

  if (error) throw error;
  return data || [];
}

/**
 * Get agreement title by ID
 */
export async function getAgreementTitleById(id: string): Promise<Vereinbarungstitel | null> {
  const { data, error } = await supabase
    .from('t_vereinbarungstitel')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create agreement title
 */
export async function createAgreementTitle(
  titel: string,
  beschreibung?: string
): Promise<Vereinbarungstitel> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('t_vereinbarungstitel')
    .insert({
      titel,
      beschreibung: beschreibung || null,
      erstellt_von_user_id: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update agreement title
 */
export async function updateAgreementTitle(
  id: string,
  updates: { titel?: string; beschreibung?: string; gesperrt?: boolean }
): Promise<Vereinbarungstitel> {
  const { data, error } = await supabase
    .from('t_vereinbarungstitel')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
  const { error } = await supabase
    .from('t_vereinbarungstitel')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get all agreements (for admin)
 */
export async function getAllAgreements(): Promise<Vereinbarung[]> {
  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .select(`
      *,
      titel:t_vereinbarungstitel(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Load user data from user_profiles table
  const userIds = new Set<string>();
  (data || []).forEach((agreement) => {
    if (agreement.ersteller_user_id) userIds.add(agreement.ersteller_user_id);
    if (agreement.empfaenger_user_id) userIds.add(agreement.empfaenger_user_id);
  });

  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('id, email')
    .in('id', Array.from(userIds));

  const userMap = new Map((userProfiles || []).map((u) => [u.id, u]));

  return (data || []).map((agreement) => ({
    ...agreement,
    ersteller: agreement.ersteller_user_id
      ? {
          id: agreement.ersteller_user_id,
          email: userMap.get(agreement.ersteller_user_id)?.email || '',
          raw_user_meta_data: {},
        }
      : undefined,
    empfaenger: agreement.empfaenger_user_id
      ? {
          id: agreement.empfaenger_user_id,
          email: userMap.get(agreement.empfaenger_user_id)?.email || '',
          raw_user_meta_data: {},
        }
      : undefined,
  }));
}

/**
 * Get agreement by ID with placeholder replacement
 */
export async function getAgreementById(id: string, replacePlaceholders: boolean = true): Promise<Vereinbarung | null> {
  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .select(`
      *,
      titel:t_vereinbarungstitel(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Load user data from user_profiles table
  const userIds: string[] = [];
  if (data.ersteller_user_id) userIds.push(data.ersteller_user_id);
  if (data.empfaenger_user_id) userIds.push(data.empfaenger_user_id);

  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('id, email')
    .in('id', userIds);

  const userMap = new Map((userProfiles || []).map((u) => [u.id, u]));

  const ersteller = data.ersteller_user_id
    ? {
        id: data.ersteller_user_id,
        email: userMap.get(data.ersteller_user_id)?.email || '',
        raw_user_meta_data: {},
      }
    : undefined;

  const empfaenger = data.empfaenger_user_id
    ? {
        id: data.empfaenger_user_id,
        email: userMap.get(data.empfaenger_user_id)?.email || '',
        raw_user_meta_data: {},
      }
    : undefined;

  const agreementWithUsers = {
    ...data,
    ersteller,
    empfaenger,
  };

  // Replace placeholders if requested
  if (replacePlaceholders) {
    agreementWithUsers.inhalt = await replacePlaceholdersInContent(agreementWithUsers.inhalt, agreementWithUsers);
  }

  return agreementWithUsers;
}

/**
 * Get agreement by slug (from menu_items)
 */
export async function getAgreementBySlug(slug: string): Promise<Vereinbarung | null> {
  // First find menu item with this slug
  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('linked_agreement_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (menuError) throw menuError;
  if (!menuItem || !menuItem.linked_agreement_id) return null;

  // Get the agreement
  return getAgreementById(menuItem.linked_agreement_id, true);
}

/**
 * Create agreement
 */
export async function createAgreement(
  agreementData: CreateAgreementData
): Promise<Vereinbarung> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .insert({
      ...agreementData,
      ersteller_user_id: user.user.id,
      empfaenger_user_id: agreementData.empfaenger_user_id || null,
    })
    .select(`
      *,
      titel:t_vereinbarungstitel(*)
    `)
    .single();

  if (error) throw error;

  // Log creation
  await logAgreementAction(data.id, 'ERSTELLT', {});

  return data;
}

/**
 * Update agreement
 */
export async function updateAgreement(
  id: string,
  updates: UpdateAgreementData
): Promise<Vereinbarung> {
  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      titel:t_vereinbarungstitel(*)
    `)
    .single();

  if (error) throw error;

  // Log update
  await logAgreementAction(id, 'AKTUALISIERT', updates);

  return data;
}

/**
 * Delete agreement
 */
export async function deleteAgreement(id: string): Promise<void> {
  const { error } = await supabase
    .from('t_vereinbarungen')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Create new version of agreement
 */
export async function createAgreementVersion(
  id: string,
  updates?: Partial<CreateAgreementData>
): Promise<Vereinbarung> {
  // Get original agreement
  const original = await getAgreementById(id, false);
  if (!original) throw new Error('Agreement not found');

  // Determine parent ID (use original's parent or original itself)
  const parentId = original.parent_vereinbarung_id || original.id;

  // Get max version for this parent
  const { data: versions } = await supabase
    .from('t_vereinbarungen')
    .select('version')
    .or(`parent_vereinbarung_id.eq.${parentId},id.eq.${parentId}`);

  const maxVersion = versions
    ? Math.max(...versions.map(v => v.version || 1))
    : original.version;

  // Create new version
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const newVersionData: any = {
    titel_id: original.titel_id,
    inhalt: updates?.inhalt || original.inhalt,
    ersteller_user_id: original.ersteller_user_id,
    empfaenger_user_id: updates?.empfaenger_user_id ?? original.empfaenger_user_id,
    parent_vereinbarung_id: parentId,
    version: maxVersion + 1,
    status: 'Entwurf',
    bearbeiter_von: updates?.bearbeiter_von ?? original.bearbeiter_von,
    bearbeiter_an: updates?.bearbeiter_an ?? original.bearbeiter_an,
    kurze_zusammenfassung: updates?.kurze_zusammenfassung ?? original.kurze_zusammenfassung,
    anlagen: updates?.anlagen ?? original.anlagen,
    gueltigkeit_von: updates?.gueltigkeit_von ?? original.gueltigkeit_von,
    gueltigkeit_bis: updates?.gueltigkeit_bis ?? original.gueltigkeit_bis,
    kuendigungsfrist_wert: updates?.kuendigungsfrist_wert ?? original.kuendigungsfrist_wert,
    kuendigungsfrist_einheit: updates?.kuendigungsfrist_einheit ?? original.kuendigungsfrist_einheit,
  };

  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .insert(newVersionData)
    .select(`
      *,
      titel:t_vereinbarungstitel(*)
    `)
    .single();

  if (error) throw error;

  // Archive old version
  await updateAgreement(id, { status: 'Archiviert' });

  // Log version creation
  await logAgreementAction(data.id, 'NEUE_VERSION_ERSTELLT', {
    neue_version: data.version,
    archivierte_version: original.version,
    original_id: id,
  });

  return data;
}

/**
 * Get version history for agreement
 */
export async function getAgreementVersionHistory(id: string): Promise<Array<{ id: string; version: number; status: string; created_at: string }>> {
  // Get current agreement
  const current = await getAgreementById(id, false);
  if (!current) throw new Error('Agreement not found');

  // Determine root ID
  const rootId = current.parent_vereinbarung_id || current.id;

  // Get all versions
  const { data, error } = await supabase
    .from('t_vereinbarungen')
    .select('id, version, status, created_at')
    .or(`parent_vereinbarung_id.eq.${rootId},id.eq.${rootId}`)
    .order('version', { ascending: false });

  if (error) throw error;
  return (data || []) as Array<{ id: string; version: number; status: string; created_at: string }>;
}

/**
 * Get agreement logs
 */
export async function getAgreementLogs(id: string): Promise<VereinbarungsLog[]> {
  const { data, error } = await supabase
    .from('t_vereinbarungs_logs')
    .select('*')
    .eq('vereinbarung_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Load user data
  const userIds = [...new Set((data || []).map((log) => log.user_id))];
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('id, email')
    .in('id', userIds);

  const userMap = new Map((userProfiles || []).map((u) => [u.id, u]));

  return (data || []).map((log) => ({
    ...log,
    user: userMap.get(log.user_id)
      ? {
          id: log.user_id,
          email: userMap.get(log.user_id)?.email || '',
          raw_user_meta_data: {},
        }
      : undefined,
  }));
}

/**
 * Log agreement action
 */
export async function logAgreementAction(
  vereinbarungId: string,
  aktion: string,
  details?: any
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('t_vereinbarungs_logs')
    .insert({
      vereinbarung_id: vereinbarungId,
      user_id: user.user.id,
      aktion,
      details: details || null,
    });

  if (error) throw error;
}

/**
 * Get all placeholder definitions
 */
export async function getAllPlaceholderDefinitions(): Promise<PlatzhalterDefinition[]> {
  const { data, error } = await supabase
    .from('t_platzhalter_definitionen')
    .select('*')
    .order('platzhalter_schluessel');

  if (error) throw error;
  return data || [];
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

