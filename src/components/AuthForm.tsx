import { useState } from 'react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../lib/auth';

interface AuthFormProps {
  onSuccess: () => void;
  onNavigateHome?: () => void;
}

export function AuthForm({ onSuccess, onNavigateHome }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await resetPassword(email);
        if (resetError) throw resetError;
        setSuccessMessage('Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts gesendet. Bitte überprüfe dein Postfach.');
        setEmail('');
      } else if (isLogin) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onSuccess();
      } else {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {onNavigateHome && (
          <div className="mb-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              Home
            </button>
          </div>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stimmungs-Tracker
          </h1>
          <p className="text-gray-600">
            {isForgotPassword ? 'Passwort zurücksetzen' : isLogin ? 'Willkommen zurück!' : 'Erstelle dein Konto'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="deine@email.de"
                required
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Bitte warten...' : isForgotPassword ? 'Link senden' : isLogin ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setSuccessMessage('');
              }}
              className="flex items-center justify-center gap-2 w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={16} />
              Zurück zur Anmeldung
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="block w-full text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
              </button>
              {isLogin && (
                <button
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccessMessage('');
                    setPassword('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Passwort vergessen?
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Mit der Nutzung stimmst du der Verarbeitung deiner Daten zu.
            Weitere Informationen findest du in unseren{' '}
            <a href="/legal/datenschutz" className="text-blue-600 hover:underline">
              Datenschutzbestimmungen
            </a>
            ,{' '}
            <a href="/legal/dsgvo" className="text-blue-600 hover:underline">
              DSGVO
            </a>
            {' '}und{' '}
            <a href="/legal/cookies" className="text-blue-600 hover:underline">
              Cookie-Richtlinie
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
