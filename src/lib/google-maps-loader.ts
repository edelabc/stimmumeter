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

  // Erstelle neues Script
  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Verwende Standard-Version, nicht Beta
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Warte bis alle benötigten Klassen verfügbar sind
      const checkClasses = () => {
        if (window.google && 
            window.google.maps && 
            window.google.maps.Map && 
            typeof window.google.maps.Map === 'function') {
          mapsLoaded = true;
          console.log('✅ [MAPS] Google Maps API erfolgreich geladen');
          resolve();
        } else {
          // Prüfe erneut nach kurzer Verzögerung
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.Map) {
              mapsLoaded = true;
              console.log('✅ [MAPS] Google Maps API erfolgreich geladen (verzögert)');
              resolve();
            } else {
              reject(new Error('Google Maps API konnte nicht initialisiert werden'));
            }
          }, 100);
        }
      };
      
      // Führe Prüfung sofort und nach kurzer Verzögerung aus
      checkClasses();
    };
    
    script.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error('Fehler beim Laden der Google Maps API'));
    };
    
    document.head.appendChild(script);
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


