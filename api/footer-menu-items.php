<?php
/**
 * Footer Menu Items API
 * CRUD-Operationen für Footer-Menü-Items
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
                // Liste aller Footer-Menü-Items
                $stmt = $pdo->query("SELECT * FROM footer_menu_items WHERE is_active = 1 ORDER BY category, position");
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($items as &$item) {
                    $item['is_active'] = (bool)$item['is_active'];
                    // URL für verlinkte Vereinbarungen generieren
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

                $stmt = $pdo->prepare("SELECT * FROM footer_menu_items WHERE id = ?");
                $stmt->execute([$id]);
                $item = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($item) {
                    $item['is_active'] = (bool)$item['is_active'];
                    echo successResponse($item);
                } else {
                    echo errorResponse('Footer-Menü-Item nicht gefunden', 404);
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

            $stmt = $pdo->prepare("INSERT INTO footer_menu_items (id, title, url, position, is_active, category, linked_agreement_id, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['title'],
                $data['url'],
                $data['position'] ?? 0,
                $data['is_active'] !== false ? 1 : 0,
                $data['category'] ?? 'general',
                $data['linked_agreement_id'] ?? null,
                $data['slug'] ?? null
            ]);

            $item = $pdo->query("SELECT * FROM footer_menu_items WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
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
            if (isset($data['category'])) { $updates[] = "category = ?"; $params[] = $data['category']; }
            if (isset($data['linked_agreement_id'])) { $updates[] = "linked_agreement_id = ?"; $params[] = $data['linked_agreement_id']; }
            if (isset($data['slug'])) { $updates[] = "slug = ?"; $params[] = $data['slug']; }
            $updates[] = "updated_at = NOW()";
            $params[] = $id;

            $stmt = $pdo->prepare("UPDATE footer_menu_items SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            $item = $pdo->query("SELECT * FROM footer_menu_items WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            if ($item) {
                $item['is_active'] = (bool)$item['is_active'];
                echo successResponse($item);
            } else {
                echo errorResponse('Footer-Menü-Item nicht gefunden', 404);
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

            $stmt = $pdo->prepare("DELETE FROM footer_menu_items WHERE id = ?");
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
