<?php
/**
 * Mood Indicators API
 * CRUD-Operationen für Stimmungsindikatoren
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

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $user = getCurrentUserFromAuth($pdo);
    
    switch ($method) {
        case 'GET':
            if ($action === 'list' || $action === '') {
                // Liste aller Indikatoren (Standard + Benutzer-spezifische)
                $stmt = $pdo->prepare("
                    SELECT mi.*, ic.name as category_name, ic.description as category_description
                    FROM mood_indicators mi
                    LEFT JOIN indicator_categories ic ON mi.category_id = ic.id
                    WHERE mi.user_id IS NULL OR mi.user_id = ?
                    ORDER BY mi.sort_order ASC, mi.created_at ASC
                ");
                $stmt->execute([$user ? $user['id'] : null]);
                $indicators = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $indicators]);
            } elseif ($action === 'standard') {
                // Liste aller Standard-Indikatoren (nur user_id = null, Admin-only)
                if (!$user || !isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Standard-Indikatoren verwalten']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT mi.*, ic.id as category_id, ic.name as category_name, ic.description as category_description
                    FROM mood_indicators mi
                    LEFT JOIN indicator_categories ic ON mi.category_id = ic.id
                    WHERE mi.user_id IS NULL
                    ORDER BY mi.name ASC
                ");
                $stmt->execute();
                $indicators = $stmt->fetchAll();
                
                // Formatiere für Frontend
                $formatted = array_map(function($ind) {
                    return [
                        ...$ind,
                        'category' => $ind['category_id'] ? [
                            'id' => $ind['category_id'],
                            'name' => $ind['category_name'],
                            'description' => $ind['category_description']
                        ] : null
                    ];
                }, $indicators);
                
                echo json_encode(['success' => true, 'data' => $formatted]);
            } elseif ($action === 'categories') {
                // Liste aller Kategorien
                $stmt = $pdo->prepare("SELECT * FROM indicator_categories ORDER BY name ASC");
                $stmt->execute();
                $categories = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $categories]);
            } elseif ($action === 'get') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT mi.*, ic.name as category_name, ic.description as category_description
                    FROM mood_indicators mi
                    LEFT JOIN indicator_categories ic ON mi.category_id = ic.id
                    WHERE mi.id = ?
                ");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                if ($indicator) {
                    echo json_encode(['success' => true, 'data' => $indicator]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Indikator nicht gefunden']);
                }
            }
            break;
            
        case 'POST':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'create-standard') {
                // Standard-Indikator erstellen (Admin-only)
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Standard-Indikatoren erstellen']);
                    exit;
                }
                
                $id = bin2hex(random_bytes(16));
                $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
                
                $name = trim($data['name'] ?? '');
                $color = $data['color'] ?? $data['color_start'] ?? '#3b82f6';
                $sort_order = $data['sort_order'] ?? 0;
                $is_active = $data['is_active'] ?? 1;
                $min_value = $data['min_value'] ?? 1;
                $max_value = $data['max_value'] ?? 10;
                $step_value = $data['step_value'] ?? 1.0;
                $color_start = $data['color_start'] ?? '#ef4444';
                $color_end = $data['color_end'] ?? '#10b981';
                $icon_url = $data['icon_url'] ?? null;
                $category_id = $data['category_id'] ?? null;
                $description = $data['description'] ?? null;
                
                if (empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Name ist erforderlich']);
                    exit;
                }
                
                // Prüfe auf Duplikate
                $checkStmt = $pdo->prepare("SELECT id FROM mood_indicators WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND user_id IS NULL");
                $checkStmt->execute([$name]);
                if ($checkStmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Ein Standard-Indikator mit diesem Namen existiert bereits']);
                    exit;
                }
                
                // Hole max sort_order
                $maxStmt = $pdo->query("SELECT MAX(sort_order) as max_order FROM mood_indicators WHERE user_id IS NULL");
                $maxData = $maxStmt->fetch();
                $sort_order = $maxData['max_order'] ? $maxData['max_order'] + 1 : 1;
                
                $stmt = $pdo->prepare("INSERT INTO mood_indicators (
                    id, name, color, sort_order, is_active, min_value, max_value, step_value,
                    color_start, color_end, user_id, icon_url, category_id, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NOW())");
                
                $stmt->execute([
                    $id, $name, $color, $sort_order, $is_active, $min_value, $max_value, $step_value,
                    $color_start, $color_end, $icon_url, $category_id, $description
                ]);
                
                $stmt = $pdo->prepare("
                    SELECT mi.*, ic.id as category_id, ic.name as category_name, ic.description as category_description
                    FROM mood_indicators mi
                    LEFT JOIN indicator_categories ic ON mi.category_id = ic.id
                    WHERE mi.id = ?
                ");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                $indicator['category'] = $indicator['category_id'] ? [
                    'id' => $indicator['category_id'],
                    'name' => $indicator['category_name'],
                    'description' => $indicator['category_description']
                ] : null;
                
                echo json_encode(['success' => true, 'data' => $indicator]);
            } elseif ($action === 'create-category') {
                // Kategorie erstellen
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Kategorien erstellen']);
                    exit;
                }
                
                $name = trim($data['name'] ?? '');
                $description = trim($data['description'] ?? '') ?: null;
                
                if (empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Name ist erforderlich']);
                    exit;
                }
                
                // Prüfe auf Duplikate
                $checkStmt = $pdo->prepare("SELECT id FROM indicator_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))");
                $checkStmt->execute([$name]);
                if ($checkStmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Eine Kategorie mit diesem Namen existiert bereits']);
                    exit;
                }
                
                $id = bin2hex(random_bytes(16));
                $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
                
                $stmt = $pdo->prepare("INSERT INTO indicator_categories (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
                $stmt->execute([$id, $name, $description]);
                
                $stmt = $pdo->prepare("SELECT * FROM indicator_categories WHERE id = ?");
                $stmt->execute([$id]);
                $category = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $category]);
            } else {
                // Standard: Benutzer-Indikator erstellen
                $id = bin2hex(random_bytes(16));
                $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
                
                $name = $data['name'] ?? '';
                $color = $data['color'] ?? '#3b82f6';
                $sort_order = $data['sort_order'] ?? 0;
                $is_active = $data['is_active'] ?? 1;
                $min_value = $data['min_value'] ?? 1;
                $max_value = $data['max_value'] ?? 5;
                $step_value = $data['step_value'] ?? 1.0;
                $color_start = $data['color_start'] ?? '#ef4444';
                $color_end = $data['color_end'] ?? '#10b981';
                $icon_url = $data['icon_url'] ?? null;
                $category_id = $data['category_id'] ?? null;
                
                if (empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Name ist erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("INSERT INTO mood_indicators (
                    id, name, color, sort_order, is_active, min_value, max_value, step_value,
                    color_start, color_end, user_id, icon_url, category_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                
                $stmt->execute([
                    $id, $name, $color, $sort_order, $is_active, $min_value, $max_value, $step_value,
                    $color_start, $color_end, $user['id'], $icon_url, $category_id
                ]);
                
                $stmt = $pdo->prepare("SELECT * FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $indicator]);
            }
            break;
            
        case 'PUT':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            if ($action === 'update-standard') {
                // Standard-Indikator aktualisieren (Admin-only)
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Standard-Indikatoren aktualisieren']);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT user_id FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                if (!$indicator || $indicator['user_id'] !== null) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Standard-Indikator nicht gefunden']);
                    exit;
                }
                
                $updateFields = [];
                $updateValues = [];
                
                $allowedFields = ['name', 'color', 'sort_order', 'is_active', 'min_value', 'max_value', 
                    'step_value', 'color_start', 'color_end', 'icon_url', 'category_id', 'description'];
                
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $field === 'name' ? trim($data[$field]) : $data[$field];
                    }
                }
                
                if (empty($updateFields)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Keine Felder zum Aktualisieren']);
                    exit;
                }
                
                // Prüfe auf Duplikate bei Name-Änderung
                if (isset($data['name'])) {
                    $checkStmt = $pdo->prepare("SELECT id FROM mood_indicators WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND user_id IS NULL AND id != ?");
                    $checkStmt->execute([trim($data['name']), $id]);
                    if ($checkStmt->fetch()) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Ein Standard-Indikator mit diesem Namen existiert bereits']);
                        exit;
                    }
                }
                
                $updateValues[] = $id;
                $sql = "UPDATE mood_indicators SET " . implode(', ', $updateFields) . " WHERE id = ? AND user_id IS NULL";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
                
                $stmt = $pdo->prepare("
                    SELECT mi.*, ic.id as category_id, ic.name as category_name, ic.description as category_description
                    FROM mood_indicators mi
                    LEFT JOIN indicator_categories ic ON mi.category_id = ic.id
                    WHERE mi.id = ?
                ");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                $indicator['category'] = $indicator['category_id'] ? [
                    'id' => $indicator['category_id'],
                    'name' => $indicator['category_name'],
                    'description' => $indicator['category_description']
                ] : null;
                
                echo json_encode(['success' => true, 'data' => $indicator]);
            } elseif ($action === 'update-category') {
                // Kategorie aktualisieren
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Kategorien aktualisieren']);
                    exit;
                }
                
                $name = trim($data['name'] ?? '');
                $description = trim($data['description'] ?? '') ?: null;
                
                if (empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Name ist erforderlich']);
                    exit;
                }
                
                // Prüfe auf Duplikate
                $checkStmt = $pdo->prepare("SELECT id FROM indicator_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?");
                $checkStmt->execute([$name, $id]);
                if ($checkStmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Eine Kategorie mit diesem Namen existiert bereits']);
                    exit;
                }
                
                $stmt = $pdo->prepare("UPDATE indicator_categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$name, $description, $id]);
                
                $stmt = $pdo->prepare("SELECT * FROM indicator_categories WHERE id = ?");
                $stmt->execute([$id]);
                $category = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $category]);
            } else {
                // Standard: Benutzer-Indikator aktualisieren
                $stmt = $pdo->prepare("SELECT user_id FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                if (!$indicator) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Indikator nicht gefunden']);
                    exit;
                }
                
                if ($indicator['user_id'] && $indicator['user_id'] !== $user['id']) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Zugriff verweigert']);
                    exit;
                }
                
                $updateFields = [];
                $updateValues = [];
                
                $allowedFields = ['name', 'color', 'sort_order', 'is_active', 'min_value', 'max_value', 
                    'step_value', 'color_start', 'color_end', 'icon_url', 'category_id'];
                
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $data[$field];
                    }
                }
                
                if (empty($updateFields)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Keine Felder zum Aktualisieren']);
                    exit;
                }
                
                $updateValues[] = $id;
                $sql = "UPDATE mood_indicators SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
                
                $stmt = $pdo->prepare("SELECT * FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $indicator]);
            }
            break;
            
        case 'DELETE':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            if ($action === 'delete-standard') {
                // Standard-Indikator löschen (Admin-only)
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Standard-Indikatoren löschen']);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT user_id FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                if (!$indicator || $indicator['user_id'] !== null) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Standard-Indikator nicht gefunden']);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM mood_indicators WHERE id = ? AND user_id IS NULL");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true, 'message' => 'Standard-Indikator gelöscht']);
            } elseif ($action === 'delete-category') {
                // Kategorie löschen
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Kategorien löschen']);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM indicator_categories WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true, 'message' => 'Kategorie gelöscht']);
            } elseif ($action === 'toggle-active-standard') {
                // Standard-Indikator aktivieren/deaktivieren (Admin-only)
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Standard-Indikatoren ändern']);
                    exit;
                }
                
                $id = $_GET['id'] ?? '';
                $isActive = isset($_GET['is_active']) ? (int)$_GET['is_active'] : null;
                
                if (empty($id) || $isActive === null) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID und is_active erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT user_id FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                if (!$indicator || $indicator['user_id'] !== null) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Standard-Indikator nicht gefunden']);
                    exit;
                }
                
                $stmt = $pdo->prepare("UPDATE mood_indicators SET is_active = ? WHERE id = ? AND user_id IS NULL");
                $stmt->execute([$isActive, $id]);
                
                $stmt = $pdo->prepare("SELECT * FROM mood_indicators WHERE id = ?");
                $stmt->execute([$id]);
                $indicator = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $indicator]);
            }
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

