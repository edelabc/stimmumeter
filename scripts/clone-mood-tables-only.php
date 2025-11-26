<?php
/**
 * Klone nur mood_assessments, mood_entries und mood_indicator_values
 * Mit Service Role Key Support für RLS-geschützte Tabellen
 */

require_once __DIR__ . '/../config.local.php';

// Supabase Credentials aus .env laden
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
    
    return $credentials;
}

$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mood Tables Klon</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}.info{color:#0ff;}</style></head><body>';
    echo '<h1>🔄 Klone Mood-Tabellen</h1><pre>';
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
    
    if ($isCli) {
        echo "[$prefix] $message\n";
    } else {
        $colorClass = match($type) {
            'error' => 'error',
            'success' => 'success',
            'warning' => 'warning',
            'info' => 'info',
            default => ''
        };
        echo "<span class=\"$colorClass\">[$prefix] $message</span>\n";
    }
    flush();
}

// MySQL Verbindung
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    logMessage("✅ MySQL-Verbindung erfolgreich", 'success');
} catch (PDOException $e) {
    logMessage("❌ MySQL-Fehler: " . $e->getMessage(), 'error');
    exit(1);
}

// Supabase Credentials laden
$supabase = loadSupabaseCredentials();
if (empty($supabase['url']) || empty($supabase['anon_key'])) {
    logMessage("❌ Supabase-Credentials nicht gefunden!", 'error');
    exit(1);
}

logMessage("✅ Supabase-URL: " . $supabase['url'], 'success');
if (!empty($supabase['service_role_key'])) {
    logMessage("✅ Service Role Key gefunden - kann RLS umgehen", 'success');
} else {
    logMessage("⚠️ Kein Service Role Key - versuche mit Anon Key", 'warning');
}

// Funktion: Hole Daten von Supabase
function fetchFromSupabase($url, $key, $table, $limit = 1000) {
    $allData = [];
    $offset = 0;
    $hasMore = true;
    
    while ($hasMore) {
        $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?select=*&limit=' . $limit . '&offset=' . $offset;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $apiUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $key,
                'Authorization: Bearer ' . $key,
                'Content-Type: application/json',
                'Prefer: return=representation'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 60
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL Fehler: $error");
        }
        
        if ($httpCode === 404) {
            return [];
        }
        
        if ($httpCode !== 200 && $httpCode !== 206) {
            throw new Exception("HTTP $httpCode: " . substr($response, 0, 200));
        }
        
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON Parse Fehler: " . json_last_error_msg());
        }
        
        if (empty($data) || !is_array($data)) {
            $hasMore = false;
        } else {
            $allData = array_merge($allData, $data);
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
            $filteredRow = [];
            foreach ($row as $key => $value) {
                if (in_array($key, $mysqlColumns)) {
                    if ($value === null) {
                        $filteredRow[$key] = null;
                    } elseif (is_array($value) || is_object($value)) {
                        $jsonValue = json_encode($value);
                        $filteredRow[$key] = json_last_error() === JSON_ERROR_NONE ? $jsonValue : serialize($value);
                    } else {
                        $filteredRow[$key] = $value;
                    }
                }
            }
            
            if (empty($filteredRow) || !isset($filteredRow[$primaryKey])) {
                continue;
            }
            
            $check = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE `$primaryKey` = ?");
            $check->execute([$filteredRow[$primaryKey]]);
            $exists = $check->fetchColumn() > 0;
            
            if ($exists) {
                $columns = array_keys($filteredRow);
                $setParts = [];
                foreach ($columns as $col) {
                    if ($col !== $primaryKey) {
                        $setParts[] = "`$col` = :$col";
                    }
                }
                
                if (!empty($setParts)) {
                    $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE `$primaryKey` = :$primaryKey";
                    $stmt = $pdo->prepare($sql);
                    foreach ($filteredRow as $key => $value) {
                        $stmt->bindValue(":$key", $value === null ? null : $value, $value === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
                    }
                    $stmt->execute();
                    $updated++;
                }
            } else {
                $columns = array_keys($filteredRow);
                $placeholders = array_map(fn($col) => ":$col", $columns);
                $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                foreach ($filteredRow as $key => $value) {
                    $stmt->bindValue(":$key", $value === null ? null : $value, $value === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
                }
                $stmt->execute();
                $inserted++;
            }
        } catch (PDOException $e) {
            error_log("Fehler bei Datensatz in $table: " . $e->getMessage());
            continue;
        }
    }
    
    return ['inserted' => $inserted, 'updated' => $updated];
}

// Klone nur die Mood-Tabellen
$tables = ['mood_assessments', 'mood_entries', 'mood_indicator_values'];
$totalStats = ['inserted' => 0, 'updated' => 0, 'errors' => 0];

// Verwende Service Role Key falls verfügbar
$apiKey = !empty($supabase['service_role_key']) ? $supabase['service_role_key'] : $supabase['anon_key'];

foreach ($tables as $table) {
    logMessage("", 'info');
    logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
    logMessage("📋 Klone Tabelle: $table", 'info');
    logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
    
    try {
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if (!$tableExists) {
            logMessage("⚠️ Tabelle $table existiert nicht in MySQL - überspringe", 'warning');
            continue;
        }
        
        $result = $pdo->query("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
        $keys = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $keys[] = $row['Column_name'];
        }
        $primaryKey = !empty($keys) ? $keys[0] : 'id';
        
        $result = $pdo->query("SHOW COLUMNS FROM `$table`");
        $mysqlColumns = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $mysqlColumns[] = $row['Field'];
        }
        
        logMessage("⬇️ Lade Daten von Supabase...", 'info');
        $data = fetchFromSupabase($supabase['url'], $apiKey, $table);
        
        logMessage("✅ " . count($data) . " Datensätze geladen", 'success');
        
        if (empty($data)) {
            logMessage("ℹ️ Keine Daten in Supabase für $table", 'info');
            continue;
        }
        
        logMessage("⬆️ Übertrage Daten nach MySQL...", 'info');
        $stats = insertIntoMySQL($pdo, $table, $data, $primaryKey, $mysqlColumns);
        
        logMessage("✅ Eingefügt: {$stats['inserted']}, Aktualisiert: {$stats['updated']}", 'success');
        $totalStats['inserted'] += $stats['inserted'];
        $totalStats['updated'] += $stats['updated'];
        
    } catch (Exception $e) {
        logMessage("❌ Fehler bei $table: " . $e->getMessage(), 'error');
        $totalStats['errors']++;
    }
}

logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📊 ZUSAMMENFASSUNG", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("✅ Eingefügt: {$totalStats['inserted']}", 'success');
logMessage("🔄 Aktualisiert: {$totalStats['updated']}", 'info');
logMessage("❌ Fehler: {$totalStats['errors']}", $totalStats['errors'] > 0 ? 'error' : 'success');

if (!$isCli) {
    echo '</pre></body></html>';
}

?>




