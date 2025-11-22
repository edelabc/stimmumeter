import { supabase, isSupabaseConfigured } from './supabase';

// Helper-Funktion um Netzwerk-Fehler in benutzerfreundliche Meldungen umzuwandeln
const handleAuthError = (error: any): any => {
  if (!error) return null;
  
  // Prüfe auf Netzwerk-Fehler (Platzhalter-URL oder nicht erreichbar)
  const errorMessage = error.message || '';
  if (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed')
  ) {
    return {
      name: 'AuthError',
      message: 'Supabase ist nicht konfiguriert oder nicht erreichbar. Bitte setzen Sie gültige VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Ihrer .env Datei.',
    };
  }
  
  return error;
};

export async function signUp(email: string, password: string) {
  // Prüfe ob Supabase konfiguriert ist
  if (!isSupabaseConfigured()) {
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Bitte setzen Sie gültige VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Ihrer .env Datei.',
      },
    };
  }

  try {
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

    return { data, error: handleAuthError(error) };
  } catch (err: any) {
    return {
      data: { user: null, session: null },
      error: handleAuthError(err),
    };
  }
}

export async function signIn(email: string, password: string) {
  // Prüfe ob Supabase konfiguriert ist
  if (!isSupabaseConfigured()) {
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Bitte setzen Sie gültige VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Ihrer .env Datei.',
      },
    };
  }

  try {
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

    return { data, error: handleAuthError(error) };
  } catch (err: any) {
    return {
      data: { user: null, session: null },
      error: handleAuthError(err),
    };
  }
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }
  try {
    const { error } = await supabase.auth.signOut();
    return { error: handleAuthError(error) };
  } catch (err: any) {
    return { error: handleAuthError(err) };
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err: any) {
    console.warn('Fehler beim Abrufen des aktuellen Users:', err);
    return null;
  }
}

export async function resetPassword(email: string) {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Passwort-Reset nicht verfügbar.',
      },
    };
  }
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error: handleAuthError(error) };
  } catch (err: any) {
    return {
      data: null,
      error: handleAuthError(err),
    };
  }
}

export async function updatePassword(newPassword: string) {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: {
        name: 'AuthError',
        message: 'Supabase ist nicht konfiguriert. Passwort-Update nicht verfügbar.',
      },
    };
  }
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error: handleAuthError(error) };
  } catch (err: any) {
    return {
      data: null,
      error: handleAuthError(err),
    };
  }
}
