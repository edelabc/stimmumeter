<?php
/**
 * Auth Helper Functions
 * Wird von anderen APIs verwendet
 */

require_once __DIR__ . '/db.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Generiert einen JWT-ähnlichen Token (vereinfacht)
 */
function generateToken($userId, $email) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60) // 7 Tage
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", 'your-secret-key-change-in-production', true));
    return "$header.$payload.$signature";
}

/**
 * Validiert einen Token
 */
function validateToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    
    list($header, $payload, $signature) = $parts;
    $expectedSignature = base64_encode(hash_hmac('sha256', "$header.$payload", 'your-secret-key-change-in-production', true));
    
    if ($signature !== $expectedSignature) {
        return null;
    }
    
    $payloadData = json_decode(base64_decode($payload), true);
    
    // Prüfe Ablaufzeit
    if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
        return null;
    }
    
    return $payloadData;
}

/**
 * Holt den aktuellen Benutzer aus Token oder Session
 */
function getCurrentUserFromAuth($pdo) {
    // Prüfe Token im Authorization Header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $tokenData = validateToken($token);
        if ($tokenData) {
            $stmt = $pdo->prepare("SELECT * FROM users_profile WHERE id = ?");
            $stmt->execute([$tokenData['user_id']]);
            return $stmt->fetch();
        }
    }
    
    // Fallback: Session
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM users_profile WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    }
    
    return null;
}

/**
 * Prüft ob Benutzer Admin ist
 */
function isAdmin($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT user_id FROM admin_users WHERE user_id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    return $stmt->fetch() !== false;
}

?>




