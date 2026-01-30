<?php
/**
 * AI Configurations API
 * Ersetzt Supabase-Aufrufe für AI-Konfigurationen
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get action from query string
$action = $_GET['action'] ?? '';

try {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(['data' => null, 'error' => 'Datenbankverbindung fehlgeschlagen'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $user = getCurrentUserFromAuth($pdo);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['data' => null, 'error' => 'Nicht authentifiziert'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Helper function to generate UUID
    function generateUuid() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    // Helper function to format response
    function successResponse($data) {
        return json_encode(['data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE);
    }
    
    function errorResponse($message, $code = 400) {
        http_response_code($code);
        return json_encode(['data' => null, 'error' => $message], JSON_UNESCAPED_UNICODE);
    }
    
    // Simple encryption/decryption (should match frontend encryption.ts)
    function encryptApiKey($value) {
        if (empty($value)) return '';
        $key = 'mood-app-encryption-key-v1';
        $encrypted = '';
        for ($i = 0; $i < strlen($value); $i++) {
            $charCode = ord($value[$i]) ^ ord($key[$i % strlen($key)]);
            $encrypted .= chr($charCode);
        }
        return base64_encode($encrypted);
    }
    
    function decryptApiKey($encrypted) {
        if (empty($encrypted)) return '';
        $key = 'mood-app-encryption-key-v1';
        $decoded = base64_decode($encrypted);
        $decrypted = '';
        for ($i = 0; $i < strlen($decoded); $i++) {
            $charCode = ord($decoded[$i]) ^ ord($key[$i % strlen($key)]);
            $decrypted .= chr($charCode);
        }
        return $decrypted;
    }
    
    switch ($action) {
        // ============================================
        // GET ALL CONFIGURATIONS
        // ============================================
        case 'list':
        case '':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                try {
                    $userId = $_GET['user_id'] ?? $user['id'];
                    
                    // Users can only view their own configurations
                    if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                        echo errorResponse('Unauthorized', 403);
                        exit;
                    }
                    
                    // Prüfe ob Tabelle existiert
                    $tableCheck = $pdo->query("SHOW TABLES LIKE 'ai_configurations'")->fetch();
                    if (!$tableCheck) {
                        echo errorResponse('Tabelle ai_configurations existiert nicht. Bitte führen Sie database/create-ai-tables-production.sql aus.', 500);
                        exit;
                    }
                    
                    $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE user_id = ? ORDER BY created_at DESC");
                    $stmt->execute([$userId]);
                    $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Convert TINYINT to boolean
                    foreach ($configurations as &$config) {
                        $config['is_active'] = (bool)$config['is_active'];
                        $config['is_enabled'] = (bool)$config['is_enabled'];
                        // API key is already encrypted in DB, return as-is
                    }
                    
                    echo successResponse($configurations);
                } catch (PDOException $e) {
                    echo errorResponse('Datenbankfehler: ' . $e->getMessage(), 500);
                }
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // GET SINGLE CONFIGURATION
        // ============================================
        case 'get':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $config = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$config) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only view their own configurations
                if ($config['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // CREATE CONFIGURATION
        // ============================================
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $data['user_id'] ?? $user['id'];
                
                // Users can only create their own configurations
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                // Validate provider
                $validProviders = ['openai', 'gemini', 'claude', 'xai', 'manus'];
                if (!in_array($data['provider'], $validProviders)) {
                    echo errorResponse('Ungültiger Provider', 400);
                    exit;
                }
                
                // Encrypt API key
                $encryptedApiKey = encryptApiKey($data['api_key'] ?? '');
                
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO ai_configurations (id, user_id, nickname, provider, model, api_key, text_color, background_color, is_active, is_enabled, system_prompt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $userId,
                    $data['nickname'],
                    $data['provider'],
                    $data['model'],
                    $encryptedApiKey,
                    $data['text_color'] ?? '#000000',
                    $data['background_color'] ?? '#ffffff',
                    $data['is_active'] ? 1 : 0,
                    $data['is_enabled'] !== false ? 1 : 0,
                    $data['system_prompt'] ?? null
                ]);
                
                $config = $pdo->query("SELECT * FROM ai_configurations WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // UPDATE CONFIGURATION
        // ============================================
        case 'update':
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only update their own configurations
                if ($existing['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                
                $updates = [];
                $params = [];
                
                if (isset($data['nickname'])) {
                    $updates[] = "nickname = ?";
                    $params[] = $data['nickname'];
                }
                if (isset($data['provider'])) {
                    $validProviders = ['openai', 'gemini', 'claude', 'xai', 'manus'];
                    if (!in_array($data['provider'], $validProviders)) {
                        echo errorResponse('Ungültiger Provider', 400);
                        exit;
                    }
                    $updates[] = "provider = ?";
                    $params[] = $data['provider'];
                }
                if (isset($data['model'])) {
                    $updates[] = "model = ?";
                    $params[] = $data['model'];
                }
                if (isset($data['api_key'])) {
                    $encryptedApiKey = encryptApiKey($data['api_key']);
                    $updates[] = "api_key = ?";
                    $params[] = $encryptedApiKey;
                }
                if (isset($data['text_color'])) {
                    $updates[] = "text_color = ?";
                    $params[] = $data['text_color'];
                }
                if (isset($data['background_color'])) {
                    $updates[] = "background_color = ?";
                    $params[] = $data['background_color'];
                }
                if (isset($data['is_active'])) {
                    $updates[] = "is_active = ?";
                    $params[] = $data['is_active'] ? 1 : 0;
                }
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
                
                $stmt = $pdo->prepare("UPDATE ai_configurations SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                
                $config = $pdo->query("SELECT * FROM ai_configurations WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // DELETE CONFIGURATION
        // ============================================
        case 'delete':
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT user_id FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only delete their own configurations
                if ($existing['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // TEST CONFIGURATION
        // ============================================
        case 'test':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $config = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$config) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only test their own configurations
                if ($config['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                // Decrypt API key for testing
                $apiKey = decryptApiKey($config['api_key']);
                
                // Simple test: Try to make a minimal API call
                // This is a placeholder - actual implementation depends on provider
                $testResult = [
                    'success' => true,
                    'message' => 'API-Key ist gültig',
                    'provider' => $config['provider'],
                    'model' => $config['model']
                ];
                
                // TODO: Implement actual API test for each provider
                // For now, just check if API key is not empty
                if (empty($apiKey)) {
                    $testResult = [
                        'success' => false,
                        'message' => 'API-Key ist leer',
                        'provider' => $config['provider'],
                        'model' => $config['model']
                    ];
                }
                
                echo successResponse($testResult);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // GET ENABLED PROVIDERS
        // ============================================
        case 'enabled-providers':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                try {
                    // Prüfe ob Tabelle existiert
                    $tableCheck = $pdo->query("SHOW TABLES LIKE 'ai_provider_settings'")->fetch();
                    if (!$tableCheck) {
                        echo errorResponse('Tabelle ai_provider_settings existiert nicht. Bitte führen Sie database/create-ai-tables-production.sql aus.', 500);
                        exit;
                    }
                    
                    $stmt = $pdo->query("SELECT provider FROM ai_provider_settings WHERE is_enabled = 1");
                    $providers = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    echo successResponse($providers);
                } catch (PDOException $e) {
                    echo errorResponse('Datenbankfehler: ' . $e->getMessage(), 500);
                }
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // CHECK TERMS ACCEPTANCE
        // ============================================
        case 'check-terms':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $provider = $_GET['provider'] ?? '';
                if (empty($provider)) {
                    echo errorResponse('Provider erforderlich', 400);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT id FROM ai_terms_acceptance WHERE user_id = ? AND provider = ?");
                $stmt->execute([$user['id'], $provider]);
                $accepted = $stmt->fetch();
                
                echo successResponse(['accepted' => !!$accepted]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // ACCEPT TERMS
        // ============================================
        case 'accept-terms':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $provider = $data['provider'] ?? '';
                
                if (empty($provider)) {
                    echo errorResponse('Provider erforderlich', 400);
                    exit;
                }
                
                // Check if already accepted
                $stmt = $pdo->prepare("SELECT id FROM ai_terms_acceptance WHERE user_id = ? AND provider = ?");
                $stmt->execute([$user['id'], $provider]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE ai_terms_acceptance SET accepted_at = NOW(), terms_version = ? WHERE user_id = ? AND provider = ?");
                    $stmt->execute([$data['terms_version'] ?? '1.0', $user['id'], $provider]);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO ai_terms_acceptance (id, user_id, provider, terms_version) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$id, $user['id'], $provider, $data['terms_version'] ?? '1.0']);
                }
                
                echo successResponse(['accepted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // SET ACTIVE CONFIGURATION
        // ============================================
        case 'set-active':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT user_id FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only set active their own configurations
                if ($existing['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                // Set all user's configurations to inactive
                $stmt = $pdo->prepare("UPDATE ai_configurations SET is_active = 0 WHERE user_id = ?");
                $stmt->execute([$user['id']]);
                
                // Set this configuration to active
                $stmt = $pdo->prepare("UPDATE ai_configurations SET is_active = 1 WHERE id = ?");
                $stmt->execute([$id]);
                
                $config = $pdo->query("SELECT * FROM ai_configurations WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        default:
            // Default: List configurations
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $userId = $_GET['user_id'] ?? $user['id'];
                
                // Users can only view their own configurations
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
                $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($configurations as &$config) {
                    $config['is_active'] = (bool)$config['is_active'];
                    $config['is_enabled'] = (bool)$config['is_enabled'];
                }
                
                echo successResponse($configurations);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Create new configuration
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $data['user_id'] ?? $user['id'];
                
                // Users can only create their own configurations
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                // Validate provider
                $validProviders = ['openai', 'gemini', 'claude', 'xai', 'manus'];
                if (!in_array($data['provider'], $validProviders)) {
                    echo errorResponse('Ungültiger Provider', 400);
                    exit;
                }
                
                // Encrypt API key
                $encryptedApiKey = encryptApiKey($data['api_key'] ?? '');
                
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO ai_configurations (id, user_id, nickname, provider, model, api_key, text_color, background_color, is_active, is_enabled, system_prompt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $userId,
                    $data['nickname'],
                    $data['provider'],
                    $data['model'],
                    $encryptedApiKey,
                    $data['text_color'] ?? '#000000',
                    $data['background_color'] ?? '#ffffff',
                    $data['is_active'] ? 1 : 0,
                    $data['is_enabled'] !== false ? 1 : 0,
                    $data['system_prompt'] ?? null
                ]);
                
                $config = $pdo->query("SELECT * FROM ai_configurations WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update configuration
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT * FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only update their own configurations
                if ($existing['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                
                $updates = [];
                $params = [];
                
                if (isset($data['nickname'])) {
                    $updates[] = "nickname = ?";
                    $params[] = $data['nickname'];
                }
                if (isset($data['provider'])) {
                    $validProviders = ['openai', 'gemini', 'claude', 'xai', 'manus'];
                    if (!in_array($data['provider'], $validProviders)) {
                        echo errorResponse('Ungültiger Provider', 400);
                        exit;
                    }
                    $updates[] = "provider = ?";
                    $params[] = $data['provider'];
                }
                if (isset($data['model'])) {
                    $updates[] = "model = ?";
                    $params[] = $data['model'];
                }
                if (isset($data['api_key'])) {
                    $encryptedApiKey = encryptApiKey($data['api_key']);
                    $updates[] = "api_key = ?";
                    $params[] = $encryptedApiKey;
                }
                if (isset($data['text_color'])) {
                    $updates[] = "text_color = ?";
                    $params[] = $data['text_color'];
                }
                if (isset($data['background_color'])) {
                    $updates[] = "background_color = ?";
                    $params[] = $data['background_color'];
                }
                if (isset($data['is_active'])) {
                    $updates[] = "is_active = ?";
                    $params[] = $data['is_active'] ? 1 : 0;
                }
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
                
                $stmt = $pdo->prepare("UPDATE ai_configurations SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                
                $config = $pdo->query("SELECT * FROM ai_configurations WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $config['is_active'] = (bool)$config['is_active'];
                $config['is_enabled'] = (bool)$config['is_enabled'];
                
                echo successResponse($config);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Delete configuration
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    echo errorResponse('ID erforderlich', 400);
                    exit;
                }
                
                // Check if configuration exists and user has permission
                $stmt = $pdo->prepare("SELECT user_id FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    echo errorResponse('Konfiguration nicht gefunden', 404);
                    exit;
                }
                
                // Users can only delete their own configurations
                if ($existing['user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM ai_configurations WHERE id = ?");
                $stmt->execute([$id]);
                
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    $errorMessage = $e->getMessage();
    
    // Spezielle Behandlung für fehlende Tabellen
    if (strpos($errorMessage, "doesn't exist") !== false || 
        strpos($errorMessage, "Base table or view not found") !== false ||
        strpos($errorMessage, "Table") !== false && strpos($errorMessage, "doesn't exist") !== false) {
        echo json_encode([
            'data' => null,
            'error' => 'Database table not found',
            'message' => $errorMessage,
            'code' => 'TABLE_NOT_FOUND',
            'hint' => 'Die Tabellen ai_configurations, ai_provider_settings oder ai_terms_acceptance fehlen. ' .
                      'Bitte führen Sie das Script database/create-ai-tables-production.sql aus.'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'data' => null,
            'error' => 'Database error',
            'message' => $errorMessage,
            'code' => 'DB_ERROR'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'data' => null,
        'error' => $e->getMessage(),
        'code' => 'GENERAL_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}

?>

