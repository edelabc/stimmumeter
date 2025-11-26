<?php
/**
 * Admin Users API
 * Verwaltung von Admin-Rechten
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $user = getCurrentUserFromAuth($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht authentifiziert']);
        exit;
    }

    // Prüfe Admin-Berechtigung
    if (!isAdmin($pdo, $user['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Keine Admin-Berechtigung']);
        exit;
    }

    switch ($method) {
        case 'POST':
            // Admin-Recht hinzufügen
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? '';
            
            if (empty($userId)) {
                http_response_code(400);
                echo json_encode(['error' => 'user_id erforderlich']);
                exit;
            }
            
            // Prüfe ob Benutzer existiert
            $stmt = $pdo->prepare("SELECT id FROM users_profile WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Benutzer nicht gefunden']);
                exit;
            }
            
            // Füge Admin-Recht hinzu
            $stmt = $pdo->prepare("INSERT INTO admin_users (user_id, is_active, created_at) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE is_active = 1");
            $stmt->execute([$userId]);
            
            echo json_encode(['success' => true, 'message' => 'Admin-Recht hinzugefügt']);
            break;
            
        case 'DELETE':
            // Admin-Recht entfernen
            $userId = $_GET['user_id'] ?? '';
            
            if (empty($userId)) {
                http_response_code(400);
                echo json_encode(['error' => 'user_id erforderlich']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM admin_users WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            echo json_encode(['success' => true, 'message' => 'Admin-Recht entfernt']);
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



