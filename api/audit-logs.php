<?php
/**
 * Audit Logs API
 * CRUD-Operationen für System-Audit-Logs
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

try {
    $pdo = getDbConnection();
    $user = getCurrentUserFromAuth($pdo);
    
    // Nur Admins können Audit Logs sehen
    if (!$user || !isAdmin($pdo, $user['id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Zugriff verweigert - Admin-Rechte erforderlich']);
        exit;
    }
    
    switch ($action) {
        case 'list':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Method not allowed']);
                exit;
            }
            
            // Filter-Parameter
            $category = $_GET['category'] ?? null;
            $severity = $_GET['severity'] ?? null;
            $search = $_GET['search'] ?? null;
            $limit = min((int)($_GET['limit'] ?? 100), 1000); // Max 1000
            $offset = (int)($_GET['offset'] ?? 0);
            
            // Query bauen
            $where = [];
            $params = [];
            
            if ($category && $category !== 'all') {
                $where[] = "category = ?";
                $params[] = $category;
            }
            
            if ($severity && $severity !== 'all') {
                $where[] = "severity = ?";
                $params[] = $severity;
            }
            
            if ($search) {
                $where[] = "(action LIKE ? OR user_email LIKE ? OR error_message LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
            
            // Gesamtanzahl
            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM audit_logs $whereClause");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();
            
            // Logs abrufen
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $pdo->prepare("
                SELECT id, user_id, user_email, action, category, severity, details, error_message, ip_address, created_at
                FROM audit_logs 
                $whereClause
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // JSON-Strings zu Arrays konvertieren
            foreach ($logs as &$log) {
                if ($log['details'] && is_string($log['details'])) {
                    $log['details'] = json_decode($log['details'], true) ?: [];
                } else {
                    $log['details'] = [];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
            exit;
            
        case 'create':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Method not allowed']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $stmt = $pdo->prepare("
                INSERT INTO audit_logs (id, user_id, user_email, action, category, severity, details, error_message, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $data['user_id'] ?? $user['id'],
                $data['user_email'] ?? $user['email'],
                $data['action'],
                $data['category'] ?? 'system',
                $data['severity'] ?? 'info',
                isset($data['details']) ? json_encode($data['details']) : null,
                $data['error_message'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
            echo json_encode(['success' => true, 'id' => $id]);
            exit;
            
        case 'categories':
            // Distinct Kategorien abrufen
            $stmt = $pdo->query("SELECT DISTINCT category FROM audit_logs ORDER BY category");
            $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['success' => true, 'data' => $categories]);
            exit;
            
        case 'stats':
            // Statistiken
            $stats = [];
            
            // Nach Severity
            $stmt = $pdo->query("SELECT severity, COUNT(*) as count FROM audit_logs GROUP BY severity");
            $stats['by_severity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Nach Category
            $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM audit_logs GROUP BY category");
            $stats['by_category'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Letzte 24 Stunden
            $stmt = $pdo->query("SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $stats['last_24h'] = (int)$stmt->fetchColumn();
            
            // Gesamt
            $stmt = $pdo->query("SELECT COUNT(*) FROM audit_logs");
            $stats['total'] = (int)$stmt->fetchColumn();
            
            echo json_encode(['success' => true, 'data' => $stats]);
            exit;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ungültige Aktion: ' . $action]);
            exit;
    }
    
} catch (Exception $e) {
    error_log("Audit Logs API Fehler: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
