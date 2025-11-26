<?php
/**
 * AI Provider Settings API
 * Verwaltung der AI-Provider-Einstellungen (aktivieren/deaktivieren, System-Prompts)
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

    // Nur Admins dürfen AI-Provider-Settings verwalten
    if (!isAdmin($pdo, $user['id'] ?? null)) {
        http_response_code(403);
        echo json_encode(['data' => null, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
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
            // Liste aller Provider-Settings
            try {
                $stmt = $pdo->query("SELECT * FROM ai_provider_settings ORDER BY provider");
                $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Convert TINYINT to boolean
                foreach ($providers as &$provider) {
                    $provider['is_enabled'] = (bool)$provider['is_enabled'];
                }

                echo successResponse($providers);
            } catch (PDOException $e) {
                echo errorResponse('Datenbankfehler: ' . $e->getMessage(), 500);
            }
            break;

        case 'PUT':
            // Update Provider-Settings
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                echo errorResponse('ID erforderlich', 400);
                exit;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $updates = [];
            $params = [];

            if (isset($data['is_enabled'])) {
                $updates[] = "is_enabled = ?";
                $params[] = $data['is_enabled'] ? 1 : 0;
            }
            if (isset($data['system_prompt'])) {
                $updates[] = "system_prompt = ?";
                $params[] = $data['system_prompt'];
            }

            if (empty($updates)) {
                echo errorResponse('Keine Updates angegeben', 400);
                exit;
            }

            $updates[] = "updated_at = NOW()";
            $params[] = $id;

            try {
                $stmt = $pdo->prepare("UPDATE ai_provider_settings SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);

                // Hole aktualisierte Daten
                $stmt = $pdo->prepare("SELECT * FROM ai_provider_settings WHERE id = ?");
                $stmt->execute([$id]);
                $provider = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($provider) {
                    $provider['is_enabled'] = (bool)$provider['is_enabled'];
                    echo successResponse($provider);
                } else {
                    echo errorResponse('Provider nicht gefunden', 404);
                }
            } catch (PDOException $e) {
                echo errorResponse('Datenbankfehler: ' . $e->getMessage(), 500);
            }
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
