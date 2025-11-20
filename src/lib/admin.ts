import { supabase } from './supabase';

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

export async function checkCurrentUserIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return isAdmin(user.id);
}

export async function getAllUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  return { data, error };
}

export async function deleteUser(userId: string) {
  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  return { data, error };
}

export async function makeAdmin(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .insert({ user_id: userId });
  return { data, error };
}

export async function removeAdmin(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_id', userId);
  return { data, error };
}
