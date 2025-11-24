<?php
/**
 * Prüfe Anzahl der mood_indicators in Supabase
 * 
 * VERWENDUNG:
 * php scripts/check-mood-indicators.php
 */

// Lade Konfiguration
require_once __DIR__ . '/../config.local.php';

// Supabase Credentials aus .env oder Umgebungsvariablen laden
function loadSupabaseCredentials() {
    // Versuche .env Datei zu laden
    $envFile = __DIR__ . '/../.env';
    $credentials = [
        'url' => '',
        'anon_key' => ''
    ];
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') === false || strpos(trim($line), '#') === 0) {
                continue;
            }
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            if ($key === 'VITE_SUPABASE_URL') {
                $credentials['url'] = $value;
            } elseif ($key === 'VITE_SUPABASE_ANON_KEY') {
                $credentials['anon_key'] = $value;
            }
        }
    }
    
    // Fallback: Umgebungsvariablen
    if (empty($credentials['url'])) {
        $credentials['url'] = getenv('VITE_SUPABASE_URL') ?: (defined('SUPABASE_URL') ? SUPABASE_URL : '');
    }
    if (empty($credentials['anon_key'])) {
        $credentials['anon_key'] = getenv('VITE_SUPABASE_ANON_KEY') ?: (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : '');
    }
    
    return $credentials;
}

// HTML Output für Browser
$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mood Indicators Check</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}.info{color:#0ff;}</style></head><body>';
    echo '<h1>📊 Mood Indicators Check</h1><pre>';
}

function logMessage($message, $type = 'info') {
    global $isCli;
    $prefix = match($type) {
        'error' => '❌',
        'success' => '✅',
        'warning' => '⚠️',
        'info' => 'ℹ️',
        default => '📋'
    };
    
    $colorClass = match($type) {
        'error' => 'error',
        'success' => 'success',
        'warning' => 'warning',
        'info' => 'info',
        default => ''
    };
    
    if ($isCli) {
        echo "[$prefix] $message\n";
    } else {
        echo "<span class=\"$colorClass\">[$prefix] $message</span>\n";
    }
    flush();
}

// Lade Supabase Credentials
logMessage("🔍 Lade Supabase-Credentials...", 'info');
$supabase = loadSupabaseCredentials();

if (empty($supabase['url']) || empty($supabase['anon_key'])) {
    logMessage("❌ Supabase-Credentials nicht gefunden!", 'error');
    logMessage("Bitte erstellen Sie eine .env Datei mit:", 'warning');
    logMessage("VITE_SUPABASE_URL=https://xxxxx.supabase.co", 'info');
    logMessage("VITE_SUPABASE_ANON_KEY=eyJhbGci...", 'info');
    exit(1);
}

logMessage("✅ Supabase-URL gefunden: " . $supabase['url'], 'success');

// Hole Anzahl der mood_indicators
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📊 Prüfe mood_indicators in Supabase", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');

try {
    // Methode 1: Versuche mit Content-Range Header
    $apiUrl = rtrim($supabase['url'], '/') . '/rest/v1/mood_indicators?select=id&limit=1';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => false,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $supabase['anon_key'],
            'Authorization: Bearer ' . $supabase['anon_key'],
            'Content-Type: application/json',
            'Prefer: count=exact'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    curl_close($ch);
    
    // Parse Content-Range Header
    $count = null;
    if (preg_match('/Content-Range:\s*\d+-\d+\/(\d+)/i', $headers, $matches)) {
        $count = (int)$matches[1];
        logMessage("ℹ️ Anzahl aus Content-Range Header ermittelt", 'info');
    }
    
    if ($httpCode === 404) {
        logMessage("⚠️ Tabelle mood_indicators existiert nicht in Supabase", 'warning');
        exit(1);
    }
    
    // Methode 2: Falls Content-Range nicht funktioniert, hole alle Daten
    if ($count === null) {
        logMessage("ℹ️ Versuche alternative Methode (hole alle IDs)...", 'info');
        $apiUrl = rtrim($supabase['url'], '/') . '/rest/v1/mood_indicators?select=id';
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $apiUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $supabase['anon_key'],
                'Authorization: Bearer ' . $supabase['anon_key'],
                'Content-Type: application/json',
                'Prefer: return=representation'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 60
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if (is_array($data)) {
                $count = count($data);
                logMessage("ℹ️ Anzahl durch Zählen der Datensätze ermittelt", 'info');
            }
        } else {
            logMessage("⚠️ HTTP $httpCode bei Abfrage", 'warning');
        }
    }
    
    if ($count !== null) {
        logMessage("", 'info');
        logMessage("✅ Anzahl der mood_indicators in Supabase: $count", 'success');
        logMessage("", 'info');
        
        // Zeige zusätzliche Informationen
        if ($count > 0) {
            logMessage("ℹ️ Hole Details...", 'info');
            $apiUrl = rtrim($supabase['url'], '/') . '/rest/v1/mood_indicators?select=id,name,is_active&limit=10';
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $apiUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . $supabase['anon_key'],
                    'Authorization: Bearer ' . $supabase['anon_key'],
                    'Content-Type: application/json'
                ],
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_TIMEOUT => 30
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $data = json_decode($response, true);
                if (is_array($data) && !empty($data)) {
                    logMessage("", 'info');
                    logMessage("📋 Erste 10 Einträge:", 'info');
                    foreach ($data as $index => $item) {
                        $name = $item['name'] ?? 'N/A';
                        $isActive = isset($item['is_active']) ? ($item['is_active'] ? '✅' : '❌') : '?';
                        logMessage("  " . ($index + 1) . ". $name (aktiv: $isActive)", 'info');
                    }
                    if ($count > 10) {
                        logMessage("  ... und " . ($count - 10) . " weitere", 'info');
                    }
                }
            }
        }
    } else {
        logMessage("❌ Konnte Anzahl nicht ermitteln (HTTP $httpCode)", 'error');
    }
    
} catch (Exception $e) {
    logMessage("❌ Fehler: " . $e->getMessage(), 'error');
    exit(1);
}

if (!$isCli) {
    echo '</pre></body></html>';
}

