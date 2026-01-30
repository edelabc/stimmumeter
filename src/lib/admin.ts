// MySQL-basierte Admin-Prüfung
import { getCurrentUser } from './auth-mysql';
import { apiClient, getApiBaseUrl } from './api-client';
import { supabase, isSupabaseConfigured } from './supabase';

// API Base URL dynamisch bestimmen
const API_BASE_URL = (): string => getApiBaseUrl();

/**
 * Prüft ob ein Benutzer Admin ist
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Hole aktuellen Benutzer
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.id !== userId) {
      return false;
    }

    // Prüfe Admin-Status via API
    const response = await fetch(`${API_BASE_URL()}/auth.php?action=is-admin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success && data.data?.isAdmin === true;
  } catch (error) {
    console.warn('Fehler beim Prüfen der Admin-Rechte:', error);
    return false;
  }
}

/**
 * Prüft ob der aktuell eingeloggte Benutzer Admin ist
 */
export async function checkCurrentUserIsAdmin(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Prüfe Admin-Status via API
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL()}/auth.php?action=is-admin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success && data.data?.isAdmin === true;
  } catch (error) {
    console.warn('Fehler beim Prüfen der Admin-Rechte:', error);
    return false;
  }
}

export async function getAllUsers() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    return { data, error };
  } catch (err: any) {
    return {
      data: null,
      error: err,
    };
  }
}

export async function deleteUser(userId: string) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    return { data, error };
  } catch (err: any) {
    return {
      data: null,
      error: err,
    };
  }
}

export async function makeAdmin(userId: string) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({ user_id: userId });
    return { data, error };
  } catch (err: any) {
    return {
      data: null,
      error: err,
    };
  }
}

export async function removeAdmin(userId: string) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  } catch (err: any) {
    return {
      data: null,
      error: err,
    };
  }
}
