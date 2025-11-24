/**
 * Browser-Cache-Lösch-Skript für Stimmumeter
 * 
 * Verwendung:
 * 1. Im Browser-Konsole einfügen und ausführen
 * 2. Oder als Bookmarklet verwenden
 * 3. Oder in der HTML-Seite einbinden
 */

(function() {
    'use strict';
    
    console.log('🧹 Starte Cache-Löschung...');
    
    // Cache-Keys die gelöscht werden sollen
    const localStorageKeys = ['auth_token', 'auth_user'];
    const sessionStoragePatterns = [
        'mood_assessment_session_id',
        'cookieConsent',
        'session_yra_',
        'last_assessment_'
    ];
    
    let clearedLocalStorage = 0;
    let clearedSessionStorage = 0;
    
    // localStorage löschen
    console.log('📦 Lösche localStorage...');
    localStorageKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            clearedLocalStorage++;
            console.log(`   ✅ Gelöscht: ${key}`);
        }
    });
    
    // Alle anderen localStorage Keys durchgehen
    const allLocalStorageKeys = Object.keys(localStorage);
    allLocalStorageKeys.forEach(key => {
        if (!localStorageKeys.includes(key) && 
            (key.startsWith('auth_') || key.startsWith('stimmumeter_'))) {
            localStorage.removeItem(key);
            clearedLocalStorage++;
            console.log(`   ✅ Gelöscht: ${key}`);
        }
    });
    
    // sessionStorage löschen
    console.log('📦 Lösche sessionStorage...');
    const allSessionStorageKeys = Object.keys(sessionStorage);
    allSessionStorageKeys.forEach(key => {
        let shouldDelete = false;
        
        // Prüfe gegen Patterns
        for (const pattern of sessionStoragePatterns) {
            if (key === pattern || key.startsWith(pattern)) {
                shouldDelete = true;
                break;
            }
        }
        
        // Prüfe auf stimmumeter-relevante Keys
        if (!shouldDelete && (key.includes('mood') || key.includes('session') || key.includes('assessment'))) {
            shouldDelete = true;
        }
        
        if (shouldDelete) {
            sessionStorage.removeItem(key);
            clearedSessionStorage++;
            console.log(`   ✅ Gelöscht: ${key}`);
        }
    });
    
    // Service Worker Cache löschen (falls vorhanden)
    if ('caches' in window) {
        console.log('📦 Lösche Service Worker Cache...');
        caches.keys().then(names => {
            if (names.length > 0) {
                Promise.all(names.map(name => caches.delete(name))).then(() => {
                    console.log(`   ✅ ${names.length} Service Worker Cache(s) gelöscht`);
                });
            } else {
                console.log('   ℹ️  Keine Service Worker Caches gefunden');
            }
        });
    }
    
    // Ergebnis ausgeben
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Cache-Löschung abgeschlossen!');
    console.log(`   localStorage: ${clearedLocalStorage} Einträge gelöscht`);
    console.log(`   sessionStorage: ${clearedSessionStorage} Einträge gelöscht`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Alert für Benutzer
    alert(`Cache erfolgreich gelöscht!\n\nlocalStorage: ${clearedLocalStorage} Einträge\nsessionStorage: ${clearedSessionStorage} Einträge\n\nDie Seite wird jetzt neu geladen.`);
    
    // Seite neu laden
    window.location.reload(true);
})();

