<?php
/**
 * Legal Pages API
 * Ersetzt Supabase-Aufrufe für rechtliche Seiten
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
            if ($action === 'list' || $action === '') {
                // Public can view active pages, admins can view all
                $isAdmin = $user ? isAdmin($pdo, $user['id']) : false;
                $query = "SELECT * FROM legal_pages";
                if (!$isAdmin) {
                    $query .= " WHERE is_active = 1";
                }
                $query .= " ORDER BY page_type";
                
                $stmt = $pdo->query($query);
                $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($pages as &$page) {
                    $page['is_active'] = (bool)$page['is_active'];
                }
                
                echo successResponse($pages);
            } elseif ($action === 'get') {
                $id = $_GET['id'] ?? '';
                $pageType = $_GET['page_type'] ?? '';
                
                if (!empty($id)) {
                    $stmt = $pdo->prepare("SELECT * FROM legal_pages WHERE id = ?");
                    $stmt->execute([$id]);
                    $page = $stmt->fetch(PDO::FETCH_ASSOC);
                } elseif (!empty($pageType)) {
                    $stmt = $pdo->prepare("SELECT * FROM legal_pages WHERE page_type = ? AND is_active = 1 LIMIT 1");
                    $stmt->execute([$pageType]);
                    $page = $stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    echo errorResponse('ID oder page_type erforderlich', 400);
                    exit;
                }
                
                if ($page) {
                    $page['is_active'] = (bool)$page['is_active'];
                    echo successResponse($page);
                } else {
                    echo errorResponse('Seite nicht gefunden', 404);
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
            
            $stmt = $pdo->prepare("INSERT INTO legal_pages (id, page_type, title, content, is_active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['page_type'],
                $data['title'],
                $data['content'],
                $data['is_active'] !== false ? 1 : 0
            ]);
            
            $page = $pdo->query("SELECT * FROM legal_pages WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            $page['is_active'] = (bool)$page['is_active'];
            echo successResponse($page);
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
            
            if (isset($data['page_type'])) { $updates[] = "page_type = ?"; $params[] = $data['page_type']; }
            if (isset($data['title'])) { $updates[] = "title = ?"; $params[] = $data['title']; }
            if (isset($data['content'])) { $updates[] = "content = ?"; $params[] = $data['content']; }
            if (isset($data['is_active'])) { $updates[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            
            $stmt = $pdo->prepare("UPDATE legal_pages SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            $page = $pdo->query("SELECT * FROM legal_pages WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            if ($page) {
                $page['is_active'] = (bool)$page['is_active'];
                echo successResponse($page);
            } else {
                echo errorResponse('Seite nicht gefunden', 404);
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
            
            $stmt = $pdo->prepare("DELETE FROM legal_pages WHERE id = ?");
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



