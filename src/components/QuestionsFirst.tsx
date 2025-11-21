import { useEffect, useState, useRef } from 'react';

// Google Maps Types deklarieren
declare global {
  interface Window {
    google: typeof google;
  }
}

interface QuestionsFirstProps {
  onNavigate?: (url: string) => void;
}

export function QuestionsFirst({ onNavigate }: QuestionsFirstProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState('partner');
  const [liveAnswer, setLiveAnswer] = useState('68% Positiv ↑');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<'mood' | 'heat' | '3d'>('mood');
  const [is3D, setIs3D] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const rotationRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔵 [QUESTIONS] showIntro:', showIntro);
    if (!showIntro) {
      console.log('🔵 [QUESTIONS] Initialisiere Google Maps...');
      initGoogleMaps();
      startLiveUpdates();
    }
  }, [showIntro]);

  const enterApp = () => {
    console.log('🔵 [QUESTIONS] enterApp aufgerufen');
    setShowIntro(false);
  };

  const initGoogleMaps = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.includes('xxxxxxxxxxxxx')) {
      console.error('❌ [MAPS] Google Maps API Key nicht konfiguriert');
      return;
    }

    console.log('🔵 [MAPS] Starte Google Maps Initialisierung...');
    
    // Warte bis mapRef verfügbar ist
    let retryCount = 0;
    const maxRetries = 50;
    
    const checkAndInit = () => {
      retryCount++;
      
      if (!mapRef.current) {
        if (retryCount < maxRetries) {
          console.warn(`⚠️ [MAPS] mapRef noch nicht verfügbar (Versuch ${retryCount}/${maxRetries})`);
          setTimeout(checkAndInit, 100);
        } else {
          console.error('❌ [MAPS] mapRef konnte nicht gefunden werden');
        }
        return;
      }

      // mapRef ist verfügbar, lade Google Maps
      if (window.google && window.google.maps) {
        console.log('✅ [MAPS] Google Maps bereits geladen');
        createMap();
      } else {
        // Load Google Maps script
        if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
          console.log('🔵 [MAPS] Lade Google Maps Script...');
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            console.log('✅ [MAPS] Script geladen');
            if (window.google && window.google.maps) {
              createMap();
            }
          };
          script.onerror = (error) => {
            console.error('❌ [MAPS] Fehler beim Laden der Google Maps API:', error);
          };
          document.head.appendChild(script);
        } else {
          // Script bereits vorhanden, warte auf Laden
          console.log('🔵 [MAPS] Script bereits vorhanden, warte auf Laden...');
          const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps) {
              console.log('✅ [MAPS] Google Maps geladen');
              clearInterval(checkGoogle);
              createMap();
            }
          }, 100);
          
          // Timeout nach 10 Sekunden
          setTimeout(() => {
            clearInterval(checkGoogle);
            if (!window.google) {
              console.error('❌ [MAPS] Google Maps API konnte nicht geladen werden');
            }
          }, 10000);
        }
      }
    };

    // Starte Initialisierung
    checkAndInit();
  };

  const createMap = () => {
    if (!mapRef.current) {
      console.error('❌ [MAPS] mapRef.current ist null');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error('❌ [MAPS] window.google ist nicht verfügbar');
      return;
    }

    console.log('🔵 [MAPS] Erstelle Karte...');
    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 50.9375, lng: 6.9603 },
        zoom: 5,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        tilt: currentView === '3d' ? 45 : 0,
        heading: 0,
        disableDefaultUI: true,
        styles: [
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
      console.log('✅ [MAPS] Karte erstellt');
      
      addMoodMarkers(map);
      updateInfoCards();
    } catch (error) {
      console.error('❌ [MAPS] Fehler beim Erstellen der Karte:', error);
    }
  };

  const addMoodMarkers = (map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const locations = [
      { lat: 41.3851, lng: 2.1734, mood: 'best', name: 'Barcelona', score: 87 },
      { lat: 52.3676, lng: 4.9041, mood: 'best', name: 'Amsterdam', score: 84 },
      { lat: 55.6761, lng: 12.5683, mood: 'best', name: 'Kopenhagen', score: 82 },
      { lat: 48.1351, lng: 11.5820, mood: 'good', name: 'München', score: 79 },
      { lat: 50.9375, lng: 6.9603, mood: 'good', name: 'Köln', score: 72 },
      { lat: 52.5200, lng: 13.4050, mood: 'neutral', name: 'Berlin', score: 65 },
      { lat: 48.8566, lng: 2.3522, mood: 'good', name: 'Paris', score: 75 },
      { lat: 51.5074, lng: -0.1278, mood: 'neutral', name: 'London', score: 61 }
    ];

    locations.forEach(loc => {
      if (!window.google) return;
      
      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: loc.mood === 'best' ? '#34d399' : 
                     loc.mood === 'good' ? '#60a5fa' : '#fbbf24',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: `${loc.name}: ${loc.score}%`
      });

      markersRef.current.push(marker);
    });
  };

  const updateInfoCards = () => {
    // Info cards werden dynamisch über CSS positioniert
    // In einer echten Implementierung würden diese als Overlay-Komponenten gerendert
  };

  const selectMood = (element: HTMLElement, mood: string) => {
    document.querySelectorAll('.mood-tag').forEach(tag => {
      tag.classList.remove('active');
    });
    
    if (selectedMood === mood) {
      setSelectedMood(null);
    } else {
      element.classList.add('active');
      setSelectedMood(mood);
    }
  };

  const selectPerson = (person: string) => {
    setSelectedPerson(person);
  };

  const showAnswer = (type: string) => {
    console.log('Showing answer for:', type);
  };

  const toggleView = () => {
    console.log('🔵 [VIEW] Toggle View - Aktuell:', currentView);
    
    if (currentView === 'mood') {
      setCurrentView('heat');
      setIs3D(false);
      // Heat Map Ansicht
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        mapInstanceRef.current.setTilt(0);
        mapInstanceRef.current.setHeading(0);
      }
    } else if (currentView === 'heat') {
      setCurrentView('3d');
      setIs3D(true);
      // 3D Ansicht
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        mapInstanceRef.current.setTilt(45);
        mapInstanceRef.current.setHeading(0);
        // Starte Rotation
        start3DRotation();
      }
    } else {
      setCurrentView('mood');
      setIs3D(false);
      // Standard Ansicht
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        mapInstanceRef.current.setTilt(0);
        mapInstanceRef.current.setHeading(0);
      }
    }
  };

  const start3DRotation = () => {
    if (!mapInstanceRef.current) return;
    
    // Stoppe vorherige Rotation
    if (rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
    }
    
    let heading = 0;
    const rotate = () => {
      if (!mapInstanceRef.current || currentView !== '3d') {
        if (rotationRef.current) {
          cancelAnimationFrame(rotationRef.current);
          rotationRef.current = null;
        }
        return;
      }
      heading = (heading + 0.2) % 360;
      try {
        mapInstanceRef.current.setHeading(heading);
        mapInstanceRef.current.setTilt(45);
      } catch (error) {
        console.warn('⚠️ [3D] Fehler bei Rotation:', error);
        if (rotationRef.current) {
          cancelAnimationFrame(rotationRef.current);
          rotationRef.current = null;
        }
        return;
      }
      rotationRef.current = requestAnimationFrame(rotate);
    };
    rotationRef.current = requestAnimationFrame(rotate);
  };

  const stop3DRotation = () => {
    if (rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }
  };

  useEffect(() => {
    if (currentView === '3d' && mapLoaded && mapInstanceRef.current) {
      console.log('🔵 [3D] Starte 3D-Rotation');
      start3DRotation();
    } else {
      stop3DRotation();
    }
    
    return () => {
      stop3DRotation();
    };
  }, [currentView, mapLoaded]);

  const startLiveUpdates = () => {
    const interval = setInterval(() => {
      const values = ['68% Positiv ↑', '71% Positiv ↑', '65% Positiv →', '69% Positiv ↑'];
      const randomValue = values[Math.floor(Math.random() * values.length)];
      setLiveAnswer(randomValue);
    }, 5000);

    return () => clearInterval(interval);
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0a0a1f] to-black z-[9999] flex items-center justify-center">
        <div className="text-center max-w-[900px] p-10">
          {/* Debug Info */}
          <div className="absolute top-4 left-4 text-xs text-white bg-black/50 px-2 py-1 rounded">
            Intro Screen aktiv (showIntro: {showIntro ? 'true' : 'false'})
          </div>
          
          <h1 className="text-[3.5rem] font-black leading-tight mb-10 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent animate-[fadeIn_1s_ease_0.2s_forwards] opacity-0">
            Wie tickt die Welt?
          </h1>
          <h2 className="text-[2.8rem] font-black leading-tight mb-8 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent animate-[fadeIn_1s_ease_0.8s_forwards] opacity-0">
            Wie tickt dein Partner heute, morgen oder in 14 Tagen?
          </h2>
          <h3 className="text-[2.4rem] font-black leading-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-[fadeIn_1s_ease_1.4s_forwards] opacity-0">
            Wo herrscht die beste Stimmung?
          </h3>
          
          <div className="mt-10 animate-[fadeIn_1s_ease_2s_forwards] opacity-0">
            <p className="text-xl text-gray-300 my-4 font-light">
              Wo kannst du <strong className="text-blue-400 font-semibold">Menschen nach deinen Vorlieben</strong> begegnen?
            </p>
            <p className="text-xl text-gray-300 my-4 font-light">
              Wann ist dein <strong className="text-blue-400 font-semibold">Umfeld am empfänglichsten</strong> für deine Ideen?
            </p>
            <p className="text-xl text-gray-300 my-4 font-light">
              Wie wird sich die <strong className="text-blue-400 font-semibold">Stimmung deiner Stadt</strong> entwickeln?
            </p>
          </div>

          <button
            onClick={enterApp}
            className="mt-12 py-4.5 px-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 rounded-[50px] text-white text-lg font-semibold cursor-pointer animate-[fadeIn_0.8s_ease_2.5s_forwards] opacity-0 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40"
          >
            Antworten entdecken →
          </button>
          
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[500px_1fr] h-screen relative bg-black text-white overflow-hidden">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-xs text-gray-500 z-[9999]">
          Hauptansicht aktiv | Map Loaded: {mapLoaded ? 'Ja' : 'Nein'}
        </div>
      )}
      
      {/* Left Control Panel */}
      <div className="bg-gradient-to-b from-[rgba(5,5,15,0.98)] to-[rgba(10,10,30,0.98)] backdrop-blur-[20px] border-r border-white/10 p-8 overflow-y-auto relative z-[100]">
        {/* Question Cards */}
        <div className="mb-8">
          {[
            {
              icon: '🌍',
              title: 'Wie tickt die Welt gerade?',
              answer: 'Global dominiert <span class="text-blue-400 font-semibold">vorsichtiger Optimismus</span> mit <span class="text-blue-400 font-semibold">62% positiver Stimmung</span> weltweit.',
              type: 'world'
            },
            {
              icon: '💑',
              title: 'Wie tickt dein Partner?',
              answer: 'Heute: <span class="text-blue-400 font-semibold">Entspannt & aufgeschlossen</span><br />Morgen: <span class="text-blue-400 font-semibold">Leicht gestresst (Vormittag)</span>',
              type: 'partner'
            },
            {
              icon: '📍',
              title: 'Wo herrscht beste Stimmung?',
              answer: 'Aktuell in <span class="text-blue-400 font-semibold">Barcelona (87% positiv)</span> und <span class="text-blue-400 font-semibold">Amsterdam (84% positiv)</span>',
              type: 'location'
            },
            {
              icon: '🤝',
              title: 'Wo triffst du Gleichgesinnte?',
              answer: 'Basierend auf deinem Profil: <span class="text-blue-400 font-semibold">Kreative & Optimisten</span> findest du gerade im <span class="text-blue-400 font-semibold">Stadtpark (15:00-18:00)</span>',
              type: 'meet'
            }
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => showAnswer(card.type)}
              className="bg-white/2 border border-white/8 rounded-xl p-5 mb-4 cursor-pointer transition-all hover:bg-blue-500/8 hover:border-blue-500/30 hover:translate-x-1 relative overflow-hidden group"
            >
              <div className="text-3xl mb-2.5">{card.icon}</div>
              <div className="text-xl font-bold text-gray-100 mb-2">{card.title}</div>
              <div className="text-sm text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: card.answer }} />
            </div>
          ))}
        </div>

        {/* Live Answer Display */}
        <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/30 rounded-xl p-5 mb-8">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">Live Stimmung Deutschland</div>
          <div className="text-[1.8rem] font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            {liveAnswer}
          </div>
        </div>

        {/* Mood Finder */}
        <div className="bg-white/2 border border-white/8 rounded-xl p-5 mb-8">
          <div className="text-lg font-semibold mb-4 text-gray-100">🎯 Finde Menschen mit dieser Stimmung:</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['optimistisch', 'kreativ', 'motiviert', 'ruhig', 'abenteuerlustig', 'gesellig'].map((mood, idx) => (
              <div
                key={idx}
                onClick={(e) => selectMood(e.currentTarget, mood)}
                className={`px-3 py-1.5 bg-white/5 border border-white/10 rounded-[20px] text-sm cursor-pointer transition-all hover:bg-blue-500/20 hover:border-blue-500/50 hover:scale-105 mood-tag ${selectedMood === mood ? 'active bg-blue-500/30 border-blue-500 text-blue-400' : ''}`}
              >
                {['😊', '🎨', '💪', '🧘', '🚀', '🎉'][idx]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-500">Wähle eine Stimmung → Siehe Orte auf der Karte</div>
        </div>

        {/* Person Ticker */}
        <div className="bg-white/2 border border-white/8 rounded-xl p-5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-base font-semibold text-gray-100">Stimmungsverlauf</div>
            <div className="flex gap-1">
              {['partner', 'child', 'colleague'].map((person) => (
                <button
                  key={person}
                  onClick={() => selectPerson(person)}
                  className={`px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-md text-gray-400 text-xs cursor-pointer transition-all ${selectedPerson === person ? 'active bg-blue-500/20 border-blue-500 text-blue-400' : ''}`}
                >
                  {person === 'partner' ? 'Partner' : person === 'child' ? 'Kind' : 'Kollege'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[
              { label: 'Heute', mood: '😊', time: '8-12h' },
              { label: 'Heute', mood: '😐', time: '13-17h' },
              { label: 'Heute', mood: '😄', time: '18-22h' },
              { label: 'Mo', mood: '😰', time: 'Vormittag' },
              { label: 'Di', mood: '😊', time: 'Ganztags' },
              { label: 'Mi', mood: '😌', time: 'Ganztags' },
              { label: '+7 Tage', mood: '😊', time: 'Trend' }
            ].map((day, idx) => (
              <div key={idx} className="text-center py-2.5 px-1.5 bg-white/3 rounded-lg transition-all hover:bg-blue-500/10 hover:scale-110">
                <div className="text-xs text-gray-500 mb-1">{day.label}</div>
                <div className="text-2xl">{day.mood}</div>
                <div className="text-[0.65rem] text-gray-600 mt-1">{day.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Mood Locations */}
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="text-base font-semibold text-gray-100 mb-4">🏆 Top Stimmungs-Orte jetzt</div>
          {[
            { name: 'Barcelona, Spanien', score: 87, mood: '😄' },
            { name: 'Amsterdam, Niederlande', score: 84, mood: '😊' },
            { name: 'Kopenhagen, Dänemark', score: 82, mood: '😊' },
            { name: 'München, Deutschland', score: 79, mood: '😌' }
          ].map((loc, idx) => (
            <div key={idx} className="flex justify-between items-center py-2.5 px-2.5 bg-black/20 rounded-lg mb-2 transition-all hover:bg-black/40 hover:translate-x-1">
              <span className="text-sm text-gray-200">{loc.name}</span>
              <span className="flex items-center gap-1">
                <span className="text-sm font-semibold text-green-400">{loc.score}%</span>
                <span>{loc.mood}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Globe Container */}
      <div className="relative w-full h-screen bg-black">
        <div ref={mapRef} id="map" className="w-full h-full min-h-[400px]" />
        
        {/* Loading Indicator für Karte */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-sm">Lade Karte...</p>
            </div>
          </div>
        )}

        {/* Heat Map Overlays */}
        {currentView === 'heat' && mapLoaded && (
          <div className="absolute inset-0 pointer-events-none z-10">
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
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute top-5 right-5 flex gap-2.5 z-[100]">
          <button
            onClick={toggleView}
            className={`backdrop-blur-[10px] border rounded-lg py-2.5 px-5 text-white cursor-pointer transition-all hover:-translate-y-0.5 flex items-center gap-2 font-medium ${
              currentView === 'mood'
                ? 'bg-blue-500/30 border-blue-500/50'
                : currentView === 'heat'
                ? 'bg-green-500/30 border-green-500/50'
                : 'bg-purple-500/30 border-purple-500/50'
            }`}
          >
            {currentView === 'mood' && '🗺️ Stimmungs-Ansicht'}
            {currentView === 'heat' && '🔥 Heat Map'}
            {currentView === '3d' && '🌍 3D Globus'}
          </button>
        </div>
      </div>

      <style>{`
        .mood-tag.active {
          background: rgba(96, 165, 250, 0.3) !important;
          border-color: #60a5fa !important;
          color: #60a5fa !important;
        }
      `}</style>
    </div>
  );
}

