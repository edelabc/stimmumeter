<?php
/**
 * Supabase zu MySQL Klon-Script
 * 
 * Klont alle Daten aus Supabase in die lokale MySQL-Datenbank
 * 
 * VERWENDUNG:
 * php scripts/clone-supabase-to-mysql.php
 * 
 * ODER im Browser:
 * http://localhost/stimmumeter/scripts/clone-supabase-to-mysql.php
 */

// Lade Konfiguration
require_once __DIR__ . '/../config.local.php';

// Supabase Credentials aus .env oder Umgebungsvariablen laden
function loadSupabaseCredentials() {
    // Versuche .env Datei zu laden
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
        $credentials['url'] = getenv('VITE_SUPABASE_URL') ?: SUPABASE_URL;
    }
    if (empty($credentials['anon_key'])) {
        $credentials['anon_key'] = getenv('VITE_SUPABASE_ANON_KEY') ?: SUPABASE_ANON_KEY;
    }
    
    return $credentials;
}

// HTML Output für Browser
$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supabase zu MySQL Klon</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}.info{color:#0ff;}</style></head><body>';
    echo '<h1>🔄 Supabase zu MySQL Klon-Script</h1><pre>';
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

// Verbinde zu MySQL
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    logMessage("✅ MySQL-Verbindung erfolgreich", 'success');
} catch (PDOException $e) {
    logMessage("❌ MySQL-Verbindungsfehler: " . $e->getMessage(), 'error');
    exit(1);
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

// Alle Tabellen aus der Datenbank-Struktur
// Primary Keys werden automatisch aus MySQL ermittelt
$allTables = [
    'users_profile',
    'pseudonyms',
    'mood_indicators',
    'indicator_categories',
    'mood_entries',
    'mood_indicator_values',
    'admin_users',
    'admin_menu_items',
    'menu_items',
    'footer_menu_items',
    'footer_settings',
    'legal_pages',
    'site_settings',
    'currencies',
    'exchange_rates',
    'pricing_plans',
    'plan_trial_config',
    'plan_subscription_config',
    'billing_item_types',
    'plan_billing_items',
    'user_subscriptions',
    'usage_records',
    'invoices',
    'invoice_items',
    'help_texts',
    'payment_providers',
    'payment_provider_webhooks',
    'payments',
    'ai_configurations',
    'user_account_config',
    't_vereinbarungstitel',
    't_vereinbarungen',
    't_vereinbarungs_logs',
    't_platzhalter_definitionen',
    'mood_assessments',
    'session_yra',
    'yra_rewards_config',
    'bot_protection_logs',
    'user_agreement_consents'
];

// Funktion: Hole verfügbare Spalten von Supabase
function getSupabaseColumns($url, $anonKey, $table) {
    // Versuche zuerst alle Spalten zu holen (ohne select)
    $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?limit=1';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $anonKey,
            'Authorization: Bearer ' . $anonKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && !empty($response)) {
        $data = json_decode($response, true);
        if (is_array($data) && !empty($data)) {
            // Hole Spalten aus dem ersten Datensatz
            return array_keys($data[0]);
        }
    }
    
    // Fallback: Versuche mit * select
    $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?select=*&limit=1';
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $anonKey,
            'Authorization: Bearer ' . $anonKey,
            'Content-Type: application/json'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && !empty($response)) {
        $data = json_decode($response, true);
        if (is_array($data) && !empty($data)) {
            return array_keys($data[0]);
        }
    }
    
    return [];
}

// Funktion: Hole MySQL-Spalten
function getMySQLColumns($pdo, $table) {
    try {
        $result = $pdo->query("SHOW COLUMNS FROM `$table`");
        $columns = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $columns[] = $row['Field'];
        }
        return $columns;
    } catch (PDOException $e) {
        return [];
    }
}

// Funktion: Ermittle Primary Key aus MySQL
function getMySQLPrimaryKey($pdo, $table) {
    try {
        $result = $pdo->query("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
        $keys = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $keys[] = $row['Column_name'];
        }
        return !empty($keys) ? $keys[0] : 'id'; // Fallback zu 'id'
    } catch (PDOException $e) {
        return 'id'; // Fallback
    }
}

// Funktion: Hole Daten von Supabase REST API (mit Pagination)
function fetchFromSupabase($url, $anonKey, $table, $columns, $limit = 1000, $serviceRoleKey = null) {
    $allData = [];
    $offset = 0;
    $hasMore = true;
    
    // Verwende Service Role Key falls verfügbar (umgeht RLS)
    $apiKey = $serviceRoleKey ?: $anonKey;
    
    while ($hasMore) {
        if (empty($columns)) {
            // Wenn keine Spalten angegeben, verwende *
            $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?select=*&limit=' . $limit . '&offset=' . $offset;
        } else {
            // Filtere nur vorhandene Spalten
            $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table;
            $apiUrl .= '?select=' . implode(',', $columns) . '&limit=' . $limit . '&offset=' . $offset;
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $apiUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $apiKey,
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
                'Prefer: return=representation'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 60 // Längeres Timeout für große Tabellen
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL Fehler: $error");
        }
        
        if ($httpCode === 404) {
            // Tabelle existiert nicht in Supabase - das ist OK
            return [];
        }
        
        if ($httpCode !== 200) {
            // Bei anderen Fehlern, versuche es ohne select (falls Spalte nicht existiert)
            if (!empty($columns) && strpos($response, 'does not exist') !== false && $offset === 0) {
                // Versuche mit * statt spezifischen Spalten (nur beim ersten Versuch)
                return fetchFromSupabase($url, $anonKey, $table, [], $limit);
            }
            throw new Exception("HTTP $httpCode: $response");
        }
        
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON Parse Fehler: " . json_last_error_msg());
        }
        
        if (empty($data) || !is_array($data)) {
            $hasMore = false;
        } else {
            $allData = array_merge($allData, $data);
            // Wenn weniger Daten zurückkommen als limit, sind wir fertig
            if (count($data) < $limit) {
                $hasMore = false;
            } else {
                $offset += $limit;
            }
        }
    }
    
    return $allData;
}

// Funktion: Füge Daten in MySQL ein
function insertIntoMySQL($pdo, $table, $data, $primaryKey, $mysqlColumns) {
    if (empty($data)) {
        return ['inserted' => 0, 'updated' => 0];
    }
    
    $inserted = 0;
    $updated = 0;
    
    foreach ($data as $row) {
        try {
            // Filtere nur Spalten, die in MySQL existieren
            $filteredRow = [];
            foreach ($row as $key => $value) {
                if (in_array($key, $mysqlColumns)) {
                    // Behandle NULL-Werte
                    if ($value === null) {
                        $filteredRow[$key] = null;
                    }
                    // Behandle JSON-Felder
                    elseif (is_array($value) || is_object($value)) {
                        $jsonValue = json_encode($value);
                        // Prüfe ob es ein gültiger JSON-String ist
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $filteredRow[$key] = $jsonValue;
                        } else {
                            // Falls JSON-Encoding fehlschlägt, versuche es als String
                            $filteredRow[$key] = is_string($value) ? $value : serialize($value);
                        }
                    } else {
                        $filteredRow[$key] = $value;
                    }
                }
            }
            
            if (empty($filteredRow) || !isset($filteredRow[$primaryKey])) {
                continue; // Überspringe wenn Primary Key fehlt
            }
            
            // Prüfe ob Datensatz existiert
            $check = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE `$primaryKey` = ?");
            $check->execute([$filteredRow[$primaryKey]]);
            $exists = $check->fetchColumn() > 0;
            
            if ($exists) {
                // UPDATE
                $columns = array_keys($filteredRow);
                $setParts = [];
                foreach ($columns as $col) {
                    if ($col !== $primaryKey) {
                        $setParts[] = "`$col` = :$col";
                    }
                }
                
                if (empty($setParts)) {
                    continue; // Keine Spalten zum Update
                }
                
                $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE `$primaryKey` = :$primaryKey";
                $stmt = $pdo->prepare($sql);
                
                foreach ($filteredRow as $key => $value) {
                    // Korrekte NULL-Behandlung
                    if ($value === null) {
                        $stmt->bindValue(":$key", null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(":$key", $value);
                    }
                }
                
                $stmt->execute();
                $updated++;
            } else {
                // INSERT
                $columns = array_keys($filteredRow);
                $placeholders = array_map(fn($col) => ":$col", $columns);
                
                $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                
                foreach ($filteredRow as $key => $value) {
                    // Korrekte NULL-Behandlung
                    if ($value === null) {
                        $stmt->bindValue(":$key", null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(":$key", $value);
                    }
                }
                
                $stmt->execute();
                $inserted++;
            }
        } catch (PDOException $e) {
            // Überspringe fehlerhafte Datensätze, aber logge sie
            error_log("Fehler bei Datensatz in $table: " . $e->getMessage());
            continue;
        }
    }
    
    return ['inserted' => $inserted, 'updated' => $updated];
}

// Backup erstellen
logMessage("💾 Erstelle Backup der MySQL-Datenbank...", 'info');
$backupDir = __DIR__ . '/../backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$backupFile = $backupDir . '/mysql_backup_before_supabase_clone_' . date('Y-m-d_H-i-s') . '.sql';
$mysqldumpPath = '/Applications/XAMPP/xamppfiles/bin/mysqldump';
if (!file_exists($mysqldumpPath)) {
    $mysqldumpPath = 'mysqldump';
}

$backupCommand = sprintf(
    '%s -h%s -P%d -u%s %s %s > %s 2>&1',
    escapeshellarg($mysqldumpPath),
    escapeshellarg(DB_HOST),
    defined('DB_PORT') ? DB_PORT : 3306,
    escapeshellarg(DB_USER),
    !empty(DB_PASS) ? '-p' . escapeshellarg(DB_PASS) : '',
    escapeshellarg(DB_NAME),
    escapeshellarg($backupFile)
);

exec($backupCommand, $backupOutput, $backupReturnCode);
if ($backupReturnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
    logMessage("✅ Backup erstellt: $backupFile", 'success');
} else {
    logMessage("⚠️ Backup konnte nicht erstellt werden (fortfahren...)", 'warning');
}

// Klone jede Tabelle
$totalStats = ['inserted' => 0, 'updated' => 0, 'errors' => 0, 'skipped' => 0];

foreach ($allTables as $table) {
    logMessage("", 'info');
    logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
    logMessage("📋 Klone Tabelle: $table", 'info');
    logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
    
    try {
        // Prüfe ob Tabelle in MySQL existiert
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if (!$tableExists) {
            logMessage("⚠️ Tabelle $table existiert nicht in MySQL - überspringe", 'warning');
            $totalStats['skipped']++;
            continue;
        }
        
        // Ermittle Primary Key aus MySQL
        $primaryKey = getMySQLPrimaryKey($pdo, $table);
        logMessage("ℹ️ Primary Key: $primaryKey", 'info');
        
        // Hole MySQL-Spalten
        $mysqlColumns = getMySQLColumns($pdo, $table);
        if (empty($mysqlColumns)) {
            logMessage("⚠️ Keine Spalten in MySQL-Tabelle $table gefunden - überspringe", 'warning');
            $totalStats['skipped']++;
            continue;
        }
        
        logMessage("ℹ️ MySQL-Spalten: " . count($mysqlColumns), 'info');
        
        // Versuche Supabase-Spalten zu holen (optional, für bessere Kompatibilität)
        $supabaseColumns = [];
        try {
            $supabaseColumns = getSupabaseColumns($supabase['url'], $supabase['anon_key'], $table);
            if (!empty($supabaseColumns)) {
                logMessage("ℹ️ Supabase-Spalten: " . count($supabaseColumns), 'info');
                // Verwende nur Spalten, die in beiden existieren
                $columns = array_intersect($supabaseColumns, $mysqlColumns);
            } else {
                // Verwende alle MySQL-Spalten
                $columns = $mysqlColumns;
            }
        } catch (Exception $e) {
            // Falls Supabase-Spalten nicht geholt werden können, verwende MySQL-Spalten
            $columns = $mysqlColumns;
        }
        
        if (empty($columns)) {
            logMessage("⚠️ Keine gemeinsamen Spalten gefunden - überspringe", 'warning');
            $totalStats['skipped']++;
            continue;
        }
        
        // Hole Daten von Supabase (ohne select, damit alle verfügbaren Spalten geladen werden)
        logMessage("⬇️ Lade Daten von Supabase...", 'info');
        try {
            $data = fetchFromSupabase($supabase['url'], $supabase['anon_key'], $table, [], 1000, $supabase['service_role_key'] ?? null);
            
            if ($data === null) {
                logMessage("ℹ️ Tabelle $table existiert nicht in Supabase oder ist leer", 'info');
                continue;
            }
            
            logMessage("✅ " . count($data) . " Datensätze geladen", 'success');
            
            if (empty($data)) {
                logMessage("ℹ️ Keine Daten in Supabase für $table", 'info');
                continue;
            }
            
            // Füge Daten in MySQL ein
            logMessage("⬆️ Übertrage Daten nach MySQL...", 'info');
            $stats = insertIntoMySQL($pdo, $table, $data, $primaryKey, $mysqlColumns);
        } catch (Exception $fetchError) {
            // Spezielle Behandlung für "does not exist" Fehler
            if (strpos($fetchError->getMessage(), 'does not exist') !== false) {
                logMessage("ℹ️ Spalte existiert nicht in Supabase - versuche ohne Spalten-Filter...", 'info');
                // Versuche es nochmal ohne Spalten-Filter
                try {
                    $data = fetchFromSupabase($supabase['url'], $supabase['anon_key'], $table, [], 1000, $supabase['service_role_key'] ?? null);
                    if (!empty($data)) {
                        logMessage("✅ " . count($data) . " Datensätze geladen (nach Retry)", 'success');
                        logMessage("⬆️ Übertrage Daten nach MySQL...", 'info');
                        $stats = insertIntoMySQL($pdo, $table, $data, $primaryKey, $mysqlColumns);
                    } else {
                        throw $fetchError; // Re-throw wenn immer noch leer
                    }
                } catch (Exception $retryError) {
                    logMessage("❌ Fehler bleibt bestehen: " . $retryError->getMessage(), 'error');
                    throw $fetchError; // Re-throw original error
                }
            } else {
                throw $fetchError; // Re-throw andere Fehler
            }
        }
        
        logMessage("✅ Eingefügt: {$stats['inserted']}, Aktualisiert: {$stats['updated']}", 'success');
        
        $totalStats['inserted'] += $stats['inserted'];
        $totalStats['updated'] += $stats['updated'];
        
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
        logMessage("❌ Fehler bei $table: $errorMsg", 'error');
        $totalStats['errors']++;
        
        // Spezielle Fehlerbehandlung
        if (strpos($errorMsg, 'does not exist') !== false) {
            logMessage("ℹ️ Spalte existiert nicht in Supabase - wird übersprungen", 'info');
        } elseif (strpos($errorMsg, 'HTTP 404') !== false) {
            logMessage("ℹ️ Tabelle existiert nicht in Supabase - überspringe", 'info');
        } elseif (strpos($errorMsg, 'HTTP') !== false || strpos($errorMsg, 'cURL') !== false) {
            logMessage("⚠️ Supabase-Verbindungsproblem", 'warning');
        }
    }
}

// Zusammenfassung
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📊 ZUSAMMENFASSUNG", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("✅ Eingefügt: {$totalStats['inserted']}", 'success');
logMessage("🔄 Aktualisiert: {$totalStats['updated']}", 'info');
logMessage("⚠️ Übersprungen: {$totalStats['skipped']}", $totalStats['skipped'] > 0 ? 'warning' : 'info');
logMessage("❌ Fehler: {$totalStats['errors']}", $totalStats['errors'] > 0 ? 'error' : 'success');

if ($totalStats['errors'] === 0) {
    logMessage("", 'info');
    logMessage("✅ Klon-Vorgang erfolgreich abgeschlossen!", 'success');
    logMessage("Sie können jetzt phpMyAdmin öffnen und die Daten sehen.", 'info');
} else {
    logMessage("", 'info');
    logMessage("⚠️ Es gab Fehler beim Klonen. Bitte prüfen Sie die Logs oben.", 'warning');
}

if (!$isCli) {
    echo '</pre></body></html>';
}

?>

