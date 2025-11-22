import { useEffect, useState, useRef } from 'react';
import { 
  Globe2, Sparkles, TrendingUp, Shield, Brain, 
  Award, Users, MapPin, Activity, Zap, Star,
  ChevronRight, Play, Lock, Unlock, Heart,
  Trophy, Coins, Target, Rocket
} from 'lucide-react';
import { fetchLiveMoodData, generateDemoMoodData, type MoodDataCell } from '../lib/mood-api';

// Google Maps Types deklarieren
declare global {
  interface Window {
    google: typeof google;
  }
}

// Verwende MoodDataCell aus dem API-Service
type MoodData = MoodDataCell;

interface UserStats {
  totalGuesses: number;
  correctGuesses: number;
  yraBalance: number;
  streak: number;
  globalRank?: number;
}

interface LandingPageRedesignProps {
  onGetStarted: () => void;
  onNavigateToOld?: () => void;
}

export function LandingPageRedesign({ onGetStarted, onNavigateToOld }: LandingPageRedesignProps) {
  const [liveMoodData, setLiveMoodData] = useState<MoodData[]>([]);
  const [currentGuessLocation, setCurrentGuessLocation] = useState<MoodData | null>(null);
  const [isGlobeLoaded, setIsGlobeLoaded] = useState(false);
  const [userGuess, setUserGuess] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const animationPausedRef = useRef<boolean>(false);

  // Parallax-Effekt
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Google Maps 3D-Globus initialisieren
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Google Maps API Key nicht gefunden. Verwende Demo-Modus.');
      // Lade Demo-Daten auch ohne Karte
      loadLiveMoodData();
      return;
    }

    // Verwende zentrale Google Maps Loader-Funktion
    import('../lib/google-maps-loader').then(({ loadGoogleMapsAPI }) => {
      loadGoogleMapsAPI(apiKey)
        .then(() => {
          initGoogleEarth();
        })
        .catch((error) => {
          console.error('❌ Fehler beim Laden der Google Maps API:', error);
          loadLiveMoodData(); // Fallback zu Demo-Daten
        });
    });

    return () => {
      // Cleanup: Animation stoppen
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Marker entfernen
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const initGoogleEarth = async () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Warte bis Google Maps API vollständig geladen ist
      // Prüfe ob Map-Konstruktor verfügbar ist
      let retries = 0;
      const maxRetries = 50; // 5 Sekunden maximale Wartezeit (50 * 100ms)
      
      while (retries < maxRetries) {
        if (window.google && 
            window.google.maps && 
            window.google.maps.Map && 
            typeof window.google.maps.Map === 'function') {
          break; // API ist bereit
        }
        // Warte 100ms und versuche es erneut
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Finale Prüfung ob Map-Konstruktor verfügbar ist
      if (!window.google || 
          !window.google.maps || 
          !window.google.maps.Map || 
          typeof window.google.maps.Map !== 'function') {
        throw new Error('Google Maps Map-Konstruktor ist nicht verfügbar');
      }

      // Verwende Standard Google Maps API (kompatibel mit älteren Versionen) 
      // CACHE-BREAKER: Fixed importLibrary issue - 2025-11-22
      console.log('🔧 [MAPS] Verwende Standard Google Maps API ohne importLibrary');
      
      // Dunkler Stil für Deep/Dark Theme
      const darkStyle: google.maps.MapTypeStyle[] = [
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
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        heading: 0,
        tilt: 45,
        styles: darkStyle,
        disableDefaultUI: false, // Aktiviert Zoom-Controls
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        panControl: false, // Pan wird über Maus/Touch gesteuert
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        draggable: true, // Verschieben aktiviert
        keyboardShortcuts: true, // Tastatur-Navigation aktiviert
        scrollwheel: true, // Mausrad-Zoom aktiviert
        disableDoubleClickZoom: false, // Doppelklick-Zoom aktiviert
        backgroundColor: '#000000',
        controlSize: 32,
      });

      setIsGlobeLoaded(true);
      
      // Initialisiere Event-Handler für User-Interaktionen
      setupMapInteractionHandlers(googleMapRef.current);
      
      // Initialisiere Adresssuche
      initAutocomplete();
      
      // Starte Animation
      animateGlobe();
      
      // Lade Live-Daten
      loadLiveMoodData();
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Karte:', error);
      loadLiveMoodData(); // Fallback zu Demo-Daten
    }
  };

  const setupMapInteractionHandlers = (map: google.maps.Map) => {
    // Pausiere Animation während User-Interaktion
    const pauseAnimation = () => {
      isUserInteractingRef.current = true;
      animationPausedRef.current = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // Setze Timer um Animation nach User-Interaktion wieder zu starten
    let resumeTimeout: NodeJS.Timeout | null = null;
    const resumeAnimation = () => {
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }
      resumeTimeout = setTimeout(() => {
        isUserInteractingRef.current = false;
        animationPausedRef.current = false;
        if (!animationFrameRef.current && googleMapRef.current) {
          animateGlobe();
        }
      }, 2000); // Warte 2 Sekunden nach letzter Interaktion
    };

    // Event-Handler für Drag/Pan
    map.addListener('dragstart', () => {
      pauseAnimation();
    });

    map.addListener('dragend', () => {
      resumeAnimation();
    });

    // Event-Handler für Zoom
    map.addListener('zoom_changed', () => {
      pauseAnimation();
      resumeAnimation();
    });

    // Event-Handler für Mouse-Down (beginnt Interaktion)
    map.addListener('mousedown', () => {
      pauseAnimation();
    });

    // Event-Handler für Mouse-Up (beendet Interaktion)
    map.addListener('mouseup', () => {
      resumeAnimation();
    });

    // Event-Handler für Touch-Start (Mobile)
    map.addListener('touchstart', () => {
      pauseAnimation();
    });

    // Event-Handler für Touch-End (Mobile)
    map.addListener('touchend', () => {
      resumeAnimation();
    });

    console.log('✅ [MAPS] Interaction-Handler registriert');
  };

  const animateGlobe = () => {
    if (!googleMapRef.current || animationPausedRef.current) {
      return;
    }

    // Wenn bereits eine Animation läuft, nicht erneut starten
    if (animationFrameRef.current) {
      return;
    }

    let heading = 0;
    const animate = () => {
      // Stoppe Animation wenn pausiert oder User interagiert
      if (!googleMapRef.current || animationPausedRef.current || isUserInteractingRef.current) {
        animationFrameRef.current = null;
        return;
      }

      heading = (heading + 0.1) % 360; // Langsamere Animation für bessere Performance
      try {
        googleMapRef.current.moveCamera({
          heading,
          tilt: 45,
          zoom: 2.5,
        });
      } catch (error) {
        console.warn('⚠️ [ANIMATION] Fehler bei Animation:', error);
        animationFrameRef.current = null;
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const initAutocomplete = () => {
    if (!autocompleteInputRef.current || !googleMapRef.current) {
      // Warte kurz und versuche es erneut
      setTimeout(() => {
        if (autocompleteInputRef.current && googleMapRef.current) {
          initAutocomplete();
        }
      }, 500);
      return;
    }

    // Prüfe ob Places API verfügbar ist
    if (!window.google?.maps?.places) {
      console.warn('⚠️ [MAPS] Places API nicht verfügbar');
      console.warn('Bitte aktiviere die Places API in Google Cloud Console');
      
      // Verstecke das Eingabefeld wenn Places API nicht verfügbar ist
      if (autocompleteInputRef.current) {
        const inputElement = autocompleteInputRef.current as HTMLElement;
        const parentElement = inputElement.parentElement;
        if (parentElement) {
          parentElement.style.display = 'none';
        }
      }
      return;
    }

    try {
      // Erstelle Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          types: ['geocode'],
          fields: ['geometry', 'formatted_address', 'name'],
        }
      );

      // Wenn eine Adresse ausgewählt wird
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry && googleMapRef.current) {
          // Zentriere Karte auf ausgewählte Adresse
          googleMapRef.current.setCenter(place.geometry.location!);
          googleMapRef.current.setZoom(15);
        }
      });

      console.log('✅ [MAPS] Adresssuche initialisiert');
    } catch (error: any) {
      console.error('❌ [MAPS] Fehler beim Initialisieren der Adresssuche:', error);
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        console.error('❌ [MAPS] API Key Problem - bitte prüfe die Google Cloud Console Einstellungen');
      }
      
      // Verstecke das Eingabefeld bei Fehler
      if (autocompleteInputRef.current) {
        const inputElement = autocompleteInputRef.current as HTMLElement;
        const parentElement = inputElement.parentElement;
        if (parentElement) {
          parentElement.style.display = 'none';
        }
      }
    }
  };

  const loadLiveMoodData = async () => {
    try {
      // Versuche API-Endpoint
      const response = await fetchLiveMoodData('15m', 5);
      
      if (response.cells && response.cells.length > 0) {
        setLiveMoodData(response.cells);
        if (googleMapRef.current) {
          updateMapMarkers(response.cells);
        }
      } else {
        throw new Error('Keine Daten verfügbar');
      }
    } catch (error) {
      console.log('📊 Verwende Demo-Daten für die Visualisierung');
      // Fallback Demo-Daten
      const demoData = generateDemoMoodData();
      setLiveMoodData(demoData);
      if (googleMapRef.current) {
        updateMapMarkers(demoData);
      }
    }
  };

  const updateMapMarkers = (data: MoodData[]) => {
    if (!googleMapRef.current || !window.google) return;

    // Prüfe ob Marker-Konstruktor verfügbar ist
    if (!window.google.maps || 
        !window.google.maps.Marker || 
        typeof window.google.maps.Marker !== 'function') {
      console.warn('⚠️ [MAPS] Marker-Konstruktor ist nicht verfügbar');
      return;
    }

    // Entferne alte Marker
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Füge neue Marker hinzu
    data.forEach(location => {
      const color = location.state === 'positive' ? '#10b981' : 
                   location.state === 'negative' ? '#ef4444' : '#6b7280';
      
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
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
    <div className="bg-black text-white overflow-x-hidden">
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
          {/* Adresssuche-Eingabefeld */}
          {isGlobeLoaded && (
            <div className="absolute top-20 left-4 z-[20] bg-black/80 backdrop-blur-md rounded-lg p-2 border border-white/20">
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="🔍 Adresse suchen..."
                className="w-[300px] px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
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
          
          {/* Additional Pages Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            {onNavigateToOld && (
              <button
                onClick={onNavigateToOld}
                className="text-gray-400 hover:text-gray-300 underline transition-colors"
              >
                ← Klassische Startseite
              </button>
            )}
            <button
              onClick={() => window.location.href = '/interactive-earth'}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              🌍 Interaktive Erde
            </button>
            <button
              onClick={() => window.location.href = '/questions-first'}
              className="text-purple-400 hover:text-purple-300 underline transition-colors"
            >
              ❓ Fragen zuerst
            </button>
          </div>
        </div>
      </section>

      <style>{`
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

