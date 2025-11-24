import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, CreditCard, X, Key, Globe, Wallet, FileText, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserBillingPortal } from './UserBillingPortal';
import { PlanSelectionModal } from './PlanSelectionModal';
import { AccountStatement } from './AccountStatement';
import {
  getUserAccountConfig,
  upsertUserAccountConfig,
  getPrepaidRechargeAmounts,
  createAccountTransaction,
  type PrepaidRechargeAmount,
} from '../lib/billing';

interface AccountSettingsProps {
  onClose: () => void;
}

type SettingsTab = 'profile' | 'billing' | 'statement' | 'security';

export function AccountSettings({ onClose }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!supabase) {
      console.warn('Supabase nicht verfügbar');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      setUser(authUser);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      setUserProfile(profile);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User size={28} />
            <div>
              <h2 className="text-2xl font-bold">Mein Konto</h2>
              <p className="text-blue-100 text-sm">Verwalte deine Account-Einstellungen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User size={20} />
                <span className="font-medium">Profil</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === 'billing'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard size={20} />
                <span className="font-medium">Billing & Tarife</span>
              </button>

              <button
                onClick={() => setActiveTab('statement')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === 'statement'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText size={20} />
                <span className="font-medium">Kontoauszug</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === 'security'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield size={20} />
                <span className="font-medium">Sicherheit</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Lädt...</div>
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <ProfileTab user={user} userProfile={userProfile} onUpdate={loadUserData} />
                )}
                {activeTab === 'billing' && <BillingTab userId={user?.id} />}
                {activeTab === 'statement' && <AccountStatement />}
                {activeTab === 'security' && <SecurityTab user={user} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, userProfile, onUpdate }: any) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: userProfile?.display_name || '',
    preferred_language: userProfile?.preferred_language || 'de',
  });

  const handleSave = async () => {
    if (!supabase) {
      alert('Supabase ist nicht konfiguriert.');
      return;
    }
    const { error } = await supabase
      .from('user_profiles')
      .update({
        preferred_language: formData.preferred_language,
      })
      .eq('id', user.id);

    if (!error) {
      setEditing(false);
      onUpdate();
      alert('Profil erfolgreich aktualisiert!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Profil-Informationen</h3>
        <p className="text-gray-600 text-sm mb-6">
          Verwalte deine persönlichen Informationen und Einstellungen
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">
              {formData.display_name || 'Benutzer'}
            </h4>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              E-Mail kann nicht geändert werden
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              Registriert seit
            </label>
            <input
              type="text"
              value={new Date(user?.created_at).toLocaleDateString('de-DE')}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} />
              Anzeigename
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              disabled={!editing}
              placeholder="Dein Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe size={16} />
              Bevorzugte Sprache
            </label>
            <select
              value={formData.preferred_language}
              onChange={e => setFormData({ ...formData, preferred_language: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Profil bearbeiten
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Datenschutz</h5>
            <p className="text-sm text-blue-700">
              Deine persönlichen Daten werden sicher verschlüsselt und nur für die Funktionalität der App verwendet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ userId }: { userId: string }) {
  const [accountConfig, setAccountConfig] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmounts, setRechargeAmounts] = useState<PrepaidRechargeAmount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAccountConfig();
      loadRechargeAmounts();
    }
  }, [userId]);

  const loadAccountConfig = async () => {
    setLoading(true);
    const { data } = await getUserAccountConfig(userId);
    setAccountConfig(data);
    setLoading(false);
  };

  const loadRechargeAmounts = async () => {
    const { data } = await getPrepaidRechargeAmounts();
    if (data) setRechargeAmounts(data);
  };

  const handleAccountTypeChange = async (type: 'prepaid' | 'postpaid') => {
    const { error } = await upsertUserAccountConfig({
      user_id: userId,
      account_type: type,
      current_plan_id: accountConfig?.current_plan_id || null,
      balance: accountConfig?.balance || 0,
    });

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      alert('Kontotyp erfolgreich geändert!');
      await loadAccountConfig();
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!accountConfig?.account_type) {
      alert('Bitte wählen Sie zuerst einen Kontotyp');
      return;
    }

    const { error } = await upsertUserAccountConfig({
      user_id: userId,
      account_type: accountConfig.account_type,
      current_plan_id: planId,
      balance: accountConfig.balance || 0,
    });

    if (error) {
      alert('Fehler beim Buchen: ' + error.message);
    } else {
      alert('Tarif erfolgreich gebucht!');
      setShowPlanModal(false);
      await loadAccountConfig();
    }
  };

  const handleRecharge = async (amount: number) => {
    console.log('🟡 [RECHARGE] Starting recharge process...', { amount, userId });

    try {
      setShowRechargeModal(false);
      console.log('🟡 [RECHARGE] Modal closed, importing stripe service...');

      const { createPrepaidCheckoutSession } = await import('../lib/stripe-service');
      console.log('🟡 [RECHARGE] Stripe service imported, calling createPrepaidCheckoutSession...');

      await createPrepaidCheckoutSession({
        amount,
        currency: 'EUR',
        description: 'Konto-Aufladung',
        userId,
      });

      console.log('🟡 [RECHARGE] createPrepaidCheckoutSession completed (should have redirected)');
    } catch (error: any) {
      console.error('🔴 [RECHARGE ERROR]', error);
      console.error('🔴 [RECHARGE ERROR] Message:', error.message);
      console.error('🔴 [RECHARGE ERROR] Stack:', error.stack);

      const isStripeNotConfigured = error.message.includes('nicht konfiguriert') ||
                                     error.message.includes('nicht aktiv');

      if (isStripeNotConfigured && confirm(
        '⚠️ Stripe ist noch nicht konfiguriert!\n\n' +
        'Möchten Sie zur Admin-Seite wechseln, um Stripe zu konfigurieren?\n\n' +
        'Hinweis: Sie benötigen Admin-Rechte.'
      )) {
        window.location.href = '/admin';
      } else {
        alert('Fehler beim Aufladen:\n\n' + error.message);
      }

      setShowRechargeModal(true);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Billing & Tarife</h3>
        <p className="text-gray-600 text-sm">
          Verwalte deinen Kontotyp, Tarif und Zahlungen
        </p>
      </div>

      {!accountConfig?.account_type ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Kontotyp wählen</h4>
          <p className="text-gray-600 mb-6">
            Bitte wählen Sie zunächst Ihren gewünschten Kontotyp:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAccountTypeChange('prepaid')}
              className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-6 text-left transition-all hover:shadow-lg group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Wallet size={24} />
                </div>
                <h5 className="text-lg font-bold text-gray-900">Prepaid</h5>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Guthaben vorher aufladen</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Volle Kostenkontrolle</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Keine Vertragsbindung</span>
                </li>
              </ul>
            </button>

            <button
              onClick={() => handleAccountTypeChange('postpaid')}
              className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-6 text-left transition-all hover:shadow-lg group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
                <h5 className="text-lg font-bold text-gray-900">Postpaid</h5>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Erst nutzen, dann bezahlen</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Automatischer Einzug</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Rechnung am Monatsende</span>
                </li>
              </ul>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Kontotyp</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {accountConfig.account_type === 'prepaid' ? 'Prepaid-Konto' : 'Postpaid-Konto'}
                </p>
              </div>
              <button
                onClick={() => handleAccountTypeChange(accountConfig.account_type === 'prepaid' ? 'postpaid' : 'prepaid')}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Ändern
              </button>
            </div>

            {accountConfig.account_type === 'prepaid' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Aktuelles Guthaben</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(accountConfig.balance || 0).toFixed(2)} €
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={18} />
                    Aufladen
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Aktueller Tarif</h4>
                {accountConfig.current_plan_id ? (
                  <p className="text-sm text-gray-600 mt-1">Tarif gebucht</p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">Noch kein Tarif gebucht</p>
                )}
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard size={18} />
                {accountConfig.current_plan_id ? 'Tarif wechseln' : 'Tarif auswählen'}
              </button>
            </div>
          </div>
        </>
      )}

      {showPlanModal && (
        <PlanSelectionModal
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={handleSelectPlan}
          accountType={accountConfig?.account_type || 'prepaid'}
        />
      )}

      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Konto aufladen</h3>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {rechargeAmounts.map(amount => (
                <button
                  key={amount.id}
                  onClick={() => handleRecharge(amount.amount)}
                  className="border-2 border-gray-200 hover:border-green-500 rounded-xl p-6 text-center transition-all hover:shadow-lg group"
                >
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {amount.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">{amount.currency_code}</div>
                  {amount.bonus_percentage > 0 && (
                    <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      +{amount.bonus_percentage}% Bonus
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-6 text-center">
              Zahlung erfolgt sicher über Stripe
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab({ user }: any) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein');
      return;
    }

    if (!supabase) {
      setPasswordError('Supabase ist nicht konfiguriert.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      alert('Passwort erfolgreich geändert!');
      setChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Sicherheitseinstellungen</h3>
        <p className="text-gray-600 text-sm mb-6">
          Verwalte Passwort und Sicherheitsoptionen
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Key size={18} />
              Passwort ändern
            </h4>
            <p className="text-sm text-gray-600">
              Aktualisiere dein Passwort für mehr Sicherheit
            </p>
          </div>
        </div>

        {!changingPassword ? (
          <button
            onClick={() => setChangingPassword(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Passwort ändern
          </button>
        ) : (
          <div className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Passwort aktualisieren
              </button>
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Shield size={18} />
          Account-Sicherheit
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">E-Mail verifiziert</p>
              <p className="text-sm text-gray-600">
                {user?.email_confirmed_at ? 'Bestätigt am ' + new Date(user.email_confirmed_at).toLocaleDateString('de-DE') : 'Nicht bestätigt'}
              </p>
            </div>
            {user?.email_confirmed_at ? (
              <span className="text-green-600 font-medium">✓ Verifiziert</span>
            ) : (
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Bestätigen
              </button>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Letzte Anmeldung</p>
              <p className="text-sm text-gray-600">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('de-DE') : 'Unbekannt'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-2">Gefahrenzone</h4>
        <p className="text-sm text-red-700 mb-4">
          Einmal gelöscht, kann dein Account nicht wiederhergestellt werden.
        </p>
        <button
          onClick={() => {
            if (confirm('Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
              alert('Account-Löschung muss vom Administrator durchgeführt werden.');
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Account löschen
        </button>
      </div>
    </div>
  );
}
