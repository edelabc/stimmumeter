import { supabase } from './supabase';

export async function isAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.warn('Fehler beim Prüfen der Admin-Rechte:', error);
    return false;
  }
}

export async function checkCurrentUserIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return isAdmin(user.id);
  } catch (error) {
    console.warn('Fehler beim Prüfen der Admin-Rechte:', error);
    return false;
  }
}

export async function getAllUsers() {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  const { data, error } = await supabase.auth.admin.listUsers();
  return { data, error };
}

export async function deleteUser(userId: string) {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  return { data, error };
}

export async function makeAdmin(userId: string) {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .insert({ user_id: userId });
  return { data, error };
}

export async function removeAdmin(userId: string) {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AdminError',
        message: 'Supabase ist nicht konfiguriert.',
      },
    };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_id', userId);
  return { data, error };
}
