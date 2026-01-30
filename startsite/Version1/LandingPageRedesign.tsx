import { useEffect, useState, useRef } from 'react';
import { 
  Globe2, Sparkles, TrendingUp, Shield, Brain, 
  Award, Users, MapPin, Activity, Zap, Star,
  ChevronRight, Play, Lock, Unlock, Heart,
  Trophy, Coins, Target, Rocket
} from 'lucide-react';

interface MoodData {
  lat: number;
  lng: number;
  mood_score: number;
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  city?: string;
  country?: string;
  dominant_indicator?: string;
}

interface UserStats {
  totalGuesses: number;
  correctGuesses: number;
  yraBalance: number;
  streak: number;
  globalRank?: number;
}

export function LandingPageRedesign({ onGetStarted }: { onGetStarted: () => void }) {
  const [liveMoodData, setLiveMoodData] = useState<MoodData[]>([]);
  const [currentGuessLocation, setCurrentGuessLocation] = useState<MoodData | null>(null);
  const [isGlobeLoaded, setIsGlobeLoaded] = useState(false);
  const [userGuess, setUserGuess] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Parallax-Effekt
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Google Maps 3D-Globus initialisieren
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=maps,marker&v=beta`;
      script.async = true;
      script.defer = true;
      script.onload = initGoogleEarth;
      document.head.appendChild(script);
    }
  }, []);

  const initGoogleEarth = async () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Verwende Standard Google Maps API (kompatibel mit älteren Versionen)
      const Map = window.google.maps.Map;
    
      // Dunkler Stil für Deep/Dark Theme
      const darkStyle = [
        { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1a1a1a" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#001133" }],
      },
      ];

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2.5,
        mapId: "DEMO_MAP_ID", // Für erweiterte Marker
        heading: 0,
        tilt: 45,
        styles: darkStyle,
        disableDefaultUI: true,
        backgroundColor: '#000000',
        controlSize: 32,
      });

      setIsGlobeLoaded(true);
      
      // Starte Animation
      animateGlobe();
      
      // Lade Live-Daten
      loadLiveMoodData();
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Karte:', error);
      loadLiveMoodData(); // Fallback zu Demo-Daten
    }
  };

  const animateGlobe = () => {
    if (!googleMapRef.current) return;
    
    let heading = 0;
    const animate = () => {
      heading = (heading + 0.2) % 360;
      googleMapRef.current?.moveCamera({
        heading,
        tilt: 45,
        zoom: 2.5,
      });
      requestAnimationFrame(animate);
    };
    animate();
  };

  const loadLiveMoodData = async () => {
    try {
      const response = await fetch('/api/mood/live?time_window=15m');
      const data = await response.json();
      setLiveMoodData(data.cells || []);
      updateMapMarkers(data.cells || []);
    } catch (error) {
      // Fallback Demo-Daten
      const demoData: MoodData[] = [
        { lat: 50.94, lng: 6.96, mood_score: 0.7, state: 'positive', count: 234, city: 'Köln', country: 'Deutschland' },
        { lat: 40.71, lng: -74.00, mood_score: -0.3, state: 'negative', count: 567, city: 'New York', country: 'USA' },
        { lat: 35.68, lng: 139.69, mood_score: 0.1, state: 'neutral', count: 432, city: 'Tokyo', country: 'Japan' },
        { lat: -33.86, lng: 151.21, mood_score: 0.8, state: 'positive', count: 321, city: 'Sydney', country: 'Australien' },
        { lat: 51.50, lng: -0.12, mood_score: -0.2, state: 'negative', count: 456, city: 'London', country: 'UK' },
      ];
      setLiveMoodData(demoData);
      updateMapMarkers(demoData);
    }
  };

  const updateMapMarkers = (data: MoodData[]) => {
    if (!googleMapRef.current) return;

    // Entferne alte Marker
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Füge neue Marker hinzu
    data.forEach(location => {
      const color = location.state === 'positive' ? '#10b981' : 
                   location.state === 'negative' ? '#ef4444' : '#6b7280';
      
      const pulseDiv = document.createElement('div');
      pulseDiv.innerHTML = `
        <div style="
          width: ${20 + location.count / 20}px;
          height: ${20 + location.count / 20}px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 0 20px ${color};
          animation: pulse 2s infinite;
          cursor: pointer;
        "></div>
      `;

      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8 + location.count / 50,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `${location.city || 'Unknown'}: ${location.state}`,
      });

      marker.addListener('click', () => {
        setCurrentGuessLocation(location);
        setUserGuess(null);
        setShowResult(false);
      });

      markersRef.current.push(marker);
    });
  };

  const handleGuess = (guess: 'positive' | 'neutral' | 'negative') => {
    if (!currentGuessLocation) return;
    
    setUserGuess(guess);
    setShowResult(true);
    
    // Hier würde die Guess-Verifizierung stattfinden
    const isCorrect = guess === currentGuessLocation.state;
    
    if (isCorrect) {
      // Award YRA tokens
      console.log('Richtig geraten! +10 YRA');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>

      {/* Hero Section mit 3D Globus */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* 3D Globus Container */}
        <div className="absolute inset-0 z-10">
          <div ref={mapRef} className="w-full h-full opacity-80" />
          
          {/* Overlay mit Interaktion */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto"
             style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          
          {/* Glowing Logo */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <Globe2 size={80} className="text-blue-400 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-blue-500/50 animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient">
              Fühle den Puls der Welt
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-slide-up">
            Rate die Stimmung von Menschen weltweit in Echtzeit.<br/>
            <span className="text-yellow-400 font-semibold">Sammle YRA-Coins</span> und werde zum globalen Emotions-Experten!
          </p>

          {/* Quick Play Demo */}
          {currentGuessLocation && (
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-purple-500/30 animate-slide-up">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MapPin className="text-blue-400" />
                <h3 className="text-2xl font-bold">
                  {currentGuessLocation.city || 'Geheime Location'}, {currentGuessLocation.country}
                </h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                <Activity className="inline mr-2" size={16} />
                {currentGuessLocation.count} aktuelle Stimmungs-Einträge
              </p>

              {!showResult ? (
                <div>
                  <p className="text-lg mb-4 text-yellow-300">
                    🎯 Wie ist die Stimmung dort gerade?
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleGuess('positive')}
                      className="py-3 px-6 bg-green-600/20 border-2 border-green-500 rounded-xl hover:bg-green-600/40 transition-all transform hover:scale-105"
                    >
                      😊 Positiv
                    </button>
                    <button
                      onClick={() => handleGuess('neutral')}
                      className="py-3 px-6 bg-gray-600/20 border-2 border-gray-500 rounded-xl hover:bg-gray-600/40 transition-all transform hover:scale-105"
                    >
                      😐 Neutral
                    </button>
                    <button
                      onClick={() => handleGuess('negative')}
                      className="py-3 px-6 bg-red-600/20 border-2 border-red-500 rounded-xl hover:bg-red-600/40 transition-all transform hover:scale-105"
                    >
                      😔 Negativ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-fade-in">
                  {userGuess === currentGuessLocation.state ? (
                    <div className="text-green-400">
                      <Trophy size={48} className="mx-auto mb-2" />
                      <p className="text-2xl font-bold">Richtig! +10 YRA 🎉</p>
                    </div>
                  ) : (
                    <div className="text-red-400">
                      <p className="text-xl">Leider falsch. Die Stimmung war {currentGuessLocation.state}</p>
                    </div>
                  )}
                  <button
                    onClick={() => loadLiveMoodData()}
                    className="mt-4 py-2 px-6 bg-purple-600 rounded-xl hover:bg-purple-700 transition-all"
                  >
                    Nächste Location →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-2xl"
            >
              <span className="flex items-center gap-2">
                <Unlock size={20} />
                Kostenlos starten
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
            </button>

            <button className="px-8 py-4 border-2 border-purple-500 rounded-full font-bold text-lg hover:bg-purple-500/20 transition-all">
              <Play size={20} className="inline mr-2" />
              Demo ansehen
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-scroll" />
          </div>
        </div>
      </section>

      {/* Game Mechanics Section */}
      <section className="relative z-30 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                So funktioniert's
              </span>
            </h2>
            <p className="text-xl text-gray-400">Werde zum Meister der globalen Emotionen</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
                  <Target size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">1. Location wählen</h3>
                <p className="text-gray-400">
                  Klicke auf einen pulsierenden Punkt auf dem 3D-Globus und entdecke Städte weltweit
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-6">
                  <Brain size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Stimmung raten</h3>
                <p className="text-gray-400">
                  Nutze deine Intuition und rate: Positiv, Neutral oder Negativ?
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-yellow-500/30 hover:border-yellow-500/60 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                  <Coins size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">3. YRA verdienen</h3>
                <p className="text-gray-400">
                  Jede richtige Antwort bringt dir YRA-Coins für exklusive Features!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-30 py-20 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                Mehr als nur ein Spiel
              </span>
            </h2>
            <p className="text-xl text-gray-400">Entdecke die Kraft kollektiver Emotionen</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Users />,
                title: "Familien-Tracking",
                desc: "Erstelle Pseudonyme für Partner & Familie",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Shield />,
                title: "Bot-Schutz",
                desc: "Faire Spielbedingungen durch KI-Sicherheit",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <Activity />,
                title: "60+ Indikatoren",
                desc: "Präzise Stimmungserfassung mit Nuancen",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <Trophy />,
                title: "Global Ranking",
                desc: "Miss dich mit Spielern weltweit",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <Sparkles />,
                title: "Live-Updates",
                desc: "Echtzeit-Stimmungsdaten alle 30 Sekunden",
                color: "from-red-500 to-pink-500"
              },
              {
                icon: <Rocket />,
                title: "YRA-Ökosystem",
                desc: "Tausche Coins gegen Premium-Features",
                color: "from-indigo-500 to-purple-500"
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300`} />
                <div className="relative bg-gray-900/60 backdrop-blur p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-30 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-3xl p-12 border border-purple-500/30">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-yellow-400 mb-2">2.3M+</div>
                <div className="text-gray-400">Tägliche Vorhersagen</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">180+</div>
                <div className="text-gray-400">Länder aktiv</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-400 mb-2">89%</div>
                <div className="text-gray-400">Genauigkeit Top-Spieler</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-purple-400 mb-2">50M</div>
                <div className="text-gray-400">YRA im Umlauf</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-30 py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              Bereit, die Welt zu fühlen?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Werde Teil der globalen Emotions-Community und starte deine Reise!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl"
            >
              <span className="flex items-center gap-3">
                <Star className="animate-spin-slow" />
                Jetzt kostenlos starten
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Keine Kreditkarte erforderlich • DSGVO-konform • In 30 Sekunden startklar
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s both;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        @keyframes scroll {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="1" fill="white" opacity="0.5"/></svg>') repeat;
          animation: stars-move 200s linear infinite;
        }

        .twinkling {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="25" cy="25" r="0.5" fill="white" opacity="0.3"/><circle cx="75" cy="75" r="0.5" fill="white" opacity="0.3"/></svg>') repeat;
          animation: stars-move 100s linear infinite;
        }

        @keyframes stars-move {
          from { transform: translateX(0); }
          to { transform: translateX(-100px); }
        }
      `}</style>
    </div>
  );
}