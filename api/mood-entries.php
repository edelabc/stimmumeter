<?php
/**
 * Mood Entries API
 * CRUD-Operationen für Stimmungseinträge
 */

// Output-Buffering aktivieren, um sicherzustellen, dass keine Ausgaben vor den Headern erfolgen
ob_start();

// CORS-Header MUSS ganz am Anfang gesetzt werden, bevor andere Dateien eingebunden werden
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Preflight-Requests (OPTIONS) sofort behandeln
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

/**
 * Konvertiert ISO-Datumsformat zu MySQL-Datetime-Format
 * @param string $isoDate ISO-Format z.B. "2025-11-24T04:08:00.000Z"
 * @return string MySQL-Format z.B. "2025-11-24 04:08:00"
 */
function convertIsoToMysqlDateTime($isoDate) {
    if (empty($isoDate)) {
        return date('Y-m-d H:i:s');
    }
    
    // Prüfe ob es bereits MySQL-Format ist
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $isoDate)) {
        return $isoDate;
    }
    
    // ISO-Format konvertieren: 2025-11-24T04:08:00.000Z -> 2025-11-24 04:08:00
    $converted = $isoDate;
    
    // Entferne 'Z' am Ende falls vorhanden
    $converted = rtrim($converted, 'Z');
    
    // Ersetze 'T' durch Leerzeichen
    $converted = str_replace('T', ' ', $converted);
    
    // Entferne Millisekunden falls vorhanden (z.B. .000)
    if (strpos($converted, '.') !== false) {
        $parts = explode('.', $converted);
        $converted = trim($parts[0]);
    }
    
    // Stelle sicher, dass es das richtige Format hat
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $converted)) {
        return $converted;
    }
    
    // Versuche mit DateTime zu parsen
    try {
        $dateTime = new DateTime($isoDate);
        return $dateTime->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        // Fallback: aktuelles Datum
        return date('Y-m-d H:i:s');
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $user = getCurrentUserFromAuth($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht authentifiziert']);
        exit;
    }

    switch ($method) {
        case 'GET':
            $pseudonymId = $_GET['pseudonym_id'] ?? '';
            
            if (empty($pseudonymId)) {
                http_response_code(400);
                echo json_encode(['error' => 'pseudonym_id erforderlich']);
                exit;
            }
            
            // Prüfe ob Pseudonym dem Benutzer gehört
            $stmt = $pdo->prepare("SELECT id FROM pseudonyms WHERE id = ? AND user_id = ?");
            $stmt->execute([$pseudonymId, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Hole Einträge mit Werten
            $stmt = $pdo->prepare("
                SELECT me.* 
                FROM mood_entries me
                WHERE me.pseudonym_id = ?
                ORDER BY me.entry_date DESC, me.created_at DESC
            ");
            $stmt->execute([$pseudonymId]);
            $entries = $stmt->fetchAll();
            
            // Hole Werte für jeden Eintrag
            foreach ($entries as &$entry) {
                $stmt = $pdo->prepare("
                    SELECT miv.*, mi.name as indicator_name, mi.color, mi.color_start, mi.description as indicator_description
                    FROM mood_indicator_values miv
                    JOIN mood_indicators mi ON miv.indicator_id = mi.id
                    WHERE miv.mood_entry_id = ?
                ");
                $stmt->execute([$entry['id']]);
                $values = $stmt->fetchAll();
                
                $entry['values'] = array_map(function($v) {
                    return [
                        'indicator_id' => $v['indicator_id'],
                        'indicator_name' => $v['indicator_name'],
                        'indicator_color' => $v['color_start'] ?: $v['color'],
                        'indicator_description' => $v['indicator_description'] ?? null,
                        'value' => floatval($v['value'])
                    ];
                }, $values);
            }
            
            echo json_encode(['success' => true, 'data' => $entries]);
            break;
            
        case 'POST':
            // Neuen Eintrag erstellen
            $data = json_decode(file_get_contents('php://input'), true);
            
            $pseudonymId = $data['pseudonym_id'] ?? '';
            $values = $data['values'] ?? []; // Array von {indicator_id, value}
            $note = $data['note'] ?? null;
            
            // Konvertiere ISO-Datumsformat zu MySQL-Format
            $entryDate = convertIsoToMysqlDateTime($data['entry_date'] ?? null);
            
            $timeOfDay = $data['time_of_day'] ?? null;
            $weather = $data['weather'] ?? null;
            $weatherCode = $data['weather_code'] ?? null;
            $latitude = $data['latitude'] ?? null;
            $longitude = $data['longitude'] ?? null;
            $temperature = $data['temperature'] ?? null;
            $location = $data['location'] ?? null;
            $customTags = $data['custom_tags'] ?? null;
            
            if (empty($pseudonymId) || empty($values)) {
                http_response_code(400);
                echo json_encode(['error' => 'pseudonym_id und values sind erforderlich']);
                exit;
            }
            
            // Prüfe ob Pseudonym dem Benutzer gehört
            $stmt = $pdo->prepare("SELECT id FROM pseudonyms WHERE id = ? AND user_id = ?");
            $stmt->execute([$pseudonymId, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Erstelle Eintrag
            $entryId = bin2hex(random_bytes(16));
            $entryId = substr($entryId, 0, 8) . '-' . substr($entryId, 8, 4) . '-' . substr($entryId, 12, 4) . '-' . substr($entryId, 16, 4) . '-' . substr($entryId, 20, 12);
            
            $customTagsJson = $customTags ? json_encode($customTags) : null;
            
            // Sicherheitsprüfung: Stelle sicher, dass entry_date im richtigen Format ist
            $entryDate = convertIsoToMysqlDateTime($entryDate);
            
            $stmt = $pdo->prepare("INSERT INTO mood_entries (
                id, pseudonym_id, note, entry_date, time_of_day, weather, weather_code,
                latitude, longitude, temperature, location, custom_tags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            
            $stmt->execute([
                $entryId, $pseudonymId, $note, $entryDate, $timeOfDay, $weather, $weatherCode,
                $latitude, $longitude, $temperature, $location, $customTagsJson
            ]);
            
            // Erstelle Werte
            foreach ($values as $valueData) {
                $valueId = bin2hex(random_bytes(16));
                $valueId = substr($valueId, 0, 8) . '-' . substr($valueId, 8, 4) . '-' . substr($valueId, 12, 4) . '-' . substr($valueId, 16, 4) . '-' . substr($valueId, 20, 12);
                
                $stmt = $pdo->prepare("INSERT INTO mood_indicator_values (id, mood_entry_id, indicator_id, value, created_at) VALUES (?, ?, ?, ?, NOW())");
                $stmt->execute([$valueId, $entryId, $valueData['indicator_id'], $valueData['value']]);
            }
            
            // Hole erstellten Eintrag mit Werten
            $stmt = $pdo->prepare("SELECT * FROM mood_entries WHERE id = ?");
            $stmt->execute([$entryId]);
            $entry = $stmt->fetch();
            
            $stmt = $pdo->prepare("
                SELECT miv.*, mi.name as indicator_name, mi.color, mi.color_start, mi.description as indicator_description
                FROM mood_indicator_values miv
                JOIN mood_indicators mi ON miv.indicator_id = mi.id
                WHERE miv.mood_entry_id = ?
            ");
            $stmt->execute([$entryId]);
            $entryValues = $stmt->fetchAll();
            
            $entry['values'] = array_map(function($v) {
                return [
                    'indicator_id' => $v['indicator_id'],
                    'indicator_name' => $v['indicator_name'],
                    'indicator_color' => $v['color_start'] ?: $v['color'],
                    'indicator_description' => $v['indicator_description'] ?? null,
                    'value' => floatval($v['value'])
                ];
            }, $entryValues);
            
            echo json_encode(['success' => true, 'data' => $entry]);
            break;
            
        case 'PUT':
            // Eintrag aktualisieren
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe ob Eintrag dem Benutzer gehört
            $stmt = $pdo->prepare("
                SELECT me.id FROM mood_entries me
                JOIN pseudonyms p ON me.pseudonym_id = p.id
                WHERE me.id = ? AND p.user_id = ?
            ");
            $stmt->execute([$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Update-Felder
            $updateFields = [];
            $updateValues = [];
            
            $allowedFields = ['note', 'entry_date', 'time_of_day', 'weather', 'weather_code',
                'latitude', 'longitude', 'temperature', 'location', 'custom_tags'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    if ($field === 'custom_tags' && is_array($data[$field])) {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = json_encode($data[$field]);
                    } elseif ($field === 'entry_date') {
                        // Konvertiere ISO-Datumsformat zu MySQL-Format
                        $convertedDate = convertIsoToMysqlDateTime($data[$field]);
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $convertedDate;
                    } else {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $data[$field];
                    }
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $id;
                $sql = "UPDATE mood_entries SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
            }
            
            // Update Werte falls vorhanden
            if (isset($data['values']) && is_array($data['values'])) {
                // Lösche alte Werte
                $stmt = $pdo->prepare("DELETE FROM mood_indicator_values WHERE mood_entry_id = ?");
                $stmt->execute([$id]);
                
                // Erstelle neue Werte
                foreach ($data['values'] as $valueData) {
                    $valueId = bin2hex(random_bytes(16));
                    $valueId = substr($valueId, 0, 8) . '-' . substr($valueId, 8, 4) . '-' . substr($valueId, 12, 4) . '-' . substr($valueId, 16, 4) . '-' . substr($valueId, 20, 12);
                    
                    $stmt = $pdo->prepare("INSERT INTO mood_indicator_values (id, mood_entry_id, indicator_id, value, created_at) VALUES (?, ?, ?, ?, NOW())");
                    $stmt->execute([$valueId, $id, $valueData['indicator_id'], $valueData['value']]);
                }
            }
            
            // Hole aktualisierten Eintrag
            $stmt = $pdo->prepare("SELECT * FROM mood_entries WHERE id = ?");
            $stmt->execute([$id]);
            $entry = $stmt->fetch();
            
            $stmt = $pdo->prepare("
                SELECT miv.*, mi.name as indicator_name, mi.color, mi.color_start
                FROM mood_indicator_values miv
                JOIN mood_indicators mi ON miv.indicator_id = mi.id
                WHERE miv.mood_entry_id = ?
            ");
            $stmt->execute([$id]);
            $entryValues = $stmt->fetchAll();
            
            $entry['values'] = array_map(function($v) {
                return [
                    'indicator_id' => $v['indicator_id'],
                    'indicator_name' => $v['indicator_name'],
                    'indicator_color' => $v['color_start'] ?: $v['color'],
                    'value' => floatval($v['value'])
                ];
            }, $entryValues);
            
            echo json_encode(['success' => true, 'data' => $entry]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe ob Eintrag dem Benutzer gehört
            $stmt = $pdo->prepare("
                SELECT me.id FROM mood_entries me
                JOIN pseudonyms p ON me.pseudonym_id = p.id
                WHERE me.id = ? AND p.user_id = ?
            ");
            $stmt->execute([$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Lösche Werte zuerst
            $stmt = $pdo->prepare("DELETE FROM mood_indicator_values WHERE mood_entry_id = ?");
            $stmt->execute([$id]);
            
            // Lösche Eintrag
            $stmt = $pdo->prepare("DELETE FROM mood_entries WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Eintrag gelöscht']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Methode nicht erlaubt']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server-Fehler: ' . $e->getMessage()]);
}

?>

