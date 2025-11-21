import { supabase } from './supabase';

export async function signUp(email: string, password: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Authentifizierung nicht verfügbar.',
      },
    };
  }

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
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Authentifizierung nicht verfügbar.',
      },
    };
  }

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
  if (!supabase) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Fehler beim Abrufen des aktuellen Users:', error);
    return null;
  }
}

export async function resetPassword(email: string) {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Passwort-Reset nicht verfügbar.',
      },
    };
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  if (!supabase) {
    return {
      data: null,
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Passwort-Update nicht verfügbar.',
      },
    };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}
