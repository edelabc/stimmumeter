<?php
/**
 * Authentifizierungs-API
 * Ersetzt Supabase Auth durch PHP-basierte Authentifizierung
 */

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration and database
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php'; // Verwende gemeinsame Auth-Funktionen

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Holt den aktuellen Benutzer aus Token oder Session
 * (Alias für getCurrentUserFromAuth für Kompatibilität)
 */
function getCurrentUser($pdo) {
    return getCurrentUserFromAuth($pdo);
}

// Route-Handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'POST':
            switch ($action) {
                case 'signup':
                    // Registrierung
                    $data = json_decode(file_get_contents('php://input'), true);
                    $email = $data['email'] ?? '';
                    $password = $data['password'] ?? '';
                    $agreements = $data['agreements'] ?? [];
                    
                    if (empty($email) || empty($password)) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email und Passwort sind erforderlich']);
                        exit;
                    }
                    
                    // Prüfe ob Benutzer bereits existiert
                    $stmt = $pdo->prepare("SELECT id FROM users_profile WHERE email = ?");
                    $stmt->execute([$email]);
                    if ($stmt->fetch()) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Ein Benutzer mit dieser E-Mail existiert bereits']);
                        exit;
                    }
                    
                    // Erstelle Benutzer-ID (UUID-ähnlich)
                    $userId = bin2hex(random_bytes(16));
                    $userId = substr($userId, 0, 8) . '-' . substr($userId, 8, 4) . '-' . substr($userId, 12, 4) . '-' . substr($userId, 16, 4) . '-' . substr($userId, 20, 12);
                    
                    // Hash Passwort
                    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                    
                    // Erstelle Benutzer-Profil (prüfe ob password_hash Spalte existiert)
                    try {
                        $stmt = $pdo->prepare("INSERT INTO users_profile (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())");
                        $stmt->execute([$userId, $email, $passwordHash]);
                    } catch (PDOException $e) {
                        // Falls password_hash Spalte nicht existiert, füge sie hinzu
                        if (strpos($e->getMessage(), 'password_hash') !== false) {
                            $pdo->exec("ALTER TABLE users_profile ADD COLUMN password_hash VARCHAR(255) NULL");
                            $stmt = $pdo->prepare("INSERT INTO users_profile (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())");
                            $stmt->execute([$userId, $email, $passwordHash]);
                        } else {
                            throw $e;
                        }
                    }
                    
                    // Speichere Vereinbarungs-Zustimmungen
                    if (!empty($agreements)) {
                        // Prüfe ob Tabelle existiert
                        try {
                            $tableCheck = $pdo->query("SHOW TABLES LIKE 'user_agreement_consents'")->fetch();
                            if ($tableCheck) {
                                foreach ($agreements as $agreement) {
                                    if ($agreement['checked'] ?? false && !empty($agreement['agreementId'])) {
                                        try {
                                            $stmt = $pdo->prepare("INSERT INTO user_agreement_consents (id, user_id, agreement_id, consent_type, consented_at) VALUES (UUID(), ?, ?, ?, NOW())");
                                            $stmt->execute([$userId, $agreement['agreementId'], $agreement['consentType'] ?? 'accept']);
                                        } catch (PDOException $e) {
                                            // Logge Fehler, aber breche Registrierung nicht ab
                                            error_log("⚠️ [AUTH] Fehler beim Speichern der Vereinbarungs-Zustimmung: " . $e->getMessage());
                                        }
                                    }
                                }
                            } else {
                                error_log("⚠️ [AUTH] Tabelle 'user_agreement_consents' existiert nicht - Zustimmungen werden nicht gespeichert");
                            }
                        } catch (PDOException $e) {
                            // Logge Fehler, aber breche Registrierung nicht ab
                            error_log("⚠️ [AUTH] Fehler beim Prüfen der Tabelle 'user_agreement_consents': " . $e->getMessage());
                        }
                    }
                    
                    // Erstelle Token
                    $token = generateToken($userId, $email);
                    
                    // Session setzen
                    $_SESSION['user_id'] = $userId;
                    $_SESSION['email'] = $email;
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'user' => [
                                'id' => $userId,
                                'email' => $email
                            ],
                            'session' => [
                                'access_token' => $token
                            ]
                        ]
                    ]);
                    break;
                    
                case 'signin':
                    // Login
                    $data = json_decode(file_get_contents('php://input'), true);
                    $email = $data['email'] ?? '';
                    $password = $data['password'] ?? '';
                    
                    if (empty($email) || empty($password)) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email und Passwort sind erforderlich']);
                        exit;
                    }
                    
                    // Hole Benutzer
                    $stmt = $pdo->prepare("SELECT * FROM users_profile WHERE email = ?");
                    $stmt->execute([$email]);
                    $user = $stmt->fetch();
                    
                    if (!$user) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Ungültige E-Mail oder Passwort']);
                        exit;
                    }
                    
                    // Prüfe Passwort (falls password_hash vorhanden)
                    if (isset($user['password_hash']) && !empty($user['password_hash'])) {
                        if (!password_verify($password, $user['password_hash'])) {
                            http_response_code(401);
                            echo json_encode(['error' => 'Ungültige E-Mail oder Passwort']);
                            exit;
                        }
                    } else {
                        // Fallback: Wenn kein password_hash vorhanden, erstelle einen
                        // (für Migration bestehender Benutzer)
                        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                        try {
                            $updateStmt = $pdo->prepare("UPDATE users_profile SET password_hash = ? WHERE id = ?");
                            $updateStmt->execute([$passwordHash, $user['id']]);
                        } catch (PDOException $e) {
                            // Falls password_hash Spalte nicht existiert, füge sie hinzu
                            if (strpos($e->getMessage(), 'password_hash') !== false) {
                                $pdo->exec("ALTER TABLE users_profile ADD COLUMN password_hash VARCHAR(255) NULL");
                                $updateStmt = $pdo->prepare("UPDATE users_profile SET password_hash = ? WHERE id = ?");
                                $updateStmt->execute([$passwordHash, $user['id']]);
                            }
                        }
                    }
                    
                    // Prüfe ob Benutzer gesperrt ist
                    if (isset($user['is_blocked']) && $user['is_blocked']) {
                        http_response_code(403);
                        echo json_encode(['error' => 'Ihr Account wurde gesperrt. Bitte kontaktieren Sie den Administrator.']);
                        exit;
                    }
                    
                    // Erstelle Token
                    $token = generateToken($user['id'], $user['email']);
                    
                    // Session setzen
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['email'] = $user['email'];
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'user' => [
                                'id' => $user['id'],
                                'email' => $user['email']
                            ],
                            'session' => [
                                'access_token' => $token
                            ]
                        ]
                    ]);
                    break;
                    
                case 'signout':
                    // Logout
                    session_destroy();
                    echo json_encode(['success' => true]);
                    break;
                    
                case 'reset-password':
                    // Passwort-Reset anfordern
                    $data = json_decode(file_get_contents('php://input'), true);
                    $email = $data['email'] ?? '';
                    
                    // TODO: Implementiere Passwort-Reset-E-Mail
                    echo json_encode(['success' => true, 'message' => 'Passwort-Reset-E-Mail wurde gesendet']);
                    break;
                    
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Unbekannte Aktion']);
            }
            break;
            
        case 'GET':
            switch ($action) {
                case 'user':
                    // Aktueller Benutzer
                    $user = getCurrentUser($pdo);
                    if ($user) {
                        unset($user['password_hash']); // Passwort nicht zurückgeben
                        echo json_encode(['success' => true, 'data' => ['user' => $user]]);
                    } else {
                        http_response_code(401);
                        echo json_encode(['error' => 'Nicht authentifiziert']);
                    }
                    break;
                    
                case 'is-admin':
                    // Prüfe ob aktueller Benutzer Admin ist
                    $user = getCurrentUser($pdo);
                    if (!$user) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Nicht authentifiziert', 'isAdmin' => false]);
                        break;
                    }
                    
                    $adminStatus = isAdmin($pdo, $user['id']);
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'isAdmin' => $adminStatus,
                            'userId' => $user['id']
                        ]
                    ]);
                    break;
                    
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Unbekannte Aktion']);
            }
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

