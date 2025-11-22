import { useEffect, useState, useRef } from 'react';

// Google Maps Types deklarieren
declare global {
  interface Window {
    google: typeof google;
  }
}

interface InteractiveEarthProps {
  onNavigate?: (url: string) => void;
}

export function InteractiveEarth({ onNavigate }: InteractiveEarthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Standort erforderlich');
  const [currentLocation, setCurrentLocation] = useState('-');
  const [currentCoords, setCurrentCoords] = useState('-');
  const [avatarCount, setAvatarCount] = useState(0);
  const [yraBalance, setYraBalance] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showForecast, setShowForecast] = useState(false);
  const [heatMapVisible, setHeatMapVisible] = useState(true);
  const [currentAvatar, setCurrentAvatar] = useState<HTMLElement | null>(null);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitializing, setMapInitializing] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const avatarsOverlayRef = useRef<HTMLDivElement>(null);
  const avatarPopupRef = useRef<HTMLDivElement>(null);
  const avatarsRef = useRef<HTMLElement[]>([]);

  const initGoogleMaps = async () => {
    // Prüfe nochmal ob Container verfügbar ist
    if (!mapContainerRef.current) {
      console.error('❌ [MAPS] mapContainerRef.current ist null - kann nicht initialisieren');
      return;
    }
    
    console.log('✅ [MAPS] mapContainerRef verfügbar:', mapContainerRef.current);
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.includes('xxxxxxxxxxxxx')) {
      console.error('❌ Google Maps API Key nicht konfiguriert');
      console.error('API Key:', apiKey);
      return;
    }

    console.log('🔵 [MAPS] Starte Google Maps Initialisierung...');
    console.log('🔵 [MAPS] API Key vorhanden:', !!apiKey);

    try {
      // Lade Google Maps JavaScript API (Standard-Version, nicht Beta)
      if (!window.google || !window.google.maps) {
        console.log('🔵 [MAPS] Lade Google Maps Script...');
        await loadGoogleMapsScript(apiKey);
        console.log('🔵 [MAPS] Script geladen');
      } else {
        console.log('🔵 [MAPS] Google Maps bereits geladen');
      }

      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API konnte nicht geladen werden');
      }

      console.log('🔵 [MAPS] Erstelle Karte...');
      
      // Verwende Standard Google Maps API (nicht Beta)
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 50.9375, lng: 6.9603 },
        zoom: 5,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        heading: 0,
        tilt: 45,
        disableDefaultUI: true,
        backgroundColor: '#000000',
        // Styles entfernt um Warnung zu vermeiden (kann über Cloud Console konfiguriert werden)
      });

      console.log('✅ [MAPS] Karte erstellt:', mapInstanceRef.current);
      setMapLoaded(true);
      setMapInitializing(false);
      
      // Starte Animation nach kurzer Verzögerung
      setTimeout(() => {
        animateGlobe();
      }, 500);
      
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren der Google Maps:', error);
      console.error('Error Details:', error);
      setMapInitializing(false);
    }
  };

  const loadGoogleMapsScript = async (apiKey: string): Promise<void> => {
    // Verwende zentrale Google Maps Loader-Funktion
    const { loadGoogleMapsAPI } = await import('../lib/google-maps-loader');
    return loadGoogleMapsAPI(apiKey);
  };

  const animateGlobe = () => {
    if (!mapInstanceRef.current) {
      console.warn('⚠️ [ANIMATION] mapInstanceRef.current ist null');
      return;
    }
    
    console.log('🔵 [ANIMATION] Starte Globus-Animation...');
    let heading = 0;
    const animate = () => {
      if (!mapInstanceRef.current) return;
      heading = (heading + 0.2) % 360;
      try {
        mapInstanceRef.current.setHeading(heading);
        mapInstanceRef.current.setTilt(45);
      } catch (error) {
        console.warn('⚠️ [ANIMATION] Fehler bei Animation:', error);
      }
      requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    // Loading Screen
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Click outside to close popup
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarPopupRef.current && !avatarPopupRef.current.contains(e.target as Node)) {
        setShowAvatarPopup(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Separater useEffect für Google Maps Initialisierung - wartet auf DOM-Element
  useEffect(() => {
    if (isLoading || mapInitializing || mapLoaded) {
      console.log('⏸️ [MAPS] Warte auf:', { isLoading, mapInitializing, mapLoaded });
      return; // Warte bis Loading Screen weg ist und nicht bereits initialisiert
    }
    
    console.log('🔵 [MAPS] Starte Initialisierungs-Check...');
    
    // Warte bis mapContainerRef verfügbar ist
    let retryCount = 0;
    const maxRetries = 50; // Maximal 5 Sekunden warten
    
    const checkAndInit = () => {
      retryCount++;
      
      if (mapContainerRef.current) {
        console.log('✅ [MAPS] mapContainerRef verfügbar, starte Initialisierung');
        setMapInitializing(true);
        initGoogleMaps();
      } else if (retryCount < maxRetries) {
        console.warn(`⚠️ [MAPS] mapContainerRef noch nicht verfügbar (Versuch ${retryCount}/${maxRetries}), versuche erneut...`);
        setTimeout(checkAndInit, 100);
      } else {
        console.error('❌ [MAPS] mapContainerRef konnte nach', maxRetries, 'Versuchen nicht gefunden werden');
      }
    };

    // Starte sofort (nach Loading Screen)
    checkAndInit();
  }, [isLoading, mapInitializing, mapLoaded]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setLocationStatus('Standort aktiv');
          setCurrentLocation('Köln, Deutschland');
          setCurrentCoords(`${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°`);
          
          // Update Google Maps view
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat: loc.lat, lng: loc.lng });
            mapInstanceRef.current.setZoom(10);
          }
          
          generateAvatars();
        },
        (error) => {
          alert('Bitte erlaube den Standortzugriff für die volle Funktionalität');
        }
      );
    } else {
      alert('Geolocation wird von diesem Browser nicht unterstützt');
    }
  };

  const generateAvatars = () => {
    if (!avatarsOverlayRef.current) return;
    
    const overlay = avatarsOverlayRef.current;
    const moods = ['positive', 'neutral', 'negative'];
    const emojis: Record<string, string> = {
      'positive': '😊',
      'neutral': '😐',
      'negative': '😔'
    };
    
    // Clear existing avatars
    avatarsRef.current.forEach(avatar => avatar.remove());
    avatarsRef.current = [];
    
    // Generate 8-12 random avatars
    const avatarCount = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < avatarCount; i++) {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.id = `avatar-${i}`;
      
      const mood = moods[Math.floor(Math.random() * moods.length)];
      avatar.classList.add(mood);
      
      // Random position
      avatar.style.left = Math.random() * 80 + 10 + '%';
      avatar.style.top = Math.random() * 80 + 10 + '%';
      avatar.style.animationDelay = Math.random() * 20 + 's';
      
      // Avatar icon
      const icon = document.createElement('div');
      icon.className = 'avatar-icon';
      icon.innerHTML = emojis[mood];
      avatar.appendChild(icon);
      
      // Click handler
      avatar.onclick = (e) => {
        e.stopPropagation();
        setCurrentAvatar(avatar);
        setPopupPosition({ x: e.pageX, y: e.pageY });
        setShowAvatarPopup(true);
      };
      
      overlay.appendChild(avatar);
      avatarsRef.current.push(avatar);
    }
    
    setAvatarCount(avatarCount);
  };

  const assessAvatar = (mood: string) => {
    if (!currentAvatar) return;
    
    let newBalance = yraBalance + 3; // Base reward
    
    // Check if correct (simplified)
    const avatarMood = currentAvatar.classList.contains('positive') ? 'positive' :
                      currentAvatar.classList.contains('negative') ? 'negative' : 'neutral';
    
    if (mood === avatarMood) {
      newBalance += 10; // Bonus for correct
    }
    
    setYraBalance(newBalance);
    setAssessmentCount(assessmentCount + 1);
    setAccuracy(Math.round((newBalance / ((assessmentCount + 1) * 13)) * 100));
    
    // Remove assessed avatar
    if (currentAvatar) {
      currentAvatar.style.opacity = '0.3';
      currentAvatar.style.pointerEvents = 'none';
    }
    
    setShowAvatarPopup(false);
    setCurrentAvatar(null);
  };

  const setGeneralMood = (mood: string) => {
    setYraBalance(yraBalance + 5);
  };

  const toggleHeatMap = () => {
    console.log('🔵 [HEATMAP] Toggle Heat Map:', !heatMapVisible);
    setHeatMapVisible(!heatMapVisible);
  };

  const showLogin = () => {
    setShowForecast(true);
    alert('Nach dem Login: KI-Prognosen, personalisierte Erfassung und historische Analysen verfügbar!');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center flex-col transition-opacity duration-500">
        <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 animate-spin mb-8" />
        <div className="text-gray-400 text-sm">Initialisiere Global Mood Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[400px_1fr] min-h-[calc(100vh-4rem)] relative bg-black text-white overflow-hidden">
      {/* Left Control Panel */}
      <div className="bg-[rgba(15,23,42,0.95)] backdrop-blur-[20px] border-r border-white/10 p-8 overflow-y-auto relative z-[100]">
        <div className="text-[1.8rem] font-bold mb-1 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          WAMELI
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-10">
          Global Mood Intelligence
        </div>

        {/* Location Permission */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <span className="text-sm">{locationStatus}</span>
          </div>
          {!userLocation && (
            <button
              onClick={requestLocation}
              className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📍 Standort freigeben
            </button>
          )}
        </div>

        {/* Current Location */}
        {userLocation && (
          <div className="bg-white/3 rounded-xl p-5 mb-8">
            <div className="text-xl font-semibold mb-1">{currentLocation}</div>
            <div className="text-sm text-gray-500 font-mono">{currentCoords}</div>
          </div>
        )}

        {/* General Mood Assessment */}
        {userLocation && (
          <div className="mb-8">
            <div className="text-sm text-gray-400 uppercase tracking-wider mb-4">
              Allgemeine Stimmungslage hier
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { mood: 'positive', emoji: '😊', label: 'Positiv' },
                { mood: 'neutral', emoji: '😐', label: 'Neutral' },
                { mood: 'negative', emoji: '😔', label: 'Negativ' }
              ].map(({ mood, emoji, label }) => (
                <button
                  key={mood}
                  onClick={() => setGeneralMood(mood)}
                  className="py-4 px-2.5 bg-white/3 border border-white/10 rounded-lg text-gray-400 text-sm cursor-pointer transition-all hover:bg-white/8 hover:-translate-y-0.5 flex flex-col items-center gap-1 hover:border-green-500 hover:text-green-500"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Info */}
        {userLocation && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
            <div className="text-2xl font-semibold text-green-500">{avatarCount}</div>
            <div className="text-sm text-gray-400 mt-1">Personen in deiner Nähe</div>
            <div className="mt-2.5 text-xs text-gray-500">
              Klicke auf die Avatare um deren Stimmung einzuschätzen
            </div>
          </div>
        )}

        {/* Stats */}
        {userLocation && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { value: yraBalance, label: 'YRA Balance' },
              { value: assessmentCount, label: 'Einschätzungen' },
              { value: `${accuracy}%`, label: 'Genauigkeit' },
              { value: streak, label: 'Serie' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/3 border border-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-yellow-500">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Login CTA */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5 text-center">
          <div className="text-lg font-semibold mb-2.5">Erweiterte Features</div>
          <div className="text-sm text-gray-400 mb-5 leading-relaxed">
            • KI-Prognosen bis 14 Tage<br />
            • Personalisierte Umfeld-Erfassung<br />
            • Historische Stimmungsanalysen<br />
            • Wetter- & Zeit-Korrelationen
          </div>
          <button
            onClick={showLogin}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/30"
          >
            Jetzt einloggen →
          </button>
        </div>
      </div>

      {/* Right Globe Container */}
      <div className="relative w-full min-h-[calc(100vh-4rem)] bg-black">
        {/* Google Maps Container - WICHTIG: ref muss gesetzt sein bevor useEffect läuft */}
        {!isLoading && (
          <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />
        )}
        
        {/* Loading Indicator für Karte */}
        {!mapLoaded && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-sm">Lade Karte...</p>
              {mapInitializing && <p className="text-white text-xs mt-2">Initialisiere Google Maps...</p>}
            </div>
          </div>
        )}

        {/* Avatars Overlay */}
        <div ref={avatarsOverlayRef} className="absolute inset-0 pointer-events-none z-10">
          {/* Mood Zones - Heat Map */}
          {heatMapVisible && (
            <>
              <div 
                className="absolute rounded-full opacity-30 blur-[20px] pointer-events-none animate-pulse"
                style={{
                  width: '200px',
                  height: '200px',
                  top: '20%',
                  left: '30%',
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, transparent 70%)',
                }}
              />
              <div 
                className="absolute rounded-full opacity-30 blur-[20px] pointer-events-none animate-pulse"
                style={{
                  width: '150px',
                  height: '150px',
                  top: '50%',
                  left: '60%',
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)',
                }}
              />
              <div 
                className="absolute rounded-full opacity-30 blur-[20px] pointer-events-none animate-pulse"
                style={{
                  width: '180px',
                  height: '180px',
                  top: '70%',
                  left: '20%',
                  background: 'radial-gradient(circle, rgba(234, 179, 8, 0.6) 0%, transparent 70%)',
                }}
              />
            </>
          )}
        </div>

        {/* Heat Map Toggle */}
        <button
          onClick={toggleHeatMap}
          className={`absolute top-5 right-5 backdrop-blur-[10px] border rounded-lg py-2.5 px-5 cursor-pointer transition-all z-[100] ${
            heatMapVisible 
              ? 'bg-blue-500/30 border-blue-500/50 text-blue-300' 
              : 'bg-[rgba(15,23,42,0.95)] border-white/10 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
          }`}
        >
          🗺️ Heat Map {heatMapVisible ? '(Aktiv)' : ''}
        </button>

        {/* Forecast Panel */}
        {showForecast && (
          <div className="absolute bottom-5 left-5 bg-[rgba(15,23,42,0.95)] backdrop-blur-[20px] border border-white/10 rounded-xl p-5 w-[350px] z-[100]">
            <div className="text-base font-semibold mb-4 flex items-center gap-2.5">
              <span>📊</span>
              <span>14-Tage Prognose</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => (
                <div key={idx} className="text-center py-2.5 px-1.5 bg-white/3 rounded-md text-xs">
                  <div className="text-gray-500 mb-1">{day}</div>
                  <div className="text-lg">{['😊', '😐', '😊', '😔', '😊', '😊', '😐'][idx]}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Prognose-Genauigkeit: 87% basierend auf historischen Daten
            </div>
          </div>
        )}

        {/* Avatar Popup */}
        {showAvatarPopup && (
          <div
            ref={avatarPopupRef}
            className="absolute bg-[rgba(15,23,42,0.95)] backdrop-blur-[10px] border border-white/10 rounded-xl p-4 min-w-[200px] z-[200]"
            style={{ left: popupPosition.x + 10, top: popupPosition.y + 10 }}
          >
            <div className="font-semibold mb-2.5">Person einschätzen</div>
            <div className="text-sm text-gray-500 mb-2.5">
              Wie schätzt du die Stimmung dieser Person ein?
            </div>
            <div className="flex gap-2 mt-2.5">
              {[
                { mood: 'positive', emoji: '😊' },
                { mood: 'neutral', emoji: '😐' },
                { mood: 'negative', emoji: '😔' }
              ].map(({ mood, emoji }) => (
                <button
                  key={mood}
                  onClick={() => assessAvatar(mood)}
                  className="flex-1 py-2 bg-white/5 border border-white/10 rounded-md text-gray-400 text-xs cursor-pointer transition-all hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes walk {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(100px) translateY(50px); }
          50% { transform: translateX(50px) translateY(100px); }
          75% { transform: translateX(-50px) translateY(50px); }
          100% { transform: translateX(0) translateY(0); }
        }
        
        .avatar {
          position: absolute;
          width: 40px;
          height: 40px;
          pointer-events: all;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: walk 20s linear infinite;
        }
        
        .avatar-icon {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .avatar.positive .avatar-icon {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .avatar.neutral .avatar-icon {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .avatar.negative .avatar-icon {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .avatar:hover {
          transform: scale(1.2);
          z-index: 100;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

