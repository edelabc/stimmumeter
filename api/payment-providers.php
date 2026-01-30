<?php
/**
 * Payment Providers API
 * CRUD-Operationen für Payment Provider Konfigurationen
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

/**
 * Prüft und fügt fehlende Spalten zur payment_providers Tabelle hinzu
 */
function ensurePaymentProvidersColumns($pdo) {
    try {
        $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers");
        $columns = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
        
        $columnsToAdd = [];
        if (!in_array('config', $columns)) {
            $columnsToAdd[] = "ADD COLUMN config JSON DEFAULT '{}'";
        }
        if (!in_array('is_test_mode', $columns)) {
            $columnsToAdd[] = "ADD COLUMN is_test_mode TINYINT(1) DEFAULT 1";
        }
        if (!in_array('updated_at', $columns)) {
            $columnsToAdd[] = "ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
        }
        
        if (!empty($columnsToAdd)) {
            $sql = "ALTER TABLE payment_providers " . implode(', ', $columnsToAdd);
            $pdo->exec($sql);
            error_log("✅ Payment Providers Spalten hinzugefügt: " . implode(', ', array_map(function($col) {
                return preg_replace('/ADD COLUMN (\w+).*/', '$1', $col);
            }, $columnsToAdd)));
        }
    } catch (Exception $e) {
        // Fehler beim Hinzufügen der Spalten - ignorieren, API funktioniert auch ohne
        error_log("⚠️ Fehler beim Hinzufügen der Payment Providers Spalten: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // Stelle sicher, dass alle benötigten Spalten existieren
    ensurePaymentProvidersColumns($pdo);
    
    $user = getCurrentUserFromAuth($pdo);
    
    // Prüfe Admin-Rechte nur für schreibende Operationen (POST, DELETE)
    // GET-Operationen sind für alle authentifizierten Benutzer erlaubt (für Payment-Flow)
    if ($method !== 'GET') {
        if (!$user || !isAdmin($pdo, $user['id'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Zugriff verweigert - Admin-Rechte erforderlich']);
            exit;
        }
    }

    switch ($method) {
        case 'GET':
            if ($action === 'list' || $action === '') {
                // Liste aller Payment Provider
                // Prüfe welche Spalten existieren
                $hasConfig = false;
                $hasTestMode = false;
                $hasUpdatedAt = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers");
                    $columns = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
                    $hasConfig = in_array('config', $columns);
                    $hasTestMode = in_array('is_test_mode', $columns);
                    $hasUpdatedAt = in_array('updated_at', $columns);
                } catch (Exception $e) {
                    // Fehler beim Prüfen - verwende Standardwerte
                }
                
                $selectFields = ["id", "code", "name", "is_active", "created_at"];
                if ($hasConfig) $selectFields[] = "config";
                if ($hasTestMode) $selectFields[] = "is_test_mode";
                if ($hasUpdatedAt) $selectFields[] = "updated_at";
                
                $stmt = $pdo->prepare("SELECT " . implode(', ', $selectFields) . " FROM payment_providers ORDER BY name ASC");
                $stmt->execute();
                $providers = $stmt->fetchAll();
                
                // Konvertiere JSON-Strings zu Arrays
                foreach ($providers as &$provider) {
                    if ($hasConfig && isset($provider['config']) && is_string($provider['config'])) {
                        $provider['config'] = json_decode($provider['config'], true) ?: [];
                    } elseif (!$hasConfig) {
                        // Wenn config Spalte nicht existiert, erstelle leeres config
                        $provider['config'] = [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $provider['is_active'] = (bool)$provider['is_active'];
                    $provider['is_test_mode'] = $hasTestMode ? (bool)($provider['is_test_mode'] ?? false) : true; // Default zu true wenn Spalte fehlt
                    if (!$hasUpdatedAt || !isset($provider['updated_at'])) {
                        $provider['updated_at'] = $provider['created_at'] ?? date('Y-m-d H:i:s');
                    }
                }
                
                echo json_encode(['success' => true, 'data' => $providers]);
                exit;
            } elseif ($action === 'get') {
                $code = $_GET['code'] ?? '';
                if (empty($code)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Code erforderlich']);
                    exit;
                }
                
                // Prüfe welche Spalten existieren
                $hasConfig = false;
                $hasTestMode = false;
                $hasUpdatedAt = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers");
                    $columns = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
                    $hasConfig = in_array('config', $columns);
                    $hasTestMode = in_array('is_test_mode', $columns);
                    $hasUpdatedAt = in_array('updated_at', $columns);
                } catch (Exception $e) {
                    // Fehler beim Prüfen - verwende Standardwerte
                }
                
                $selectFields = ["id", "code", "name", "is_active", "created_at"];
                if ($hasConfig) $selectFields[] = "config";
                if ($hasTestMode) $selectFields[] = "is_test_mode";
                if ($hasUpdatedAt) $selectFields[] = "updated_at";
                
                $stmt = $pdo->prepare("SELECT " . implode(', ', $selectFields) . " FROM payment_providers WHERE code = ?");
                $stmt->execute([$code]);
                $provider = $stmt->fetch();
                
                if ($provider) {
                    // Konvertiere JSON-String zu Array
                    if ($hasConfig && isset($provider['config']) && is_string($provider['config'])) {
                        $provider['config'] = json_decode($provider['config'], true) ?: [];
                    } elseif (!$hasConfig) {
                        // Wenn config Spalte nicht existiert, erstelle leeres config
                        $provider['config'] = [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $provider['is_active'] = (bool)$provider['is_active'];
                    $provider['is_test_mode'] = $hasTestMode ? (bool)($provider['is_test_mode'] ?? false) : true;
                    if (!$hasUpdatedAt || !isset($provider['updated_at'])) {
                        $provider['updated_at'] = $provider['created_at'] ?? date('Y-m-d H:i:s');
                    }
                    
                    echo json_encode(['success' => true, 'data' => $provider]);
                } else {
                    // Wenn kein Provider gefunden wurde, liefern wir ein erfolgreiches Ergebnis mit data = null
                    // Das macht das Frontend robuster beim lokalen Setup (Provider kann via Admin UI erstellt werden)
                    echo json_encode(['success' => true, 'data' => null]);
                }
                exit;
            } elseif ($action === 'active') {
                // Prüfe welche Spalten existieren
                $hasConfig = false;
                $hasTestMode = false;
                $hasUpdatedAt = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers");
                    $columns = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
                    $hasConfig = in_array('config', $columns);
                    $hasTestMode = in_array('is_test_mode', $columns);
                    $hasUpdatedAt = in_array('updated_at', $columns);
                } catch (Exception $e) {
                    // Fehler beim Prüfen - verwende Standardwerte
                }
                
                $selectFields = ["id", "code", "name", "is_active", "created_at"];
                if ($hasConfig) $selectFields[] = "config";
                if ($hasTestMode) $selectFields[] = "is_test_mode";
                if ($hasUpdatedAt) $selectFields[] = "updated_at";
                
                // Aktiver Payment Provider
                $stmt = $pdo->prepare("SELECT " . implode(', ', $selectFields) . " FROM payment_providers WHERE is_active = 1 LIMIT 1");
                $stmt->execute();
                $provider = $stmt->fetch();
                
                if ($provider) {
                    // Konvertiere JSON-String zu Array
                    if ($hasConfig && isset($provider['config']) && is_string($provider['config'])) {
                        $provider['config'] = json_decode($provider['config'], true) ?: [];
                    } elseif (!$hasConfig) {
                        // Wenn config Spalte nicht existiert, erstelle leeres config
                        $provider['config'] = [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $provider['is_active'] = (bool)$provider['is_active'];
                    $provider['is_test_mode'] = $hasTestMode ? (bool)($provider['is_test_mode'] ?? false) : true;
                    if (!$hasUpdatedAt || !isset($provider['updated_at'])) {
                        $provider['updated_at'] = $provider['created_at'] ?? date('Y-m-d H:i:s');
                    }
                    
                    echo json_encode(['success' => true, 'data' => $provider]);
                } else {
                    echo json_encode(['success' => true, 'data' => null]);
                }
                exit;
            } elseif ($action === 'webhooks') {
                $providerId = $_GET['provider_id'] ?? '';
                if (empty($providerId)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'provider_id erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM payment_provider_webhooks WHERE provider_id = ? ORDER BY created_at DESC");
                $stmt->execute([$providerId]);
                $webhooks = $stmt->fetchAll();
                
                // Konvertiere JSON-Strings zu Arrays
                foreach ($webhooks as &$webhook) {
                    if (isset($webhook['events']) && is_string($webhook['events'])) {
                        $webhook['events'] = json_decode($webhook['events'], true) ?: [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $webhook['is_active'] = (bool)$webhook['is_active'];
                }
                
                echo json_encode(['success' => true, 'data' => $webhooks]);
                exit;
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültige JSON-Daten: ' . json_last_error_msg()]);
                exit;
            }
            
            if ($action === 'upsert') {
                // Upsert Payment Provider
                $code = $data['code'] ?? '';
                $name = $data['name'] ?? '';
                $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 0;
                $isTestMode = isset($data['is_test_mode']) ? (int)$data['is_test_mode'] : 1;
                $config = isset($data['config']) ? json_encode($data['config']) : '{}';
                
                if (empty($code) || empty($name)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'code und name sind erforderlich']);
                    exit;
                }
                
                // Prüfe welche Spalten existieren
                $hasConfig = false;
                $hasTestMode = false;
                $hasUpdatedAt = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers");
                    $columns = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
                    $hasConfig = in_array('config', $columns);
                    $hasTestMode = in_array('is_test_mode', $columns);
                    $hasUpdatedAt = in_array('updated_at', $columns);
                } catch (Exception $e) {
                    // Fehler beim Prüfen - verwende Standardwerte
                }
                
                // Prüfe ob Provider existiert
                $stmt = $pdo->prepare("SELECT id FROM payment_providers WHERE code = ?");
                $stmt->execute([$code]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    // Update
                    $updateFields = ["name = ?", "is_active = ?"];
                    $updateValues = [$name, $isActive];
                    
                    if ($hasConfig) {
                        $updateFields[] = "config = ?";
                        $updateValues[] = $config;
                    }
                    if ($hasTestMode) {
                        $updateFields[] = "is_test_mode = ?";
                        $updateValues[] = $isTestMode;
                    }
                    if ($hasUpdatedAt) {
                        $updateFields[] = "updated_at = NOW()";
                    }
                    
                    $updateValues[] = $code;
                    
                    $sql = "UPDATE payment_providers SET " . implode(', ', $updateFields) . " WHERE code = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($updateValues);
                    $providerId = $existing['id'];
                } else {
                    // Insert
                    $providerId = bin2hex(random_bytes(16));
                    $providerId = substr($providerId, 0, 8) . '-' . substr($providerId, 8, 4) . '-' . substr($providerId, 12, 4) . '-' . substr($providerId, 16, 4) . '-' . substr($providerId, 20, 12);
                    
                    $insertFields = ["id", "code", "name", "is_active"];
                    $insertValues = [$providerId, $code, $name, $isActive];
                    $placeholders = ["?", "?", "?", "?"];
                    
                    if ($hasConfig) {
                        $insertFields[] = "config";
                        $insertValues[] = $config;
                        $placeholders[] = "?";
                    }
                    if ($hasTestMode) {
                        $insertFields[] = "is_test_mode";
                        $insertValues[] = $isTestMode;
                        $placeholders[] = "?";
                    }
                    if ($hasUpdatedAt) {
                        $insertFields[] = "updated_at";
                        $insertValues[] = date('Y-m-d H:i:s');
                        $placeholders[] = "?";
                    }
                    
                    $sql = "INSERT INTO payment_providers (" . implode(', ', $insertFields) . ", created_at) VALUES (" . implode(', ', $placeholders) . ", NOW())";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($insertValues);
                }
                
                // Hole aktualisierten Provider
                $selectFields = ["id", "code", "name", "is_active", "created_at"];
                if ($hasConfig) $selectFields[] = "config";
                if ($hasTestMode) $selectFields[] = "is_test_mode";
                if ($hasUpdatedAt) $selectFields[] = "updated_at";
                
                $stmt = $pdo->prepare("SELECT " . implode(', ', $selectFields) . " FROM payment_providers WHERE id = ?");
                $stmt->execute([$providerId]);
                $provider = $stmt->fetch();
                
                if ($provider) {
                    // Konvertiere JSON-String zu Array
                    if ($hasConfig && isset($provider['config']) && is_string($provider['config'])) {
                        $provider['config'] = json_decode($provider['config'], true) ?: [];
                    } elseif (!$hasConfig) {
                        // Wenn config Spalte nicht existiert, erstelle leeres config
                        $provider['config'] = [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $provider['is_active'] = (bool)$provider['is_active'];
                    $provider['is_test_mode'] = $hasTestMode ? (bool)($provider['is_test_mode'] ?? false) : true;
                    if (!$hasUpdatedAt || !isset($provider['updated_at'])) {
                        $provider['updated_at'] = $provider['created_at'] ?? date('Y-m-d H:i:s');
                    }
                    
                    echo json_encode(['success' => true, 'data' => $provider]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Fehler beim Laden des aktualisierten Providers']);
                }
                exit;
            } elseif ($action === 'activate') {
                $code = $data['code'] ?? '';
                $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 0;
                
                if (empty($code)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'code erforderlich']);
                    exit;
                }
                
                // Prüfe ob updated_at Spalte existiert
                $hasUpdatedAt = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers LIKE 'updated_at'");
                    $hasUpdatedAt = $checkStmt->fetch() !== false;
                } catch (Exception $e) {
                    // Spalte existiert nicht
                }
                
                // Wenn aktiviert wird, deaktiviere alle anderen
                if ($isActive) {
                    $stmt = $pdo->prepare("UPDATE payment_providers SET is_active = 0 WHERE code != ?");
                    $stmt->execute([$code]);
                }
                
                // Aktiviere/Deaktiviere diesen Provider
                $updateSql = $hasUpdatedAt 
                    ? "UPDATE payment_providers SET is_active = ?, updated_at = NOW() WHERE code = ?"
                    : "UPDATE payment_providers SET is_active = ? WHERE code = ?";
                $stmt = $pdo->prepare($updateSql);
                $stmt->execute([$isActive, $code]);
                
                // Prüfe ob is_test_mode Spalte existiert
                $hasTestMode = false;
                try {
                    $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_providers LIKE 'is_test_mode'");
                    $hasTestMode = $checkStmt->fetch() !== false;
                } catch (Exception $e) {
                    // Spalte existiert nicht
                }
                
                $selectFields = $hasTestMode 
                    ? "id, code, name, is_active, is_test_mode, config, created_at, updated_at"
                    : "id, code, name, is_active, config, created_at";
                
                // Hole aktualisierten Provider
                $stmt = $pdo->prepare("SELECT $selectFields FROM payment_providers WHERE code = ?");
                $stmt->execute([$code]);
                $provider = $stmt->fetch();
                
                if ($provider) {
                    // Konvertiere JSON-String zu Array
                    if (isset($provider['config']) && is_string($provider['config'])) {
                        $provider['config'] = json_decode($provider['config'], true) ?: [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $provider['is_active'] = (bool)$provider['is_active'];
                    $provider['is_test_mode'] = $hasTestMode ? (bool)($provider['is_test_mode'] ?? false) : true;
                    if (!isset($provider['updated_at'])) {
                        $provider['updated_at'] = $provider['created_at'] ?? date('Y-m-d H:i:s');
                    }
                    
                    echo json_encode(['success' => true, 'data' => $provider]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Payment Provider nicht gefunden']);
                }
                exit;
            } elseif ($action === 'upsert-webhook') {
                // Upsert Webhook
                $providerId = $data['provider_id'] ?? '';
                $webhookSecret = $data['webhook_secret'] ?? null;
                $webhookUrl = $data['webhook_url'] ?? null;
                $events = isset($data['events']) ? json_encode($data['events']) : '[]';
                $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 0;
                
                if (empty($providerId)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'provider_id erforderlich']);
                    exit;
                }
                
                // Prüfe ob Webhook existiert
                $stmt = $pdo->prepare("SELECT id FROM payment_provider_webhooks WHERE provider_id = ?");
                $stmt->execute([$providerId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    // Update
                    $updateFields = [];
                    $updateValues = [];
                    
                    if (isset($data['webhook_secret'])) {
                        $updateFields[] = "webhook_secret = ?";
                        $updateValues[] = $webhookSecret;
                    }
                    if (isset($data['webhook_url'])) {
                        $updateFields[] = "webhook_url = ?";
                        $updateValues[] = $webhookUrl;
                    }
                    if (isset($data['events'])) {
                        $updateFields[] = "events = ?";
                        $updateValues[] = $events;
                    }
                    if (isset($data['is_active'])) {
                        $updateFields[] = "is_active = ?";
                        $updateValues[] = $isActive;
                    }
                    
                    // Prüfe ob updated_at Spalte existiert
                    $hasUpdatedAt = false;
                    try {
                        $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_provider_webhooks LIKE 'updated_at'");
                        $hasUpdatedAt = $checkStmt->fetch() !== false;
                    } catch (Exception $e) {
                        // Spalte existiert nicht
                    }
                    
                    if ($hasUpdatedAt) {
                        $updateFields[] = "updated_at = NOW()";
                    }
                    $updateValues[] = $existing['id'];
                    
                    $sql = "UPDATE payment_provider_webhooks SET " . implode(', ', $updateFields) . " WHERE id = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($updateValues);
                    $webhookId = $existing['id'];
                } else {
                    // Insert
                    $webhookId = bin2hex(random_bytes(16));
                    $webhookId = substr($webhookId, 0, 8) . '-' . substr($webhookId, 8, 4) . '-' . substr($webhookId, 12, 4) . '-' . substr($webhookId, 16, 4) . '-' . substr($webhookId, 20, 12);
                    
                    // Prüfe ob updated_at Spalte existiert
                    $hasUpdatedAt = false;
                    try {
                        $checkStmt = $pdo->query("SHOW COLUMNS FROM payment_provider_webhooks LIKE 'updated_at'");
                        $hasUpdatedAt = $checkStmt->fetch() !== false;
                    } catch (Exception $e) {
                        // Spalte existiert nicht
                    }
                    
                    $insertFields = ["id", "provider_id", "webhook_secret", "webhook_url", "events", "is_active", "created_at"];
                    $insertValues = [$webhookId, $providerId, $webhookSecret, $webhookUrl, $events, $isActive];
                    $placeholders = ["?", "?", "?", "?", "?", "?", "NOW()"];
                    
                    if ($hasUpdatedAt) {
                        $insertFields[] = "updated_at";
                        $placeholders[] = "NOW()";
                    }
                    
                    $sql = "INSERT INTO payment_provider_webhooks (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $placeholders) . ")";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($insertValues);
                }
                
                // Hole aktualisierten Webhook
                $stmt = $pdo->prepare("SELECT * FROM payment_provider_webhooks WHERE id = ?");
                $stmt->execute([$webhookId]);
                $webhook = $stmt->fetch();
                
                if ($webhook) {
                    // Konvertiere JSON-String zu Array
                    if (isset($webhook['events']) && is_string($webhook['events'])) {
                        $webhook['events'] = json_decode($webhook['events'], true) ?: [];
                    }
                    // Konvertiere TINYINT zu boolean
                    $webhook['is_active'] = (bool)$webhook['is_active'];
                    
                    echo json_encode(['success' => true, 'data' => $webhook]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Fehler beim Laden des aktualisierten Webhooks']);
                }
                exit;
            }
            break;
            
        case 'DELETE':
            if ($action === 'webhook') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'id erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM payment_provider_webhooks WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true, 'message' => 'Webhook gelöscht']);
                exit;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Methode nicht erlaubt']);
            exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Payment Providers API PDO-Fehler: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage(), 'code' => 'DATABASE_ERROR']);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    error_log("Payment Providers API Fehler: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Server-Fehler: ' . $e->getMessage(), 'code' => 'SERVER_ERROR']);
    exit;
}

// Fallback
if (!headers_sent()) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode(['error' => 'Unbekannter Fehler - keine Antwort von API']);
}

?>

