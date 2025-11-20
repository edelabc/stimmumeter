import { useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteName, setSiteName] = useState('Stimmungs-Tracker');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadMenuItems();
    loadSiteSettings();
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadMenuItems();
      checkAuthStatus();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const loadMenuItems = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session;
    
    // Check if user is admin
    let isAdmin = false;
    if (isAuthenticated && session?.user) {
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      isAdmin = !!adminCheck;
    }

    // Build query based on role
    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('position');

    // Filter by required_role
    if (!isAuthenticated) {
      // Public users can only see public items
      query = query.eq('required_role', 'public');
    } else if (!isAdmin) {
      // Authenticated non-admin users can see public and user items
      query = query.in('required_role', ['public', 'user']);
    }
    // Admins can see all items (no filter)

    const { data } = await query;

    if (data) setMenuItems(data);
  };

  const loadSiteSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('site_name')
      .single();

    if (data) setSiteName(data.site_name);
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => handleNavigate('/')}
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-teal-700 transition-all"
          >
            {siteName}
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {menuItems
              .filter((item) => isLoggedIn ? item.title !== 'Impressum' : true)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.url)}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {item.title}
                </button>
              ))}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
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
          </nav>
        </div>
      )}
    </header>
  );
}
