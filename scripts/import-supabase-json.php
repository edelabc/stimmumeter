<?php
/**
 * Supabase JSON Import Script
 * 
 * Importiert Daten aus einer JSON-Datei (z.B. manuell aus Supabase exportiert)
 * 
 * VERWENDUNG:
 * 1. Exportieren Sie Daten aus Supabase als JSON (falls möglich)
 * 2. Speichern Sie die JSON-Datei als: backups/supabase_export.json
 * 3. php scripts/import-supabase-json.php
 */

require_once __DIR__ . '/../config.local.php';

$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supabase JSON Import</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#0f0;}';
    echo '.error{color:#f00;}.success{color:#0f0;}.warning{color:#ff0;}</style></head><body>';
    echo '<h1>📥 Supabase JSON Import</h1><pre>';
}

function logMsg($msg, $type = 'info') {
    global $isCli;
    $icons = ['error' => '❌', 'success' => '✅', 'warning' => '⚠️', 'info' => 'ℹ️'];
    $icon = $icons[$type] ?? '📋';
    $class = $type;
    
    if ($isCli) {
        echo "[$icon] $msg\n";
    } else {
        echo "<span class=\"$class\">[$icon] $msg</span>\n";
    }
    flush();
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    logMsg("✅ MySQL-Verbindung erfolgreich", 'success');
} catch (PDOException $e) {
    logMsg("❌ MySQL-Fehler: " . $e->getMessage(), 'error');
    exit(1);
}

$jsonFile = __DIR__ . '/../backups/supabase_export.json';
if (!file_exists($jsonFile)) {
    logMsg("❌ JSON-Datei nicht gefunden: $jsonFile", 'error');
    logMsg("Bitte erstellen Sie eine JSON-Datei mit folgendem Format:", 'info');
    logMsg('{"t_vereinbarungen": [...], "t_vereinbarungstitel": [...], ...}', 'info');
    exit(1);
}

logMsg("📂 Lade JSON-Datei: $jsonFile", 'info');
$json = file_get_contents($jsonFile);
$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    logMsg("❌ JSON Parse Fehler: " . json_last_error_msg(), 'error');
    exit(1);
}

logMsg("✅ JSON erfolgreich geladen", 'success');

$tables = [
    't_vereinbarungstitel' => 'id',
    't_vereinbarungen' => 'id',
    't_vereinbarungs_logs' => 'id',
    't_platzhalter_definitionen' => 'id',
    'menu_items' => 'id',
    'footer_menu_items' => 'id',
    'user_agreement_consents' => 'id'
];

$stats = ['inserted' => 0, 'updated' => 0, 'errors' => 0];

foreach ($tables as $table => $primaryKey) {
    if (!isset($data[$table]) || !is_array($data[$table])) {
        logMsg("⚠️ Keine Daten für $table gefunden", 'warning');
        continue;
    }
    
    logMsg("📋 Importiere $table (" . count($data[$table]) . " Datensätze)...", 'info');
    
    foreach ($data[$table] as $row) {
        try {
            $check = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE `$primaryKey` = ?");
            $check->execute([$row[$primaryKey]]);
            $exists = $check->fetchColumn() > 0;
            
            if ($exists) {
                $columns = array_keys($row);
                $setParts = [];
                foreach ($columns as $col) {
                    if ($col !== $primaryKey) {
                        $setParts[] = "`$col` = :$col";
                    }
                }
                $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE `$primaryKey` = :$primaryKey";
                $stmt = $pdo->prepare($sql);
                foreach ($row as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                $stmt->execute();
                $stats['updated']++;
            } else {
                $columns = array_keys($row);
                $placeholders = array_map(fn($col) => ":$col", $columns);
                $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                foreach ($row as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                $stmt->execute();
                $stats['inserted']++;
            }
        } catch (PDOException $e) {
            logMsg("❌ Fehler bei $table: " . $e->getMessage(), 'error');
            $stats['errors']++;
        }
    }
    
    logMsg("✅ $table: {$stats['inserted']} eingefügt, {$stats['updated']} aktualisiert", 'success');
}

logMsg("", 'info');
logMsg("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'info');
logMsg("📊 ZUSAMMENFASSUNG", 'info');
logMsg("✅ Eingefügt: {$stats['inserted']}", 'success');
logMsg("🔄 Aktualisiert: {$stats['updated']}", 'info');
logMsg("❌ Fehler: {$stats['errors']}", $stats['errors'] > 0 ? 'error' : 'success');

if (!$isCli) {
    echo '</pre></body></html>';
}

?>




