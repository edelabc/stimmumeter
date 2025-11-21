import { useEffect, useState } from 'react';
import { Smile, TrendingUp, Shield, Zap, Heart, Brain, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  site_name: string;
  site_description: string;
}

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigateToNew?: () => void;
}

export function LandingPage({ onGetStarted, onNavigateToNew }: LandingPageProps) {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'Stimmungs-Tracker',
    site_description: 'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!supabase) return; // Supabase nicht verfügbar
    
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('site_name, site_description')
        .single();

      if (data) setSettings(data);
    } catch (error) {
      console.warn('Fehler beim Laden der Site-Settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-teal-600/10" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full mb-8 animate-bounce">
              <Smile size={40} className="text-white" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Deine Stimmung.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Deine Macht.
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              {settings.site_description}
            </p>

            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Los geht's!
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
            Warum du uns lieben wirst
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Blitzschnell</h3>
              <p className="text-gray-600">
                Erfasse deine Stimmung in Sekunden. Keine komplizierten Formulare, keine Ablenkungen.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smarte Insights</h3>
              <p className="text-gray-600">
                Entdecke Muster und Trends in deiner Stimmung. Wissen ist Macht!
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <Shield size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Privat</h3>
              <p className="text-gray-600">
                Deine Daten gehören dir. DSGVO-konform und sicher verschlüsselt.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <Heart size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Für dich gemacht</h3>
              <p className="text-gray-600">
                Individuell anpassbar an deine Bedürfnisse und Vorlieben.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <Brain size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Clever analysiert</h3>
              <p className="text-gray-600">
                Intelligente Auswertungen helfen dir, dich selbst besser zu verstehen.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all transform hover:scale-105 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                <Smile size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Einfach gut</h3>
              <p className="text-gray-600">
                Intuitiv, schön und macht Spaß. Tracking war noch nie so angenehm!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Bereit für bessere Laune?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Starte jetzt und nimm dein Wohlbefinden in die Hand!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Jetzt loslegen
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
            {onNavigateToNew && (
              <button
                onClick={onNavigateToNew}
                className="text-white/80 hover:text-white text-sm underline transition-colors"
              >
                Neue Version mit 3D-Globus ansehen →
              </button>
            )}
          </div>
          
          {/* Additional Pages Links */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => window.location.href = '/interactive-earth'}
              className="text-white/60 hover:text-white/90 underline transition-colors"
            >
              🌍 Interaktive Erde
            </button>
            <button
              onClick={() => window.location.href = '/questions-first'}
              className="text-white/60 hover:text-white/90 underline transition-colors"
            >
              ❓ Fragen zuerst
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
