import { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowLeft, ExternalLink } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../lib/auth';
import { getAllAgreementTitles, getAllAgreements, getAgreementById } from '../lib/agreement.service';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  onSuccess: () => void;
  onNavigateHome?: () => void;
}

interface AgreementConsent {
  agreementId: string;
  agreementSlug?: string;
  consentType: 'AGB' | 'Datenschutz' | 'Cookies' | 'DSGVO';
  checked: boolean;
}

export function AuthForm({ onSuccess, onNavigateHome }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [agreements, setAgreements] = useState<AgreementConsent[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<{ id: string; title: string; content: string } | null>(null);

  // Initialize agreements when registration form is shown
  useEffect(() => {
    if (!isLogin && !isForgotPassword) {
      // Set default agreements immediately so checkboxes are shown
      setAgreements([
        { agreementId: '', consentType: 'AGB', checked: false },
        { agreementId: '', consentType: 'Datenschutz', checked: false },
        { agreementId: '', consentType: 'Cookies', checked: false },
      ]);
      // Then load actual agreements from database
      loadAgreements();
    } else {
      // Reset agreements when switching away from registration
      setAgreements([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin, isForgotPassword]);

  const loadAgreements = async () => {
    setLoadingAgreements(true);
    try {
      // Get all agreement titles
      const titles = await getAllAgreementTitles();
      
      // Get all agreements
      const allAgreements = await getAllAgreements();
      
      // Find agreements by common titles - speichere sowohl ID als auch Slug
      const agreementMap: Record<string, { id: string; slug?: string }> = {};
      
      // Map titles to agreements
      titles.forEach(title => {
        const titleLower = title.titel.toLowerCase();
        const agreement = allAgreements.find(a => 
          a.titel_id === title.id && 
          a.status === 'Unterzeichnet' &&
          (titleLower.includes('agb') || 
           titleLower.includes('allgemeine geschäftsbedingungen') ||
           titleLower.includes('impressum') ||
           titleLower.includes('datenschutz') ||
           titleLower.includes('cookie') ||
           titleLower.includes('dsgvo'))
        );
        
        if (agreement) {
          if (titleLower.includes('agb') || titleLower.includes('allgemeine geschäftsbedingungen') || titleLower.includes('impressum')) {
            agreementMap['AGB'] = { id: agreement.id, slug: agreement.slug || undefined };
          } else if (titleLower.includes('datenschutz')) {
            agreementMap['Datenschutz'] = { id: agreement.id, slug: agreement.slug || undefined };
          } else if (titleLower.includes('cookie')) {
            agreementMap['Cookies'] = { id: agreement.id, slug: agreement.slug || undefined };
          } else if (titleLower.includes('dsgvo')) {
            agreementMap['DSGVO'] = { id: agreement.id, slug: agreement.slug || undefined };
          }
        }
      });

      // Initialize agreements state - ALWAYS show checkboxes, even if no agreements found
      const initialAgreements: AgreementConsent[] = [
        { 
          agreementId: agreementMap['AGB']?.id || '', 
          agreementSlug: agreementMap['AGB']?.slug,
          consentType: 'AGB', 
          checked: false 
        },
        { 
          agreementId: agreementMap['Datenschutz']?.id || '', 
          agreementSlug: agreementMap['Datenschutz']?.slug,
          consentType: 'Datenschutz', 
          checked: false 
        },
        { 
          agreementId: agreementMap['Cookies']?.id || '', 
          agreementSlug: agreementMap['Cookies']?.slug,
          consentType: 'Cookies', 
          checked: false 
        },
      ];
      // DO NOT filter - always show all checkboxes

      setAgreements(initialAgreements);
    } catch (err) {
      console.error('Error loading agreements:', err);
      // Set default agreements even if loading fails - ALWAYS show checkboxes
      setAgreements([
        { agreementId: '', consentType: 'AGB', checked: false },
        { agreementId: '', consentType: 'Datenschutz', checked: false },
        { agreementId: '', consentType: 'Cookies', checked: false },
      ]);
    } finally {
      setLoadingAgreements(false);
    }
  };

  const handleAgreementChange = (index: number, checked: boolean) => {
    const updated = [...agreements];
    updated[index].checked = checked;
    setAgreements(updated);
  };

  const openAgreementModal = async (agreementId: string, title: string) => {
    if (!agreementId) return;
    
    try {
      const agreement = await getAgreementById(agreementId, true);
      if (agreement) {
        setSelectedAgreement({
          id: agreement.id,
          title: title,
          content: agreement.inhalt,
        });
      }
    } catch (err) {
      console.error('Error loading agreement:', err);
      setError('Fehler beim Laden der Vereinbarung');
    }
  };

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
        // Check if all required agreements are accepted
        // Only validate agreements that have an agreementId (are linked to DB)
        const requiredAgreements = agreements.filter(a => a.agreementId);
        const allAccepted = requiredAgreements.length === 0 || requiredAgreements.every(a => a.checked);
        
        if (!allAccepted) {
          throw new Error('Bitte akzeptieren Sie alle erforderlichen Vereinbarungen');
        }

        const { error: signUpError, data } = await signUp(email, password, agreements);
        if (signUpError) throw signUpError;
        
        // Save consents if user was created and agreements exist
        if (data?.user?.id && agreements.length > 0) {
          await saveAgreementConsents(data.user.id, agreements);
        }
        
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const saveAgreementConsents = async (userId: string, consents: AgreementConsent[]) => {
    try {
      const acceptedConsents = consents.filter(c => c.checked && c.agreementId);
      
      if (acceptedConsents.length === 0) return;

      // Get agreement versions
      const agreementIds = acceptedConsents.map(c => c.agreementId);
      const { data: agreementsData } = await supabase
        .from('t_vereinbarungen')
        .select('id, version')
        .in('id', agreementIds);

      const agreementVersionMap = new Map(
        (agreementsData || []).map(a => [a.id, a.version])
      );

      // Get IP address and user agent
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      
      const userAgent = navigator.userAgent;

      // Insert consents
      const consentsToInsert = acceptedConsents.map(consent => ({
        user_id: userId,
        agreement_id: consent.agreementId,
        agreement_version: agreementVersionMap.get(consent.agreementId) || 1,
        consent_type: consent.consentType,
        ip_address: ipAddress,
        user_agent: userAgent,
      }));

      const { error } = await supabase
        .from('user_agreement_consents')
        .insert(consentsToInsert);

      if (error) {
        console.error('Error saving consents:', error);
      }
    } catch (err) {
      console.error('Error saving agreement consents:', err);
    }
  };

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      // Fallback: Navigate to landing page
      window.location.href = '/';
    }
  };

  // Load agreements for footer links
  const [footerAgreements, setFooterAgreements] = useState<{ datenschutz?: string; cookies?: string }>({});

  useEffect(() => {
    const loadFooterAgreements = async () => {
      try {
        const titles = await getAllAgreementTitles();
        const allAgreements = await getAllAgreements();
        
        const agreementMap: Record<string, string> = {};
        titles.forEach(title => {
          const titleLower = title.titel.toLowerCase();
          const agreement = allAgreements.find(a => 
            a.titel_id === title.id && 
            a.status === 'Unterzeichnet' &&
            a.slug // Nur Vereinbarungen mit Slug verwenden
          );
          
          if (agreement && agreement.slug) {
            if (titleLower.includes('datenschutz')) {
              agreementMap['datenschutz'] = agreement.slug;
            } else if (titleLower.includes('cookie')) {
              // Bevorzuge 'cookie-einstellungen', sonst 'cookie'
              if (agreement.slug.includes('cookie-einstellungen') || agreement.slug.includes('cookie')) {
                agreementMap['cookies'] = agreement.slug;
              }
            }
          }
        });
        
        setFooterAgreements(agreementMap);
      } catch (err) {
        console.error('Error loading footer agreements:', err);
      }
    };
    
    loadFooterAgreements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="mb-4">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Home
          </button>
        </div>
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

          {/* Agreement Checkboxes - Only show during registration */}
          {!isLogin && !isForgotPassword && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Bitte akzeptieren Sie folgende Vereinbarungen:
              </p>
              {loadingAgreements ? (
                <p className="text-xs text-gray-500">Lade Vereinbarungen...</p>
              ) : (
                agreements.map((agreement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`agreement-${index}`}
                      checked={agreement.checked}
                      onChange={(e) => handleAgreementChange(index, e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required={agreement.agreementId !== ''}
                    />
                    <label htmlFor={`agreement-${index}`} className="flex-1 text-sm text-gray-700 cursor-pointer">
                      Ich akzeptiere die{' '}
                      {agreement.agreementId ? (
                        agreement.agreementSlug ? (
                          <a
                            href={`/agreement/${agreement.agreementSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                          >
                            {agreement.consentType}
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openAgreementModal(agreement.agreementId, agreement.consentType);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                          >
                            {agreement.consentType}
                            <ExternalLink size={14} />
                          </button>
                        )
                      ) : (
                        <span className="text-gray-500">{agreement.consentType} (nicht verfügbar)</span>
                      )}
                      {agreement.agreementId && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                ))
              )}
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
              
              {/* Footer mit Links zu Vereinbarungen */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Weitere Informationen findest du in unseren{' '}
                  {footerAgreements.datenschutz ? (
                    <a
                      href={`/agreement/${footerAgreements.datenschutz}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Datenschutzbestimmungen
                    </a>
                  ) : (
                    <span className="text-gray-500">Datenschutzbestimmungen</span>
                  )}
                  {footerAgreements.cookies && (
                    <>
                      {' und '}
                      <a
                        href={`/agreement/${footerAgreements.cookies}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Cookies-Richtlinie
                      </a>
                    </>
                  )}
                  .
                </p>
              </div>
            </>
          )}
        </div>

        {/* Agreement Modal */}
        {selectedAgreement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedAgreement.title}</h2>
                <button
                  onClick={() => setSelectedAgreement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedAgreement.content }}
                />
              </div>
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedAgreement(null)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
