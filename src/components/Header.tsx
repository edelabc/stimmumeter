import { useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut, getCurrentUser } from '../lib/auth';
import { getApiBaseUrl } from '../lib/api-client';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  position: number;
  required_role: 'public' | 'user' | 'admin';
  linked_agreement_id?: string | null;
  slug?: string | null;
}

interface HeaderProps {
  onNavigate?: (url: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [siteName, setSiteName] = useState('Stimmungs-Tracker');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadMenuItems();
    loadSiteSettings();
    checkAuthStatus();

    // Listen for auth changes via storage event (when token changes)
    const handleStorageChange = () => {
      loadMenuItems();
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for auth changes
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      console.warn('Fehler beim Prüfen des Auth-Status:', error);
      setIsLoggedIn(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/menu-items.php?action=list`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Menu-Items');
      }

      const result = await response.json();

      if (result.data) {
        setMenuItems(result.data);
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Menu-Items:', error);
      // Bei Fehler: Behalte Fallback-Menü (null-Zustand)
      // setMenuItems bleibt null, damit Fallback-Items angezeigt werden
    }
  };

  const loadSiteSettings = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/site-settings.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Site-Settings');
      }

      const result = await response.json();

      if (result.data?.site_name) {
        setSiteName(result.data.site_name);
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Site-Settings:', error);
      // Fallback: Behalte Standard-Namen
    }
  };

  const handleNavigate = (url: string) => {
    setIsMenuOpen(false);
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[10000] bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => handleNavigate('/')}
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-teal-700 transition-all"
          >
            {siteName}
          </button>

          <nav className="flex items-center space-x-8">
            {menuItems !== null && menuItems.length > 0 ? (
              <>
                {menuItems
                  .filter((item) => isLoggedIn ? item.title !== 'Impressum' : true)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.url)}
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:inline-block"
                    >
                      {item.title}
                    </button>
                  ))}
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors hidden md:flex"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('/')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:inline-block"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigate('/app')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:inline-block"
                >
                  App
                </button>
                <button
                  onClick={() => handleNavigate('/legal/impressum')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:inline-block"
                >
                  Impressum
                </button>
              </>
            )}
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {menuItems !== null && menuItems.length > 0 ? (
              <>
                {menuItems
                  .filter((item) => isLoggedIn ? item.title !== 'Impressum' : true)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.url)}
                      className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                    >
                      {item.title}
                    </button>
                  ))}
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('/')}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigate('/app')}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                >
                  App
                </button>
                <button
                  onClick={() => handleNavigate('/legal/impressum')}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                >
                  Impressum
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
