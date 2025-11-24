<?php
/**
 * Menu Items API
 * Ersetzt Supabase-Aufrufe für Menü-Items
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = getDbConnection();
    $user = getCurrentUserFromAuth($pdo);
    
    function generateUuid() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    function successResponse($data) {
        return json_encode(['data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE);
    }
    
    function errorResponse($message, $code = 400) {
        http_response_code($code);
        return json_encode(['data' => null, 'error' => $message], JSON_UNESCAPED_UNICODE);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            // Check if user is admin
            $isAdmin = $user ? isAdmin($pdo, $user['id']) : false;
            $isAuthenticated = !!$user;
            
            if ($action === 'list' || $action === '') {
                // Build query based on user role
                $query = "SELECT * FROM menu_items WHERE is_active = 1";
                
                // Filter by required_role based on user authentication and admin status
                // Check if required_role column exists
                $columns = $pdo->query("SHOW COLUMNS FROM menu_items LIKE 'required_role'")->fetch();
                if ($columns) {
                    if (!$isAuthenticated) {
                        // Public users can only see public items
                        $query .= " AND required_role = 'public'";
                    } elseif (!$isAdmin) {
                        // Authenticated non-admin users can see public and user items
                        $query .= " AND required_role IN ('public', 'user')";
                    }
                    // Admins can see all items (no filter)
                }
                
                $query .= " ORDER BY position ASC";
                
                $stmt = $pdo->query($query);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($items as &$item) {
                    $item['is_active'] = (bool)$item['is_active'];
                    // Ensure agreement URLs are correctly formatted
                    if (!empty($item['linked_agreement_id']) && !empty($item['slug'])) {
                        $item['url'] = '/agreement/' . $item['slug'];
                    }
                }
                
                echo successResponse($items);
            } elseif ($action === 'get') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
                $stmt->execute([$id]);
                $item = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($item) {
                    $item['is_active'] = (bool)$item['is_active'];
                    echo successResponse($item);
                } else {
                    echo errorResponse('Menü-Item nicht gefunden', 404);
                }
            } else {
                echo errorResponse('Unknown action', 400);
            }
            break;
            
        case 'POST':
            if (!isAdmin($pdo, $user['id'] ?? null)) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $id = generateUuid();
            
            $stmt = $pdo->prepare("INSERT INTO menu_items (id, title, url, position, is_active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['title'],
                $data['url'],
                $data['position'] ?? 0,
                $data['is_active'] !== false ? 1 : 0
            ]);
            
            $item = $pdo->query("SELECT * FROM menu_items WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            $item['is_active'] = (bool)$item['is_active'];
            echo successResponse($item);
            break;
            
        case 'PUT':
            if (!isAdmin($pdo, $user['id'] ?? null)) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                echo errorResponse('ID erforderlich', 400);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $updates = [];
            $params = [];
            
            if (isset($data['title'])) { $updates[] = "title = ?"; $params[] = $data['title']; }
            if (isset($data['url'])) { $updates[] = "url = ?"; $params[] = $data['url']; }
            if (isset($data['position'])) { $updates[] = "position = ?"; $params[] = $data['position']; }
            if (isset($data['is_active'])) { $updates[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            
            $stmt = $pdo->prepare("UPDATE menu_items SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            $item = $pdo->query("SELECT * FROM menu_items WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            if ($item) {
                $item['is_active'] = (bool)$item['is_active'];
                echo successResponse($item);
            } else {
                echo errorResponse('Menü-Item nicht gefunden', 404);
            }
            break;
            
        case 'DELETE':
            if (!isAdmin($pdo, $user['id'] ?? null)) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                echo errorResponse('ID erforderlich', 400);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            $stmt->execute([$id]);
            echo successResponse(['deleted' => true]);
            break;
            
        default:
            echo errorResponse('Method not allowed', 405);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['data' => null, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

?>

