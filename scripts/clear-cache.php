<?php
/**
 * Cache-Lösch-Skript für Stimmumeter
 * 
 * Löscht:
 * - Browser localStorage/sessionStorage (via JavaScript)
 * - Vite Build-Cache
 * - PHP Session-Cache
 * 
 * Verwendung:
 * php scripts/clear-cache.php
 * 
 * Oder im Browser:
 * http://localhost/stimmumeter/scripts/clear-cache.php
 */

echo "🧹 Cache-Löschung wird gestartet...\n\n";

$cleared = [];
$errors = [];

// 1. Vite Build-Cache löschen
$viteCacheDirs = [
    __DIR__ . '/../node_modules/.vite',
    __DIR__ . '/../dist',
];

foreach ($viteCacheDirs as $dir) {
    if (is_dir($dir)) {
        try {
            deleteDirectory($dir);
            $cleared[] = "✅ Vite Cache: " . basename($dir);
        } catch (Exception $e) {
            $errors[] = "❌ Fehler beim Löschen von $dir: " . $e->getMessage();
        }
    }
}

// 2. PHP Session-Cache löschen (falls Sessions aktiv sind)
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
    $cleared[] = "✅ PHP Session-Cache gelöscht";
}

// 3. Browser-Cache löschen (via HTML-Seite)
$htmlPage = generateClearBrowserCachePage();

// Ausgabe
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📋 Cache-Löschung abgeschlossen\n\n";

if (!empty($cleared)) {
    echo "✅ Erfolgreich gelöscht:\n";
    foreach ($cleared as $item) {
        echo "   $item\n";
    }
    echo "\n";
}

if (!empty($errors)) {
    echo "⚠️  Fehler:\n";
    foreach ($errors as $error) {
        echo "   $error\n";
    }
    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n";

// Wenn im Browser aufgerufen, zeige HTML-Seite
if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/html; charset=utf-8');
    echo $htmlPage;
    exit;
}

// CLI-Ausgabe
echo "🌐 Browser-Cache:\n";
echo "   Öffnen Sie die folgende URL im Browser, um den Browser-Cache zu löschen:\n";
echo "   http://localhost/stimmumeter/scripts/clear-cache.php?clearBrowser=1\n\n";

/**
 * Löscht ein Verzeichnis rekursiv
 */
function deleteDirectory($dir) {
    if (!is_dir($dir)) {
        return;
    }
    
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            deleteDirectory($path);
        } else {
            unlink($path);
        }
    }
    rmdir($dir);
}

/**
 * Generiert HTML-Seite zum Löschen des Browser-Caches
 */
function generateClearBrowserCachePage() {
    return <<<'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cache löschen - Stimmumeter</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            margin-top: 0;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            transition: background 0.3s;
        }
        button:hover {
            background: #5568d3;
        }
        .cache-list {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cache-list ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .cache-list li {
            margin: 5px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Cache löschen</h1>
        
        <div id="status"></div>
        
        <div class="cache-list">
            <h3>Folgende Caches werden gelöscht:</h3>
            <ul>
                <li>localStorage: auth_token, auth_user</li>
                <li>sessionStorage: mood_assessment_session_id, cookieConsent, session_yra_*, last_assessment_*</li>
                <li>Browser-Cache (falls aktiviert)</li>
            </ul>
        </div>
        
        <button onclick="clearAllCache()">✅ Alle Caches löschen</button>
        <button onclick="clearLocalStorage()">🗑️ Nur localStorage löschen</button>
        <button onclick="clearSessionStorage()">🗑️ Nur sessionStorage löschen</button>
        <button onclick="location.reload(true)">🔄 Seite neu laden</button>
        
        <div id="result"></div>
    </div>

    <script>
        // Cache-Keys die gelöscht werden sollen
        const localStorageKeys = ['auth_token', 'auth_user'];
        const sessionStoragePatterns = [
            'mood_assessment_session_id',
            'cookieConsent',
            'session_yra_',
            'last_assessment_'
        ];

        function showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.className = 'status ' + type;
            statusDiv.innerHTML = message;
        }

        function clearLocalStorage() {
            let cleared = 0;
            let notFound = 0;
            
            // Spezifische Keys löschen
            localStorageKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    cleared++;
                } else {
                    notFound++;
                }
            });
            
            // Alle anderen Keys durchgehen (für dynamische Keys)
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!localStorageKeys.includes(key) && 
                    (key.startsWith('auth_') || key.startsWith('stimmumeter_'))) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            });
            
            showStatus(`✅ localStorage gelöscht: ${cleared} Einträge entfernt`, 'success');
            updateResult(`localStorage: ${cleared} Einträge gelöscht`);
        }

        function clearSessionStorage() {
            let cleared = 0;
            
            // Spezifische Keys löschen
            sessionStoragePatterns.forEach(pattern => {
                const keys = Object.keys(sessionStorage);
                keys.forEach(key => {
                    if (key === pattern || key.startsWith(pattern)) {
                        sessionStorage.removeItem(key);
                        cleared++;
                    }
                });
            });
            
            // Alle anderen stimmumeter-relevanten Keys löschen
            const allKeys = Object.keys(sessionStorage);
            allKeys.forEach(key => {
                if (key.includes('mood') || key.includes('session') || key.includes('assessment')) {
                    sessionStorage.removeItem(key);
                    cleared++;
                }
            });
            
            showStatus(`✅ sessionStorage gelöscht: ${cleared} Einträge entfernt`, 'success');
            updateResult(`sessionStorage: ${cleared} Einträge gelöscht`);
        }

        function clearAllCache() {
            clearLocalStorage();
            clearSessionStorage();
            
            // Service Worker Cache löschen (falls vorhanden)
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }
            
            showStatus('✅ Alle Caches erfolgreich gelöscht!', 'success');
            updateResult('Alle Caches wurden erfolgreich gelöscht. Sie können die Seite jetzt neu laden.');
        }

        function updateResult(message) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="status info">' + message + '</div>';
        }

        // Automatisch löschen wenn Parameter gesetzt ist
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('clearBrowser') === '1') {
            clearAllCache();
        }
    </script>
</body>
</html>
HTML;
}



