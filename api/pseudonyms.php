<?php
/**
 * Pseudonyme API
 * CRUD-Operationen für Pseudonyme
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
require_once __DIR__ . '/auth-helper.php'; // Für getCurrentUserFromAuth()

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
            if ($action === 'list' || $action === '') {
                // Liste aller Pseudonyme des Benutzers
                $stmt = $pdo->prepare("SELECT * FROM pseudonyms WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$user['id']]);
                $pseudonyms = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $pseudonyms]);
            } elseif ($action === 'get') {
                // Einzelnes Pseudonym
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM pseudonyms WHERE id = ? AND user_id = ?");
                $stmt->execute([$id, $user['id']]);
                $pseudonym = $stmt->fetch();
                
                if ($pseudonym) {
                    echo json_encode(['success' => true, 'data' => $pseudonym]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Pseudonym nicht gefunden']);
                }
            }
            break;
            
        case 'POST':
            // Neues Pseudonym erstellen
            $data = json_decode(file_get_contents('php://input'), true);
            
            $id = bin2hex(random_bytes(16));
            $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
            
            $name = $data['name'] ?? '';
            $color = $data['color'] ?? '#3b82f6';
            $age = $data['age'] ?? null;
            $gender = $data['gender'] ?? null;
            $weight = $data['weight'] ?? null;
            $height = $data['height'] ?? null;
            $occupation = $data['occupation'] ?? null;
            $country = $data['country'] ?? null;
            $state = $data['state'] ?? null;
            $city = $data['city'] ?? null;
            $city_addition = $data['city_addition'] ?? null;
            $street = $data['street'] ?? null;
            $house_number = $data['house_number'] ?? null;
            $house_number_addition = $data['house_number_addition'] ?? null;
            $language = $data['language'] ?? null;
            
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name ist erforderlich']);
                exit;
            }
            
            $stmt = $pdo->prepare("INSERT INTO pseudonyms (
                id, user_id, name, color, age, gender, weight, height, occupation,
                country, state, city, city_addition, street, house_number, house_number_addition, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $id, $user['id'], $name, $color, $age, $gender, $weight, $height, $occupation,
                $country, $state, $city, $city_addition, $street, $house_number, $house_number_addition, $language
            ]);
            
            // Hole erstelltes Pseudonym
            $stmt = $pdo->prepare("SELECT * FROM pseudonyms WHERE id = ?");
            $stmt->execute([$id]);
            $pseudonym = $stmt->fetch();
            
            echo json_encode(['success' => true, 'data' => $pseudonym]);
            break;
            
        case 'PUT':
            // Pseudonym aktualisieren
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe ob Pseudonym dem Benutzer gehört
            $stmt = $pdo->prepare("SELECT id FROM pseudonyms WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Update-Felder
            $updateFields = [];
            $updateValues = [];
            
            $allowedFields = ['name', 'color', 'age', 'gender', 'weight', 'height', 'occupation',
                'country', 'state', 'city', 'city_addition', 'street', 'house_number', 'house_number_addition', 'language'];
            
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
            $sql = "UPDATE pseudonyms SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            // Hole aktualisiertes Pseudonym
            $stmt = $pdo->prepare("SELECT * FROM pseudonyms WHERE id = ?");
            $stmt->execute([$id]);
            $pseudonym = $stmt->fetch();
            
            echo json_encode(['success' => true, 'data' => $pseudonym]);
            break;
            
        case 'DELETE':
            // Pseudonym löschen
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe ob Pseudonym dem Benutzer gehört
            $stmt = $pdo->prepare("SELECT id FROM pseudonyms WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Lösche Pseudonym
            $stmt = $pdo->prepare("DELETE FROM pseudonyms WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Pseudonym gelöscht']);
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

