import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from './lib/auth';
import { AuthForm } from './components/AuthForm';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { SEO } from './components/SEO';
import { LegalPageViewer } from './components/LegalPageViewer';
import { DocumentViewer } from './components/DocumentViewer';
import { AgreementViewer } from './components/AgreementViewer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MoodApp } from './MoodApp';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentCancel } from './components/PaymentCancel';
import { CookieConsent } from './components/CookieConsent';
import { supabase } from './lib/supabase';

type Route = 'landing' | 'auth' | 'app' | 'admin' | 'legal' | 'docs' | 'agreement' | 'payment-success' | 'payment-cancel';

interface AppState {
  route: Route;
  legalPageType?: string;
  documentSlug?: string;
  agreementSlug?: string;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>({ route: 'landing' });

  useEffect(() => {
    checkUser();
    handleInitialRoute();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();

    // Check if user is blocked
    if (currentUser) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_blocked')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profile?.is_blocked) {
        // Log out blocked user
        await signOut();
        setUser(null);
        setAppState({ route: 'auth' });
        alert('Ihr Account wurde gesperrt. Bitte kontaktieren Sie den Administrator.');
        setLoading(false);
        return;
      }
    }

    setUser(currentUser);
    setLoading(false);
  };

  const handleInitialRoute = () => {
    const path = window.location.pathname;

    if (path.startsWith('/legal/')) {
      const pageType = path.replace('/legal/', '');
      setAppState({ route: 'legal', legalPageType: pageType });
    } else if (path.startsWith('/docs/')) {
      const slug = path.replace('/docs/', '');
      setAppState({ route: 'docs', documentSlug: slug });
    } else if (path.startsWith('/agreement/')) {
      const slug = path.replace('/agreement/', '');
      setAppState({ route: 'agreement', agreementSlug: slug });
    } else if (path === '/payment-success') {
      setAppState({ route: 'payment-success' });
    } else if (path === '/payment-cancel') {
      setAppState({ route: 'payment-cancel' });
    } else if (path === '/admin') {
      setAppState({ route: 'admin' });
    } else if (path === '/app') {
      setAppState({ route: 'app' });
    } else if (path === '/auth') {
      setAppState({ route: 'auth' });
    } else {
      setAppState({ route: 'landing' });
    }
  };

  const navigate = (url: string) => {
    window.history.pushState({}, '', url);

    if (url.startsWith('/legal/')) {
      const pageType = url.replace('/legal/', '');
      setAppState({ route: 'legal', legalPageType: pageType });
    } else if (url.startsWith('/docs/')) {
      const slug = url.replace('/docs/', '');
      setAppState({ route: 'docs', documentSlug: slug });
    } else if (url.startsWith('/agreement/')) {
      const slug = url.replace('/agreement/', '');
      setAppState({ route: 'agreement', agreementSlug: slug });
    } else if (url === '/payment-success') {
      setAppState({ route: 'payment-success' });
    } else if (url === '/payment-cancel') {
      setAppState({ route: 'payment-cancel' });
    } else if (url === '/admin') {
      setAppState({ route: 'admin' });
    } else if (url === '/app') {
      setAppState({ route: 'app' });
    } else if (url === '/auth') {
      setAppState({ route: 'auth' });
    } else {
      setAppState({ route: 'landing' });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/auth');
    }
  };

  const handleAuthSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    navigate('/app');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (appState.route === 'auth' || (!user && appState.route === 'app')) {
    return (
      <>
        <SEO title="Anmelden" />
        <AuthForm
          onSuccess={handleAuthSuccess}
          onNavigateHome={() => navigate('/')}
        />
      </>
    );
  }

  if (appState.route === 'app') {
    if (!user) {
      navigate('/auth');
      return null;
    }
    return <MoodApp />;
  }

  if (appState.route === 'admin') {
    if (!user) {
      navigate('/auth');
      return null;
    }
    return (
      <>
        <SEO title="Admin Dashboard" />
        <Layout showHeader={false} showFooter={false}>
          <AdminDashboard />
        </Layout>
      </>
    );
  }

  if (appState.route === 'payment-success') {
    return (
      <>
        <SEO title="Zahlung erfolgreich" />
        <Layout onNavigate={navigate}>
          <PaymentSuccess />
        </Layout>
      </>
    );
  }

  if (appState.route === 'payment-cancel') {
    return (
      <>
        <SEO title="Zahlung abgebrochen" />
        <Layout onNavigate={navigate}>
          <PaymentCancel />
        </Layout>
      </>
    );
  }

  if (appState.route === 'legal' && appState.legalPageType) {
    return (
      <>
        <SEO title={appState.legalPageType} />
        <Layout onNavigate={navigate}>
          <LegalPageViewer pageType={appState.legalPageType} />
        </Layout>
      </>
    );
  }

  if (appState.route === 'docs' && appState.documentSlug) {
    return (
      <>
        <SEO title="Dokument" />
        <Layout onNavigate={navigate}>
          <DocumentViewer slug={appState.documentSlug} />
        </Layout>
      </>
    );
  }

  if (appState.route === 'agreement' && appState.agreementSlug) {
    return (
      <>
        <SEO title="Vereinbarung" />
        <Layout onNavigate={navigate}>
          <AgreementViewer slug={appState.agreementSlug} />
        </Layout>
      </>
    );
  }

  return (
    <>
      <SEO />
      <CookieConsent onNavigate={navigate} />
      <Layout onNavigate={navigate}>
        <LandingPage onGetStarted={handleGetStarted} />
      </Layout>
    </>
  );
}

export default App;
