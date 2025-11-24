<?php
/**
 * Master Data API
 * Ersetzt Supabase-Aufrufe für Master-Daten
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
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['data' => null, 'error' => 'Nicht authentifiziert'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
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
    $table = $_GET['table'] ?? '';
    
    // Allowed tables for master data
    $allowedTables = ['currencies', 'billing_item_types', 'help_texts'];
    
    if (!in_array($table, $allowedTables) && !empty($table)) {
        echo errorResponse('Ungültige Tabelle', 400);
        exit;
    }
    
    switch ($method) {
        case 'GET':
            if ($action === 'list' || $action === '') {
                // Return list of available master data tables
                echo successResponse([
                    'tables' => $allowedTables,
                    'message' => 'Verwenden Sie ?table=<table_name> um Daten abzurufen'
                ]);
            } elseif ($table) {
                // Get data from specific table
                $stmt = $pdo->query("SELECT * FROM $table ORDER BY created_at DESC");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Convert TINYINT to boolean where applicable
                foreach ($data as &$row) {
                    if (isset($row['is_active'])) {
                        $row['is_active'] = (bool)$row['is_active'];
                    }
                    if (isset($row['is_base'])) {
                        $row['is_base'] = (bool)$row['is_base'];
                    }
                }
                
                echo successResponse($data);
            } else {
                echo errorResponse('Tabelle erforderlich', 400);
            }
            break;
            
        case 'POST':
            if (!isAdmin($pdo, $user['id'])) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            if (!$table) {
                echo errorResponse('Tabelle erforderlich', 400);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Build INSERT query dynamically based on table
            $columns = [];
            $placeholders = [];
            $values = [];
            
            foreach ($data as $key => $value) {
                $columns[] = $key;
                $placeholders[] = '?';
                if (is_bool($value)) {
                    $values[] = $value ? 1 : 0;
                } else {
                    $values[] = $value;
                }
            }
            
            $id = generateUuid();
            $columns[] = 'id';
            $placeholders[] = '?';
            $values[] = $id;
            
            $sql = "INSERT INTO $table (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            
            $result = $pdo->query("SELECT * FROM $table WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            if (isset($result['is_active'])) {
                $result['is_active'] = (bool)$result['is_active'];
            }
            
            echo successResponse($result);
            break;
            
        case 'PUT':
            if (!isAdmin($pdo, $user['id'])) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                echo errorResponse('ID erforderlich', 400);
                exit;
            }
            
            if (!$table) {
                echo errorResponse('Tabelle erforderlich', 400);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $updates = [];
            $params = [];
            
            foreach ($data as $key => $value) {
                $updates[] = "$key = ?";
                if (is_bool($value)) {
                    $params[] = $value ? 1 : 0;
                } else {
                    $params[] = $value;
                }
            }
            
            if (empty($updates)) {
                echo errorResponse('Keine Updates angegeben', 400);
                exit;
            }
            
            $params[] = $id;
            $sql = "UPDATE $table SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $result = $pdo->query("SELECT * FROM $table WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                if (isset($result['is_active'])) {
                    $result['is_active'] = (bool)$result['is_active'];
                }
                echo successResponse($result);
            } else {
                echo errorResponse('Datensatz nicht gefunden', 404);
            }
            break;
            
        case 'DELETE':
            if (!isAdmin($pdo, $user['id'])) {
                echo errorResponse('Unauthorized', 403);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                echo errorResponse('ID erforderlich', 400);
                exit;
            }
            
            if (!$table) {
                echo errorResponse('Tabelle erforderlich', 400);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
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

