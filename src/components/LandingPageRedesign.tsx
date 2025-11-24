import { useEffect, useState, useRef } from 'react';
import { 
  Globe2, Sparkles, TrendingUp, Shield, Brain, 
  Award, Users, MapPin, Activity, Zap, Star,
  ChevronRight, Play, Lock, Unlock, Heart,
  Trophy, Coins, Target, Rocket, MapPin as MapPinIcon, Navigation
} from 'lucide-react';
import { sessionManager, type AssessmentData, type SessionData } from '../lib/session-manager';
import { MoodSymbolPalette, type SymbolType } from './MoodSymbolPalette';
import { MoodAssessmentPopup, type MoodType } from './MoodAssessmentPopup';
import { SYMBOLS } from './MoodSymbolPalette';

// Google Maps Types deklarieren
declare global {
  interface Window {
    google: typeof google;
  }
}


interface LandingPageRedesignProps {
  onGetStarted: () => void;
  onNavigateToOld?: () => void;
}

export function LandingPageRedesign({ onGetStarted, onNavigateToOld }: LandingPageRedesignProps) {
  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'none' | 'requesting' | 'granted' | 'denied'>('none');
  const [isGlobeLoaded, setIsGlobeLoaded] = useState(false);
  
  // Session & YRA State
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSymbol, setDraggedSymbol] = useState<SymbolType | null>(null);
  
  // Assessment State
  const [showAssessmentPopup, setShowAssessmentPopup] = useState(false);
  const [assessmentPosition, setAssessmentPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingAssessment, setPendingAssessment] = useState<{ symbolType: SymbolType; lat: number; lng: number } | null>(null);
  const [yraEarned, setYraEarned] = useState<number | null>(null);
  const [showYraNotification, setShowYraNotification] = useState(false);
  
  // UI State
  const [scrollY, setScrollY] = useState(0);
  const [showLocationOptions, setShowLocationOptions] = useState(true);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const assessmentMarkersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const animationPausedRef = useRef<boolean>(false);
  const userLocationSetRef = useRef<boolean>(false); // Verhindert Animation nach Standort-Setzung

  // Session initialisieren
  useEffect(() => {
    const initSession = async () => {
      await sessionManager.initializeSession();
      const data = await sessionManager.getSessionData();
      setSessionData(data);
    };
    initSession();
  }, []);

  // Session-Daten regelmäßig aktualisieren (nur wenn Backend verfügbar)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const updateSessionData = async () => {
      try {
        const data = await sessionManager.getSessionData();
        setSessionData(data);
      } catch (error: any) {
        // Session-Fehler abfangen - wenn Session nicht existiert, initialisiere eine neue
        if (error?.code === 'SESSION_NOT_FOUND' || error?.message?.includes('Session mit ID')) {
          try {
            // Versuche Session neu zu initialisieren
            await sessionManager.initializeSession();
            const newData = await sessionManager.getSessionData();
            setSessionData(newData);
          } catch (initError) {
            // Wenn Initialisierung fehlschlägt, ignoriere Fehler (Tabelle existiert möglicherweise nicht)
            console.warn('⚠️ [LandingPage] Session konnte nicht initialisiert werden:', initError);
          }
        } else {
          // Andere Fehler loggen, aber nicht crashen lassen
          console.warn('⚠️ [LandingPage] Fehler beim Laden der Session-Daten:', error);
        }
      }
    };

    // Initiales Laden
    updateSessionData();

    // Nur alle 10 Sekunden aktualisieren (reduziert Anfragen)
    intervalId = setInterval(updateSessionData, 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

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
      console.warn('⚠️ Google Maps API Key nicht gefunden.');
      return;
    }

    // Verwende zentrale Google Maps Loader-Funktion
    // Nur laden wenn API-Key vorhanden ist
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ Google Maps API Key nicht konfiguriert - 3D-Globus wird ohne Maps-Funktionalität geladen');
      // Initialisiere trotzdem den Globe ohne Maps
      initGoogleEarth();
      return;
    }

    import('../lib/google-maps-loader').then(({ loadGoogleMapsAPI }) => {
      loadGoogleMapsAPI(apiKey)
        .then(() => {
          initGoogleEarth();
        })
        .catch((error) => {
          console.warn('⚠️ Google Maps API konnte nicht geladen werden:', error.message);
          console.warn('3D-Globus wird ohne Maps-Funktionalität geladen');
          // Initialisiere trotzdem den Globe ohne Maps
          initGoogleEarth();
        });
    });

    return () => {
      // Cleanup: Animation stoppen
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Marker entfernen
      assessmentMarkersRef.current.forEach(marker => marker.setMap(null));
      assessmentMarkersRef.current = [];
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

      // Wenn mapId gesetzt ist, können keine styles verwendet werden
      // Styles müssen über Google Cloud Console konfiguriert werden
      const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
      
      const mapConfig: google.maps.MapOptions = {
        center: { lat: 20, lng: 0 },
        zoom: 2.5,
        heading: 0,
        tilt: 45,
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
      };
      
      // Nur mapId setzen wenn vorhanden, sonst styles verwenden
      if (mapId && mapId !== "DEMO_MAP_ID") {
        mapConfig.mapId = mapId;
        // Styles werden über Cloud Console konfiguriert wenn mapId vorhanden ist
      } else {
        // Nur styles setzen wenn keine mapId vorhanden ist
        mapConfig.styles = darkStyle;
      }
      
      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapConfig);

      setIsGlobeLoaded(true);
      
      // Initialisiere Event-Handler für User-Interaktionen
      setupMapInteractionHandlers(googleMapRef.current);
      
      // Click-Handler für Symbol-Platzierung
      googleMapRef.current.addListener('click', handleMapClick);
      
      // Initialisiere Adresssuche
      initAutocomplete();
      
      // Starte Animation nur wenn noch kein Standort gesetzt wurde
      if (!userLocationSetRef.current) {
        animateGlobe();
      }
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Karte:', error);
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
        // Starte Animation nur wenn kein Standort gesetzt wurde
        if (!animationFrameRef.current && googleMapRef.current && !userLocationSetRef.current) {
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

    // Stoppe Animation wenn User bereits seinen Standort gesetzt hat
    if (userLocationSetRef.current) {
      console.log('🛑 [ANIMATION] Gestoppt - User hat Standort gesetzt');
      return;
    }

    // Wenn bereits eine Animation läuft, nicht erneut starten
    if (animationFrameRef.current) {
      return;
    }

    let heading = 0;
    const animate = () => {
      // Stoppe Animation wenn pausiert, User interagiert oder Standort gesetzt wurde
      if (!googleMapRef.current || 
          animationPausedRef.current || 
          isUserInteractingRef.current ||
          userLocationSetRef.current) {
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
      // HINWEIS: Google empfiehlt ab März 2025 PlaceAutocompleteElement statt Autocomplete
      // für neue Projekte. Die alte API funktioniert weiterhin, sollte aber später migriert werden.
      // Siehe: https://developers.google.com/maps/documentation/javascript/places-migration-overview
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
          const location = place.geometry.location!;
          const loc = {
            lat: location.lat(),
            lng: location.lng(),
          };
          
          // Stoppe Animation bevor Standort gesetzt wird
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          userLocationSetRef.current = true;
          
          // Setze User-Location
          setUserLocation(loc);
          setLocationStatus('granted');
          setShowLocationOptions(false);
          
          // Zentriere Karte auf ausgewählte Adresse
          googleMapRef.current.setCenter(loc);
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


  // Location-Funktionen
  const requestLocationPermission = () => {
    setLocationStatus('requesting');
    
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      alert('Geolocation wird von diesem Browser nicht unterstützt');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Stoppe Animation bevor Standort gesetzt wird
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        userLocationSetRef.current = true;
        
        setUserLocation(loc);
        setLocationStatus('granted');
        setShowLocationOptions(false);
        
        // Zentriere Karte auf Standort
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat: loc.lat, lng: loc.lng });
          googleMapRef.current.setZoom(15);
        }
      },
      (error) => {
        setLocationStatus('denied');
        console.warn('Standortzugriff verweigert:', error);
      }
    );
  };

  // Drag & Drop Handler
  const handleSymbolDragStart = (symbolType: SymbolType) => {
    setIsDragging(true);
    setDraggedSymbol(symbolType);
  };

  const handleSymbolDragEnd = () => {
    setIsDragging(false);
    setDraggedSymbol(null);
  };

  // Karten-Click Handler für Symbol-Platzierung
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isDragging || !draggedSymbol || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Konvertiere Karten-Koordinaten zu Bildschirm-Koordinaten für Popup
    if (googleMapRef.current && mapRef.current && e.domEvent) {
      // Verwende direkt die DOM-Event-Koordinaten
      const domEvent = e.domEvent as MouseEvent;
      const x = domEvent.clientX;
      const y = domEvent.clientY;

      setPendingAssessment({ symbolType: draggedSymbol, lat, lng });
      setAssessmentPosition({ x, y });
      setShowAssessmentPopup(true);
      setIsDragging(false);
      setDraggedSymbol(null);
    }
  };

  // Assessment bestätigen
  const handleAssessmentConfirm = async (mood: MoodType, intensity?: number) => {
    if (!pendingAssessment) return;

    const assessment: AssessmentData = {
      symbolType: pendingAssessment.symbolType,
      latitude: pendingAssessment.lat,
      longitude: pendingAssessment.lng,
      mood,
      intensity,
    };

    const result = await sessionManager.saveAssessment(assessment);

    if (result.success && result.yraEarned) {
      setYraEarned(result.yraEarned);
      setShowYraNotification(true);
      
      // Update Session-Daten
      const updatedData = await sessionManager.getSessionData();
      setSessionData(updatedData);
      
      // Füge Marker zur Karte hinzu
      addAssessmentMarker(pendingAssessment.lat, pendingAssessment.lng, mood, pendingAssessment.symbolType);
      
      // Verstecke Notification nach 3 Sekunden
      setTimeout(() => {
        setShowYraNotification(false);
        setYraEarned(null);
      }, 3000);
    } else if (result.error) {
      alert(result.error);
    }

    setShowAssessmentPopup(false);
    setPendingAssessment(null);
    setAssessmentPosition(null);
  };

  // Marker zur Karte hinzufügen
  const addAssessmentMarker = (lat: number, lng: number, mood: MoodType, symbolType: SymbolType) => {
    if (!googleMapRef.current || !window.google) return;

    const symbol = SYMBOLS.find(s => s.type === symbolType);
    const emoji = symbol?.emoji || '👤';
    
    const color = mood === 'positive' ? '#10b981' : 
                 mood === 'negative' ? '#ef4444' : '#6b7280';

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: color,
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: `${emoji} ${mood}`,
    });

    assessmentMarkersRef.current.push(marker);
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
          {/* Symbol-Palette Sidebar */}
          {userLocation && isGlobeLoaded && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[20] w-[280px]">
              <MoodSymbolPalette
                onSymbolDragStart={handleSymbolDragStart}
                onSymbolDragEnd={handleSymbolDragEnd}
                isDragging={isDragging}
                disabled={!userLocation}
              />
            </div>
          )}
          
          {/* Karte */}
          <div 
            ref={mapRef} 
            className={`w-full h-full opacity-80 ${isDragging ? 'cursor-crosshair' : ''}`}
          />
          
          {/* Overlay mit Interaktion */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
          
          {/* Drag-Hinweis */}
          {isDragging && draggedSymbol && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[30] bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/50 animate-pulse">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {SYMBOLS.find(s => s.type === draggedSymbol)?.emoji}
                </div>
                <div className="text-lg font-semibold text-white">
                  Klicke auf die Karte, um das Symbol zu platzieren
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Assessment Popup */}
        {showAssessmentPopup && assessmentPosition && pendingAssessment && (
          <MoodAssessmentPopup
            symbolType={pendingAssessment.symbolType}
            position={assessmentPosition}
            onClose={() => {
              setShowAssessmentPopup(false);
              setPendingAssessment(null);
              setAssessmentPosition(null);
            }}
            onConfirm={handleAssessmentConfirm}
          />
        )}

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
              Erfasse die Stimmung deines Umfelds
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-slide-up">
            Platziere Symbole auf der Karte und bewerte die Stimmung der Menschen um dich herum.<br/>
            <span className="text-yellow-400 font-semibold">Sammle YRA-Coins</span> für jede Einschätzung!
          </p>

          {/* Location Selection */}
          {showLocationOptions && (
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-purple-500/30 animate-slide-up max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">📍 Wo befindest du dich?</h3>
                <p className="text-gray-400">Wähle deinen Standort, um zu beginnen</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                    <button
                  onClick={requestLocationPermission}
                  disabled={locationStatus === 'requesting'}
                  className="py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                  <Navigation size={24} />
                  <span className="font-semibold">
                    {locationStatus === 'requesting' ? 'Lade Standort...' : 'Meinen Standort verwenden'}
                  </span>
                    </button>
                
                <div className="relative">
                  <input
                    ref={autocompleteInputRef}
                    type="text"
                    placeholder="🔍 Adresse eingeben..."
                    className="w-full py-4 px-6 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    onFocus={() => {
                      if (googleMapRef.current && autocompleteRef.current) {
                        // Autocomplete wird automatisch initialisiert
                      }
                    }}
                  />
                  </div>
                </div>
                    </div>
                  )}

          {/* YRA Balance Display */}
          {sessionData && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-4 mb-8 border border-yellow-500/30 max-w-md mx-auto animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Deine Session</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {sessionData.yraBalance} YRA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Einschätzungen</div>
                  <div className="text-xl font-semibold text-white">
                    {sessionData.assessmentsCount}
                  </div>
                </div>
              </div>
                </div>
              )}

          {/* YRA Notification */}
          {showYraNotification && yraEarned && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[2000] bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-2xl animate-bounce">
              <div className="flex items-center gap-3">
                <Trophy size={32} className="text-white" />
                <div>
                  <div className="text-xl font-bold text-white">+{yraEarned} YRA!</div>
                  <div className="text-sm text-white/90">Einschätzung gespeichert</div>
                </div>
              </div>
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
                  <MapPinIcon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">1. Standort wählen</h3>
                <p className="text-gray-400">
                  Gib deinen Standort frei oder tippe eine Adresse ein, um zu beginnen
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-6">
                  <Users size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Symbole platzieren</h3>
                <p className="text-gray-400">
                  Ziehe Symbole (Frau, Mann, Kind, Familie, Gruppe) auf die Karte und bewerte die Stimmung
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
                  Für jede Einschätzung erhältst du YRA-Coins! Später kannst du sie zu deinem Account hinzufügen
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

