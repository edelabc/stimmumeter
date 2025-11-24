<?php
/**
 * Users API
 * CRUD-Operationen für Benutzerverwaltung (nur für Admins)
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

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

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
        case 'GET':
            if ($action === 'list' || $action === '') {
                // Liste aller Benutzer mit Admin-Status
                $stmt = $pdo->prepare("
                    SELECT up.*, 
                           CASE WHEN au.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
                    FROM users_profile up
                    LEFT JOIN admin_users au ON up.id = au.user_id AND au.is_active = 1
                    ORDER BY up.created_at DESC
                ");
                $stmt->execute();
                $users = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $users]);
            } elseif ($action === 'get') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT up.*, 
                           CASE WHEN au.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
                    FROM users_profile up
                    LEFT JOIN admin_users au ON up.id = au.user_id AND au.is_active = 1
                    WHERE up.id = ?
                ");
                $stmt->execute([$id]);
                $user = $stmt->fetch();
                
                if ($user) {
                    echo json_encode(['success' => true, 'data' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Benutzer nicht gefunden']);
                }
            }
            break;
            
        case 'PUT':
            // Benutzer aktualisieren
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Update-Felder
            $updateFields = [];
            $updateValues = [];
            
            $allowedFields = ['salutation', 'preferred_language', 'location_label', 
                'street', 'house_number', 'house_number_addition', 'postal_code', 
                'city', 'city_addition', 'state', 'country', 'is_blocked'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $data[$field];
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $id;
                $sql = "UPDATE users_profile SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
            }
            
            // Hole aktualisierten Benutzer
            $stmt = $pdo->prepare("
                SELECT up.*, 
                       CASE WHEN au.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
                FROM users_profile up
                LEFT JOIN admin_users au ON up.id = au.user_id AND au.is_active = 1
                WHERE up.id = ?
            ");
            $stmt->execute([$id]);
            $updatedUser = $stmt->fetch();
            
            echo json_encode(['success' => true, 'data' => $updatedUser]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Lösche Admin-Rechte zuerst
            $stmt = $pdo->prepare("DELETE FROM admin_users WHERE user_id = ?");
            $stmt->execute([$id]);
            
            // Lösche Benutzer
            $stmt = $pdo->prepare("DELETE FROM users_profile WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Benutzer gelöscht']);
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

