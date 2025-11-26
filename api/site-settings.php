<?php
/**
 * Site Settings API
 * Ersetzt Supabase-Aufrufe für Site-Einstellungen
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
            // Anyone can view site settings
            $stmt = $pdo->query("SELECT * FROM site_settings LIMIT 1");
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$settings) {
                // Create default settings
                $id = generateUuid();
                $pdo->exec("INSERT INTO site_settings (id, site_name, site_description, meta_keywords) VALUES ('$id', 'Stimmungs-Tracker', 'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden', 'Stimmung, Tracker, Mental Health, Wohlbefinden')");
                $settings = $pdo->query("SELECT * FROM site_settings WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            }
            
            echo successResponse($settings);
            break;
            
        case 'PUT':
        case 'POST':
            if (!isAdmin($pdo, $user['id'] ?? null)) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if settings exist
            $stmt = $pdo->query("SELECT id FROM site_settings LIMIT 1");
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update
                $updates = [];
                $params = [];
                if (isset($data['site_name'])) { $updates[] = "site_name = ?"; $params[] = $data['site_name']; }
                if (isset($data['site_description'])) { $updates[] = "site_description = ?"; $params[] = $data['site_description']; }
                if (isset($data['meta_keywords'])) { $updates[] = "meta_keywords = ?"; $params[] = $data['meta_keywords']; }
                $updates[] = "updated_at = NOW()";
                $params[] = $existing['id'];
                
                $stmt = $pdo->prepare("UPDATE site_settings SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                $settings = $pdo->query("SELECT * FROM site_settings WHERE id = '{$existing['id']}'")->fetch(PDO::FETCH_ASSOC);
            } else {
                // Insert
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO site_settings (id, site_name, site_description, meta_keywords) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $data['site_name'] ?? 'Stimmungs-Tracker',
                    $data['site_description'] ?? 'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden',
                    $data['meta_keywords'] ?? 'Stimmung, Tracker, Mental Health, Wohlbefinden'
                ]);
                $settings = $pdo->query("SELECT * FROM site_settings WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
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



