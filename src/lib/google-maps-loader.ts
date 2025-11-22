/**
 * Zentrale Google Maps API Loader-Funktion
 * Verhindert mehrfaches Laden der API
 */

declare global {
  interface Window {
    google: typeof google;
  }
}

let mapsLoadPromise: Promise<void> | null = null;
let mapsLoaded = false;

/**
 * Lädt die Google Maps JavaScript API einmalig
 * @param apiKey Google Maps API Key
 * @returns Promise das resolved wenn Maps geladen ist
 */
export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  // Wenn bereits geladen, return resolved promise
  if (mapsLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Wenn bereits am Laden, return existing promise
  if (mapsLoadPromise) {
    return mapsLoadPromise;
  }

  // Prüfe ob Script bereits im DOM ist
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    // Script vorhanden, warte auf Laden
    mapsLoadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          mapsLoaded = true;
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google) {
          reject(new Error('Google Maps API konnte nicht geladen werden'));
        }
      }, 10000);
    });
    return mapsLoadPromise;
  }

  // Erstelle neues Script mit Error-Callback-Handler
  // Setze globalen Error-Handler für Google Maps Fehler
  const errorCallbackName = `gm_authFailure_${Date.now()}`;
  (window as any)[errorCallbackName] = () => {
    mapsLoadPromise = null;
    mapsLoaded = false;
    console.error('❌ [MAPS] Google Maps Authentifizierungsfehler - API Key ungültig oder Berechtigungen fehlen');
    console.error('Bitte prüfe:');
    console.error('1. Ist der API Key korrekt in .env als VITE_GOOGLE_MAPS_API_KEY gesetzt?');
    console.error('2. Ist die Maps JavaScript API in Google Cloud Console aktiviert?');
    console.error('3. Ist die Places API in Google Cloud Console aktiviert?');
    console.error('4. Ist Billing für das Projekt aktiviert?');
    console.error('5. Sind die Domain-Restriktionen korrekt gesetzt?');
  };
  
  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Verwende Standard-Version mit Callback für Error-Handling
    // callback wird verwendet für erfolgreiches Laden
    const callbackName = `initGoogleMaps_${Date.now()}`;
    
    // Setze Callback für erfolgreiches Laden
    (window as any)[callbackName] = () => {
      // Warte bis alle benötigten Klassen verfügbar sind
      const checkClasses = () => {
        if (window.google && 
            window.google.maps && 
            window.google.maps.Map && 
            typeof window.google.maps.Map === 'function') {
          // Prüfe auch ob Places API verfügbar ist
          if (window.google.maps.places && window.google.maps.places.Autocomplete) {
            mapsLoaded = true;
            console.log('✅ [MAPS] Google Maps API mit Places erfolgreich geladen');
            delete (window as any)[callbackName];
            resolve();
          } else {
            // Places API nicht verfügbar - warne aber lade trotzdem
            console.warn('⚠️ [MAPS] Google Maps API geladen, aber Places API nicht verfügbar');
            console.warn('Bitte aktiviere die Places API in Google Cloud Console');
            mapsLoaded = true;
            delete (window as any)[callbackName];
            resolve();
          }
        } else {
          // Prüfe erneut nach kurzer Verzögerung
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.Map) {
              if (window.google.maps.places && window.google.maps.places.Autocomplete) {
                mapsLoaded = true;
                console.log('✅ [MAPS] Google Maps API erfolgreich geladen (verzögert)');
              } else {
                mapsLoaded = true;
                console.warn('⚠️ [MAPS] Google Maps geladen, Places API fehlt');
              }
              delete (window as any)[callbackName];
              resolve();
            } else {
              delete (window as any)[callbackName];
              reject(new Error('Google Maps API konnte nicht initialisiert werden'));
            }
          }, 500);
        }
      };
      
      // Führe Prüfung sofort aus
      checkClasses();
    };
    
    // Konstruiere URL mit callback für erfolgreiches Laden
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      mapsLoadPromise = null;
      delete (window as any)[callbackName];
      delete (window as any)[errorCallbackName];
      reject(new Error('Fehler beim Laden der Google Maps API - Script konnte nicht geladen werden'));
    };
    
    document.head.appendChild(script);
    
    // Timeout-Fallback falls Callback nicht aufgerufen wird
    setTimeout(() => {
      if (!mapsLoaded && mapsLoadPromise) {
        delete (window as any)[callbackName];
        delete (window as any)[errorCallbackName];
        mapsLoadPromise = null;
        reject(new Error('Google Maps API konnte nicht innerhalb von 10 Sekunden geladen werden'));
      }
    }, 10000);
  });

  return mapsLoadPromise;
}

/**
 * Prüft ob Google Maps API bereits geladen ist
 */
export function isGoogleMapsLoaded(): boolean {
  return mapsLoaded && !!window.google && !!window.google.maps;
}

/**
 * Reset der Loader-Status (nur für Tests)
 */
export function resetGoogleMapsLoader() {
  mapsLoadPromise = null;
  mapsLoaded = false;
}


