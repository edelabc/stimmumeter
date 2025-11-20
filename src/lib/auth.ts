import { supabase } from './supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (data.user && !error) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email || email,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
    }
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Check if user is blocked
  if (data.user && !error) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_blocked')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      // Sign out the blocked user immediately
      await supabase.auth.signOut();
      return {
        data: { user: null, session: null },
        error: {
          name: 'AuthError',
          message: 'Ihr Account wurde gesperrt. Bitte kontaktieren Sie den Administrator.',
        },
      };
    }
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}
