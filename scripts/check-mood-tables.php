<?php
/**
 * Prüfe mood_assessments, mood_entries und mood_indicator_values in Supabase
 */

require_once __DIR__ . '/../config.local.php';

// Supabase Credentials
$supabaseUrl = 'https://apacsqcodgyohiebjhjb.supabase.co';
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWNzcWNvZGd5b2hpZWJqaGIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2MTY4MTY5MCwiZXhwIjoyMDc3MjU3NjkwfQ.kO4pA7lYA2zz-7rsxm6senq7y_Th9iDYW3W6CA5PN2o';

// Versuche auch aus .env zu laden
$envFile = __DIR__ . '/../.env';
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
            $supabaseUrl = $value;
        } elseif ($key === 'VITE_SUPABASE_ANON_KEY') {
            $anonKey = $value;
        }
    }
}

echo "🔍 Prüfe Supabase-Tabellen...\n";
echo "URL: $supabaseUrl\n";
echo "Key (erste 20 Zeichen): " . substr($anonKey, 0, 20) . "...\n\n";

$tables = ['mood_assessments', 'mood_entries', 'mood_indicator_values'];

foreach ($tables as $table) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📋 Tabelle: $table\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    // Versuche verschiedene Abfragen
    $urls = [
        'select=*' => $supabaseUrl . '/rest/v1/' . $table . '?select=*&limit=1000',
        'select=count' => $supabaseUrl . '/rest/v1/' . $table . '?select=id&limit=1',
        'ohne select' => $supabaseUrl . '/rest/v1/' . $table . '?limit=1000',
    ];
    
    foreach ($urls as $method => $url) {
        echo "\n🔹 Versuche: $method\n";
        echo "URL: $url\n";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $anonKey,
                'Authorization: Bearer ' . $anonKey,
                'Content-Type: application/json',
                'Prefer: return=representation'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_VERBOSE => false
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            echo "❌ cURL Fehler: $error\n";
            continue;
        }
        
        echo "HTTP Code: $httpCode\n";
        
        if ($httpCode === 200 || $httpCode === 206) {
            $data = json_decode($response, true);
            if (is_array($data)) {
                $count = count($data);
                echo "✅ Erfolg! Gefundene Datensätze: $count\n";
                if ($count > 0) {
                    echo "Erste Spalten: " . implode(', ', array_keys($data[0])) . "\n";
                    if ($count <= 5) {
                        echo "Alle Daten:\n";
                        print_r($data);
                    } else {
                        echo "Erster Datensatz:\n";
                        print_r($data[0]);
                    }
                }
                break; // Erfolgreich, weiter zur nächsten Tabelle
            } else {
                echo "⚠️ Response ist kein Array: " . substr($response, 0, 200) . "\n";
            }
        } elseif ($httpCode === 401) {
            echo "❌ Authentifizierungsfehler - API Key ungültig\n";
        } elseif ($httpCode === 404) {
            echo "⚠️ Tabelle nicht gefunden (404)\n";
        } else {
            echo "❌ Fehler: " . substr($response, 0, 300) . "\n";
        }
    }
    
    echo "\n";
}

echo "\n✅ Prüfung abgeschlossen!\n";




