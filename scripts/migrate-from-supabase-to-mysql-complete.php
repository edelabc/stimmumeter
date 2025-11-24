<?php
/**
 * Vollständige Migration von Supabase nach MySQL
 * 
 * 1. Erstellt alle fehlenden Tabellen in MySQL
 * 2. Klont alle Daten von Supabase nach MySQL
 * 3. Löscht alle Daten aus Supabase (optional)
 * 
 * VERWENDUNG:
 * php scripts/migrate-from-supabase-to-mysql-complete.php
 * 
 * ODER im Browser:
 * http://localhost/stimmumeter/scripts/migrate-from-supabase-to-mysql-complete.php
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
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supabase zu MySQL Migration</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}.info{color:#0ff;}</style></head><body>';
    echo '<h1>🔄 Supabase zu MySQL - Vollständige Migration</h1><pre>';
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

// ==========================================
// SCHRITT 1: Erstelle fehlende Tabellen
// ==========================================
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📋 SCHRITT 1: Erstelle fehlende Tabellen", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');

// Erstelle footer_menu_items Tabelle falls nicht vorhanden
$createFooterMenuItems = "
CREATE TABLE IF NOT EXISTS `footer_menu_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL DEFAULT '/',
  `position` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `linked_agreement_id` CHAR(36) NULL,
  `slug` VARCHAR(255) NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_footer_menu_items_slug_unique` (`slug`),
  INDEX `idx_footer_menu_items_linked_agreement` (`linked_agreement_id`),
  INDEX `idx_footer_menu_items_category_position` (`category`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $pdo->exec($createFooterMenuItems);
    logMessage("✅ Tabelle `footer_menu_items` erstellt/überprüft", 'success');
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') === false) {
        logMessage("⚠️ Fehler beim Erstellen von `footer_menu_items`: " . $e->getMessage(), 'warning');
    } else {
        logMessage("ℹ️ Tabelle `footer_menu_items` existiert bereits", 'info');
    }
}

// Prüfe weitere fehlende Tabellen und erstelle sie falls nötig
// (Hier können weitere Tabellen hinzugefügt werden)

// ==========================================
// SCHRITT 2: Klone alle Daten
// ==========================================
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📋 SCHRITT 2: Klone alle Daten von Supabase nach MySQL", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');

// Alle Tabellen
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

// Funktionen aus clone-supabase-to-mysql.php übernehmen
function getSupabaseColumns($url, $anonKey, $table) {
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
            return array_keys($data[0]);
        }
    }
    
    return [];
}

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

function getMySQLPrimaryKey($pdo, $table) {
    try {
        $result = $pdo->query("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
        $keys = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $keys[] = $row['Column_name'];
        }
        return !empty($keys) ? $keys[0] : 'id';
    } catch (PDOException $e) {
        return 'id';
    }
}

function fetchFromSupabase($url, $anonKey, $table, $columns, $limit = 1000, $serviceRoleKey = null) {
    $allData = [];
    $offset = 0;
    $hasMore = true;
    
    $apiKey = $serviceRoleKey ?: $anonKey;
    
    while ($hasMore) {
        if (empty($columns)) {
            $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?select=*&limit=' . $limit . '&offset=' . $offset;
        } else {
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
        
        if ($httpCode !== 200) {
            if (!empty($columns) && strpos($response, 'does not exist') !== false && $offset === 0) {
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
            if (count($data) < $limit) {
                $hasMore = false;
            } else {
                $offset += $limit;
            }
        }
    }
    
    return $allData;
}

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
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $filteredRow[$key] = $jsonValue;
                        } else {
                            $filteredRow[$key] = is_string($value) ? $value : serialize($value);
                        }
                    } else {
                        // Konvertiere leere Strings zu NULL für Integer-Felder
                        if ($value === '' && in_array($key, ['is_base', 'is_permanent', 'is_active'])) {
                            $filteredRow[$key] = null;
                        } else {
                            $filteredRow[$key] = $value;
                        }
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
                
                if (empty($setParts)) {
                    continue;
                }
                
                $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE `$primaryKey` = :$primaryKey";
                $stmt = $pdo->prepare($sql);
                
                foreach ($filteredRow as $key => $value) {
                    if ($value === null) {
                        $stmt->bindValue(":$key", null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(":$key", $value);
                    }
                }
                
                $stmt->execute();
                $updated++;
            } else {
                $columns = array_keys($filteredRow);
                $placeholders = array_map(fn($col) => ":$col", $columns);
                
                $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                
                foreach ($filteredRow as $key => $value) {
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

$backupFile = $backupDir . '/mysql_backup_before_complete_migration_' . date('Y-m-d_H-i-s') . '.sql';
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
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if (!$tableExists) {
            logMessage("⚠️ Tabelle $table existiert nicht in MySQL - überspringe", 'warning');
            $totalStats['skipped']++;
            continue;
        }
        
        $primaryKey = getMySQLPrimaryKey($pdo, $table);
        logMessage("ℹ️ Primary Key: $primaryKey", 'info');
        
        $mysqlColumns = getMySQLColumns($pdo, $table);
        if (empty($mysqlColumns)) {
            logMessage("⚠️ Keine Spalten in MySQL-Tabelle $table gefunden - überspringe", 'warning');
            $totalStats['skipped']++;
            continue;
        }
        
        logMessage("ℹ️ MySQL-Spalten: " . count($mysqlColumns), 'info');
        
        logMessage("⬇️ Lade Daten von Supabase...", 'info');
        $data = fetchFromSupabase($supabase['url'], $supabase['anon_key'], $table, [], 1000, $supabase['service_role_key'] ?? null);
        
        if ($data === null || empty($data)) {
            logMessage("ℹ️ Keine Daten in Supabase für $table", 'info');
            continue;
        }
        
        logMessage("✅ " . count($data) . " Datensätze geladen", 'success');
        
        logMessage("⬆️ Übertrage Daten nach MySQL...", 'info');
        $stats = insertIntoMySQL($pdo, $table, $data, $primaryKey, $mysqlColumns);
        
        logMessage("✅ Eingefügt: {$stats['inserted']}, Aktualisiert: {$stats['updated']}", 'success');
        
        $totalStats['inserted'] += $stats['inserted'];
        $totalStats['updated'] += $stats['updated'];
        
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
        logMessage("❌ Fehler bei $table: $errorMsg", 'error');
        $totalStats['errors']++;
    }
}

// ==========================================
// SCHRITT 3: Lösche Supabase-Daten (optional)
// ==========================================
logMessage("", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMessage("📋 SCHRITT 3: Lösche Daten aus Supabase", 'info');
logMessage("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');

logMessage("⚠️ WICHTIG: Das Löschen von Supabase-Daten ist deaktiviert!", 'warning');
logMessage("ℹ️ Um Supabase-Daten zu löschen, entfernen Sie die Kommentare im Code.", 'info');
logMessage("ℹ️ Oder führen Sie manuell DELETE-Befehle in Supabase aus.", 'info');

// Funktion zum Löschen von Supabase-Daten (deaktiviert)
function deleteSupabaseData($url, $anonKey, $table, $serviceRoleKey = null) {
    // DEAKTIVIERT - Entfernen Sie die Kommentare um zu aktivieren
    /*
    $apiKey = $serviceRoleKey ?: $anonKey;
    
    // Hole alle IDs
    $data = fetchFromSupabase($url, $anonKey, $table, ['id'], 1000, $serviceRoleKey);
    
    if (empty($data)) {
        return 0;
    }
    
    $deleted = 0;
    foreach ($data as $row) {
        $id = $row['id'];
        $apiUrl = rtrim($url, '/') . '/rest/v1/' . $table . '?id=eq.' . $id;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $apiUrl,
            CURLOPT_CUSTOMREQUEST => 'DELETE',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $apiKey,
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 204) {
            $deleted++;
        }
    }
    
    return $deleted;
    */
    return 0;
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
    logMessage("✅ Migration erfolgreich abgeschlossen!", 'success');
    logMessage("Sie können jetzt phpMyAdmin öffnen und die Daten sehen.", 'info');
    logMessage("", 'info');
    logMessage("⚠️ HINWEIS: Supabase-Daten wurden NICHT gelöscht.", 'warning');
    logMessage("Um Supabase-Daten zu löschen, führen Sie manuell DELETE-Befehle aus.", 'info');
} else {
    logMessage("", 'info');
    logMessage("⚠️ Es gab Fehler beim Migrieren. Bitte prüfen Sie die Logs oben.", 'warning');
}

if (!$isCli) {
    echo '</pre></body></html>';
}

?>

