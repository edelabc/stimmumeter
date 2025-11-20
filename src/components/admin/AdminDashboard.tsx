import { useState, useEffect } from 'react';
import { Users, Menu as MenuIcon, FileText, Settings as SettingsIcon, Home, Brain, DollarSign, Wallet, CreditCard, ScrollText, FileCheck } from 'lucide-react';
import { checkCurrentUserIsAdmin } from '../../lib/admin';
import { UserManagement } from './UserManagement';
import { MenuManagement } from './MenuManagement';
import { LegalPagesManagement } from './LegalPagesManagement';
import { FooterManagement } from './FooterManagement';
import { AIModuleManagement } from './AIModuleManagement';
import { BillingManagement } from './BillingManagement';
import { PrepaidRechargeManagement } from './PrepaidRechargeManagement';
import { StripeConfiguration } from './StripeConfiguration';
import { AuditLogViewer } from './AuditLogViewer';
import { AgreementsManagement } from './AgreementsManagement';

type AdminSection = 'users' | 'menu' | 'legal' | 'footer' | 'ai' | 'billing' | 'prepaid' | 'stripe' | 'audit' | 'agreements';

export function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const adminStatus = await checkCurrentUserIsAdmin();
    setIsAdmin(adminStatus);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Admin-Bereich...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
          <p className="text-gray-600">Du hast keine Berechtigung für den Admin-Bereich.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'users' as AdminSection, name: 'Benutzerverwaltung', icon: Users },
    { id: 'menu' as AdminSection, name: 'Menü bearbeiten', icon: MenuIcon },
    { id: 'agreements' as AdminSection, name: 'Vereinbarungen', icon: FileCheck },
    { id: 'legal' as AdminSection, name: 'Rechtliche Seiten', icon: FileText },
    { id: 'footer' as AdminSection, name: 'Footer bearbeiten', icon: SettingsIcon },
    { id: 'ai' as AdminSection, name: 'KI-Modul', icon: Brain },
    { id: 'billing' as AdminSection, name: 'Billing & Tarife', icon: DollarSign },
    { id: 'prepaid' as AdminSection, name: 'Prepaid Aufladebeträge', icon: Wallet },
    { id: 'stripe' as AdminSection, name: 'Stripe Integration', icon: CreditCard },
    { id: 'audit' as AdminSection, name: 'Audit Logs', icon: ScrollText }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-2">Verwalte deine Website-Inhalte und Benutzer</p>
            </div>
            <button
              onClick={() => window.location.href = '/app'}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Home size={18} />
              Zur App
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              <button
                onClick={() => window.location.href = '/app'}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all mb-4 border-b pb-3"
              >
                <Home size={20} />
                Zur App
              </button>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {section.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeSection === 'users' && <UserManagement />}
              {activeSection === 'menu' && <MenuManagement />}
              {activeSection === 'agreements' && <AgreementsManagement />}
              {activeSection === 'legal' && <LegalPagesManagement />}
              {activeSection === 'footer' && <FooterManagement />}
              {activeSection === 'ai' && <AIModuleManagement />}
              {activeSection === 'billing' && <BillingManagement />}
              {activeSection === 'prepaid' && <PrepaidRechargeManagement />}
              {activeSection === 'stripe' && <StripeConfiguration />}
              {activeSection === 'audit' && <AuditLogViewer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
