<?php
/**
 * Lösche alle Daten aus Supabase-Datenbank
 * 
 * ⚠️ WICHTIG: Dieses Skript löscht ALLE Daten aus Supabase!
 * Verwenden Sie es nur, wenn Sie sicher sind, dass alle Daten
 * erfolgreich nach MySQL migriert wurden!
 * 
 * VERWENDUNG:
 * php scripts/delete-supabase-data.php
 * 
 * ODER im Browser:
 * http://localhost/stimmumeter/scripts/delete-supabase-data.php
 */

// Lade Konfiguration
require_once __DIR__ . '/../config.local.php';

// Supabase Credentials aus .env oder Umgebungsvariablen laden
function loadSupabaseCredentials() {
    $envFile = __DIR__ . '/../.env';
    $credentials = [
        'url' => '',
        'anon_key' => '',
        'service_role_key' => ''
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
            } elseif ($key === 'SUPABASE_SERVICE_ROLE_KEY') {
                $credentials['service_role_key'] = $value;
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
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supabase Daten löschen</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}.info{color:#0ff;}</style></head><body>';
    echo '<h1>🗑️ Supabase-Daten löschen</h1><pre>';
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
    exit(1);
}

logMessage("✅ Supabase-URL gefunden: " . $supabase['url'], 'success');

// Prüfe ob Service Role Key vorhanden ist (für DELETE-Operationen benötigt)
if (empty($supabase['service_role_key'])) {
    logMessage("⚠️ WICHTIG: Service Role Key nicht gefunden!", 'warning');
    logMessage("⚠️ DELETE-Operationen erfordern den Service Role Key!", 'warning');
    logMessage("⚠️ Bitte fügen Sie SUPABASE_SERVICE_ROLE_KEY in die .env Datei ein.", 'warning');
    logMessage("", 'info');
    logMessage("ℹ️ Sie können die Daten auch manuell in Supabase löschen:", 'info');
    logMessage("ℹ️ 1. Öffnen Sie das Supabase Dashboard", 'info');
    logMessage("ℹ️ 2. Gehen Sie zu 'Table Editor'", 'info');
    logMessage("ℹ️ 3. Wählen Sie jede Tabelle aus und löschen Sie alle Zeilen", 'info');
    exit(1);
}

// Alle Tabellen (in umgekehrter Reihenfolge wegen Foreign Keys)
$allTables = [
    'user_agreement_consents',
    'bot_protection_logs',
    'yra_rewards_config',
    'session_yra',
    'mood_assessments',
    't_platzhalter_definitionen',
    't_vereinbarungs_logs',
    't_vereinbarungen',
    't_vereinbarungstitel',
    'user_account_config',
    'ai_configurations',
    'payments',
    'payment_provider_webhooks',
    'payment_providers',
    'help_texts',
    'invoice_items',
    'invoices',
    'usage_records',
    'user_subscriptions',
    'plan_billing_items',
    'billing_item_types',
    'plan_subscription_config',
    'plan_trial_config',
    'pricing_plans',
    'exchange_rates',
    'currencies',
    'site_settings',
    'legal_pages',
    'footer_settings',
    'footer_menu_items',
    'menu_items',
    'admin_menu_items',
    'admin_users',
    'mood_indicator_values',
    'mood_entries',
    'mood_indicators',
    'indicator_categories',
    'pseudonyms',
    'users_profile'
];

logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("⚠️ WICHTIG: Dieses Skript löscht ALLE Daten aus Supabase!", 'warning');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("", 'info');

// Frage Bestätigung (nur im CLI)
if ($isCli) {
    logMessage("⚠️ Möchten Sie wirklich ALLE Daten aus Supabase löschen?", 'warning');
    logMessage("⚠️ Geben Sie 'JA' ein, um fortzufahren:", 'warning');
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    fclose($handle);
    
    if (trim($line) !== 'JA') {
        logMessage("❌ Abgebrochen. Keine Daten wurden gelöscht.", 'error');
        exit(0);
    }
} else {
    logMessage("⚠️ Bitte bestätigen Sie im Browser, dass Sie fortfahren möchten.", 'warning');
    logMessage("⚠️ Hinweis: Im Browser-Modus werden die Daten automatisch gelöscht.", 'warning');
    logMessage("", 'info');
    sleep(2); // Kurze Pause
}

// Funktion: Lösche alle Daten aus einer Tabelle
function deleteTableData($url, $serviceRoleKey, $table) {
    // Verwende DELETE mit Service Role Key (umgeht RLS)
    $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?id=neq.00000000-0000-0000-0000-000000000000';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_CUSTOMREQUEST => 'DELETE',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceRoleKey,
            'Authorization: Bearer ' . $serviceRoleKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL Fehler: $error");
    }
    
    if ($httpCode === 200 || $httpCode === 204) {
        // Versuche Anzahl gelöschter Zeilen aus Response zu extrahieren
        $data = json_decode($response, true);
        if (is_array($data)) {
            return count($data);
        }
        return 1; // Erfolgreich, aber unbekannte Anzahl
    } elseif ($httpCode === 404) {
        // Tabelle existiert nicht oder ist leer
        return 0;
    } else {
        throw new Exception("HTTP $httpCode: $response");
    }
}

// Lösche Daten aus allen Tabellen
$totalDeleted = 0;
$totalErrors = 0;

foreach ($allTables as $table) {
    logMessage("", 'info');
    logMessage("🗑️ Lösche Daten aus Tabelle: $table", 'info');
    
    try {
        $deleted = deleteTableData($supabase['url'], $supabase['service_role_key'], $table);
        if ($deleted > 0) {
            logMessage("✅ $deleted Datensätze gelöscht", 'success');
            $totalDeleted += $deleted;
        } else {
            logMessage("ℹ️ Keine Daten zum Löschen gefunden", 'info');
        }
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
        logMessage("❌ Fehler: $errorMsg", 'error');
        $totalErrors++;
        
        // Spezielle Behandlung für bestimmte Fehler
        if (strpos($errorMsg, '404') !== false) {
            logMessage("ℹ️ Tabelle existiert nicht oder ist leer", 'info');
        }
    }
}

// Zusammenfassung
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📊 ZUSAMMENFASSUNG", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("✅ Gelöscht: $totalDeleted Datensätze", 'success');
logMessage("❌ Fehler: $totalErrors", $totalErrors > 0 ? 'error' : 'success');

if ($totalErrors === 0) {
    logMessage("", 'info');
    logMessage("✅ Alle Supabase-Daten wurden erfolgreich gelöscht!", 'success');
    logMessage("ℹ️ Die Tabellen-Strukturen bleiben erhalten.", 'info');
} else {
    logMessage("", 'info');
    logMessage("⚠️ Es gab Fehler beim Löschen. Bitte prüfen Sie die Logs oben.", 'warning');
}

if (!$isCli) {
    echo '</pre></body></html>';
}

?>

