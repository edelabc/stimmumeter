<?php
/**
 * Footer Settings API
 * CRUD-Operationen für Footer-Einstellungen
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

    switch ($method) {
        case 'GET':
            // Hole Footer-Einstellungen
            $stmt = $pdo->query("SELECT * FROM footer_settings LIMIT 1");
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                // Erstelle Standard-Einstellungen wenn keine vorhanden
                $id = generateUuid();
                $defaultContent = json_encode([
                    'text' => '© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.',
                    'links' => []
                ]);
                
                $stmt = $pdo->prepare("INSERT INTO footer_settings (id, content) VALUES (?, ?)");
                $stmt->execute([$id, $defaultContent]);
                
                $settings = [
                    'id' => $id,
                    'content' => json_decode($defaultContent, true),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            } else {
                // Dekodiere JSON content
                if (isset($settings['content']) && is_string($settings['content'])) {
                    $settings['content'] = json_decode($settings['content'], true);
                }
            }

            echo successResponse($settings);
            break;

        case 'PUT':
        case 'POST':
            // Nur Admins können Footer-Einstellungen ändern
            if (!isAdmin($pdo, $user['id'] ?? null)) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $content = $data['content'] ?? null;

            if (!$content) {
                echo errorResponse('Content erforderlich', 400);
                exit;
            }

            // Prüfe ob Einstellungen existieren
            $stmt = $pdo->query("SELECT id FROM footer_settings LIMIT 1");
            $existing = $stmt->fetch();

            if ($existing) {
                // Update
                $stmt = $pdo->prepare("UPDATE footer_settings SET content = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([json_encode($content), $existing['id']]);
                
                $settings = [
                    'id' => $existing['id'],
                    'content' => $content,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            } else {
                // Insert
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO footer_settings (id, content) VALUES (?, ?)");
                $stmt->execute([$id, json_encode($content)]);
                
                $settings = [
                    'id' => $id,
                    'content' => $content,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }

            echo successResponse($settings);
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
