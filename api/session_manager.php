<?php
// api/session_manager.php

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

require_once 'db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'initialize':
        handleInitialize($pdo, $input);
        break;
    case 'get':
        handleGet($pdo);
        break;
    case 'update':
        handleUpdate($pdo, $input);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

function handleInitialize($pdo, $input) {
    $sessionId = $input['sessionId'] ?? '';
    
    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Session ID is required']);
        return;
    }

    try {
        // Check if table exists first
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'session_yra'")->fetch();
        if (!$tableCheck) {
            http_response_code(404);
            echo json_encode(['error' => 'Table session_yra does not exist', 'code' => 'TABLE_NOT_FOUND']);
            return;
        }

        // Check if session exists
        $stmt = $pdo->prepare("SELECT * FROM session_yra WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if ($session) {
            echo json_encode($session);
            return;
        }

        // Create new session
        $stmt = $pdo->prepare("INSERT INTO session_yra (session_id, yra_balance, assessments_count, created_at, last_activity) VALUES (?, 0, 0, NOW(), NOW())");
        $stmt->execute([$sessionId]);

        echo json_encode([
            'session_id' => $sessionId,
            'yra_balance' => 0,
            'assessments_count' => 0,
            'created_at' => date('c'),
            'last_activity' => date('c')
        ]);
    } catch (PDOException $e) {
        // Check if error is about missing table
        if (strpos($e->getMessage(), "doesn't exist") !== false || 
            strpos($e->getMessage(), "Base table or view not found") !== false) {
            http_response_code(404);
            echo json_encode(['error' => 'Table session_yra does not exist', 'code' => 'TABLE_NOT_FOUND']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
}

function handleGet($pdo) {
    $sessionId = $_GET['sessionId'] ?? '';

    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Session ID is required']);
        return;
    }

    try {
        // Check if table exists first
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'session_yra'")->fetch();
        if (!$tableCheck) {
            http_response_code(404);
            echo json_encode(['error' => 'Table session_yra does not exist', 'code' => 'TABLE_NOT_FOUND']);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM session_yra WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if ($session) {
            echo json_encode($session);
        } else {
            // Session nicht gefunden, aber Tabelle existiert
            // Das ist OK - bedeutet nur dass die Session nicht existiert
            // Verwende 200 Status-Code mit Flag, damit Frontend weiß dass Tabelle existiert
            http_response_code(200);
            echo json_encode(['error' => 'Session not found', 'code' => 'SESSION_NOT_FOUND', 'table_exists' => true, 'session_id' => null]);
        }
    } catch (PDOException $e) {
        // Check if error is about missing table
        if (strpos($e->getMessage(), "doesn't exist") !== false || 
            strpos($e->getMessage(), "Base table or view not found") !== false) {
            http_response_code(404);
            echo json_encode(['error' => 'Table session_yra does not exist', 'code' => 'TABLE_NOT_FOUND']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
}

function handleUpdate($pdo, $input) {
    // Not strictly needed for basic flow as assessments update the session, 
    // but useful for manual syncs if needed.
    // For now, we'll just return success.
    echo json_encode(['success' => true]);
}
?>
