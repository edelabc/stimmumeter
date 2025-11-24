// MySQL-basierte Authentifizierung
// Alle Supabase-Abhängigkeiten wurden entfernt
import * as mysqlAuth from './auth-mysql';

export async function signUp(email: string, password: string, agreements?: Array<{ agreementId: string; consentType: string; checked: boolean }>) {
  return await mysqlAuth.signUp(email, password, agreements);
}

export async function signIn(email: string, password: string) {
  return await mysqlAuth.signIn(email, password);
}

export async function signOut() {
  return await mysqlAuth.signOut();
}

export async function getCurrentUser() {
  return await mysqlAuth.getCurrentUser();
}

export async function resetPassword(email: string) {
  return await mysqlAuth.resetPassword(email);
}

export async function updatePassword(newPassword: string) {
  return await mysqlAuth.updatePassword(newPassword);
}
