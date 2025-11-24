<?php
/**
 * Agreements API
 * CRUD-Operationen für Vereinbarungen
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

/**
 * Generiert einen URL-freundlichen Slug aus einem Titel
 */
function generateSlugFromTitle($title, $agreementId, $pdo) {
    try {
        // Konvertiere zu Kleinbuchstaben
        $slug = mb_strtolower(trim($title), 'UTF-8');
        
        // Ersetze Umlaute
        $slug = str_replace(['ä', 'ö', 'ü', 'ß'], ['ae', 'oe', 'ue', 'ss'], $slug);
        
        // Ersetze alle nicht-alphanumerischen Zeichen durch Bindestriche
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        
        // Entferne führende und abschließende Bindestriche
        $slug = trim($slug, '-');
        
        // Falls leer, verwende Fallback
        if (empty($slug)) {
            $slug = 'vereinbarung-' . substr($agreementId, 0, 8);
        }
        
        // Prüfe auf Eindeutigkeit und füge Zähler hinzu falls nötig
        $baseSlug = $slug;
        $counter = 0;
        
        do {
            $checkSlug = $counter > 0 ? $baseSlug . '-' . $counter : $baseSlug;
            $stmt = $pdo->prepare("SELECT id FROM t_vereinbarungen WHERE slug = ? AND id != ?");
            $stmt->execute([$checkSlug, $agreementId]);
            $exists = $stmt->fetch();
            
            if (!$exists) {
                return $checkSlug;
            }
            
            $counter++;
        } while ($counter < 100); // Sicherheitslimit
        
        // Fallback: Verwende ID-basierten Slug
        return $baseSlug . '-' . substr($agreementId, 0, 8);
    } catch (Exception $e) {
        // Fallback bei Fehler
        error_log("Fehler bei Slug-Generierung: " . $e->getMessage());
        return 'vereinbarung-' . substr($agreementId, 0, 8);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $user = getCurrentUserFromAuth($pdo);
    
    switch ($method) {
        case 'GET':
            if ($action === 'list' || $action === '') {
                // Liste aller Vereinbarungen
                if ($user && isAdmin($pdo, $user['id'])) {
                    // Admin sieht alle
                    $stmt = $pdo->prepare("
                        SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                        FROM t_vereinbarungen v
                        LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                        ORDER BY v.created_at DESC
                    ");
                    $stmt->execute();
                } else {
                    // Normale Benutzer sehen nur öffentliche/ihre eigenen
                    if ($user) {
                        $stmt = $pdo->prepare("
                            SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                            FROM t_vereinbarungen v
                            LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                            WHERE v.empfaenger_user_id IS NULL OR v.empfaenger_user_id = ? OR v.ersteller_user_id = ?
                            ORDER BY v.created_at DESC
                        ");
                        $stmt->execute([$user['id'], $user['id']]);
                    } else {
                        // Öffentliche Vereinbarungen
                        $stmt = $pdo->prepare("
                            SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                            FROM t_vereinbarungen v
                            LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                            WHERE v.empfaenger_user_id IS NULL
                            ORDER BY v.created_at DESC
                        ");
                        $stmt->execute();
                    }
                }
                
                $agreements = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $agreements]);
                exit;
                
            } elseif ($action === 'get') {
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                    FROM t_vereinbarungen v
                    LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                    WHERE v.id = ?
                ");
                $stmt->execute([$id]);
                $agreement = $stmt->fetch();
                
                if ($agreement) {
                    // Prüfe Zugriffsrechte
                    // Öffentliche Vereinbarungen (empfaenger_user_id === null) sind für alle zugänglich
                    $isPublic = $agreement['empfaenger_user_id'] === null;
                    $isAuthorized = false;
                    
                    if ($isPublic) {
                        // Öffentliche Vereinbarung - immer erlauben
                        $isAuthorized = true;
                    } else if ($user) {
                        // Private Vereinbarung - prüfe Rechte
                        $isAuthorized = isAdmin($pdo, $user['id']) || 
                                      $agreement['ersteller_user_id'] === $user['id'] || 
                                      $agreement['empfaenger_user_id'] === $user['id'];
                    }
                    
                    if ($isAuthorized) {
                        echo json_encode(['success' => true, 'data' => $agreement]);
                    } else {
                        http_response_code(403);
                        echo json_encode(['error' => 'Zugriff verweigert']);
                    }
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                }
            } elseif ($action === 'getBySlug') {
                $slug = $_GET['slug'] ?? '';
                if (empty($slug)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Slug erforderlich']);
                    exit;
                }
                
                // First try to find directly in agreements table
                $stmt = $pdo->prepare("
                    SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                    FROM t_vereinbarungen v
                    LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                    WHERE v.slug = ?
                ");
                $stmt->execute([$slug]);
                $agreement = $stmt->fetch();
                
                if ($agreement) {
                    // Prüfe Zugriffsrechte
                    // Öffentliche Vereinbarungen (empfaenger_user_id === null) sind für alle zugänglich
                    $isPublic = $agreement['empfaenger_user_id'] === null;
                    $isAuthorized = false;
                    
                    if ($isPublic) {
                        // Öffentliche Vereinbarung - immer erlauben
                        $isAuthorized = true;
                    } else if ($user) {
                        // Private Vereinbarung - prüfe Rechte
                        $isAuthorized = isAdmin($pdo, $user['id']) || 
                                      $agreement['ersteller_user_id'] === $user['id'] || 
                                      $agreement['empfaenger_user_id'] === $user['id'];
                    }
                    
                    if ($isAuthorized) {
                        echo json_encode(['success' => true, 'data' => $agreement]);
                    } else {
                        http_response_code(403);
                        echo json_encode(['error' => 'Zugriff verweigert']);
                    }
                    exit;
                }
                
                // Fallback: Try to find in menu_items
                $stmt = $pdo->prepare("
                    SELECT linked_agreement_id FROM menu_items 
                    WHERE slug = ? AND is_active = 1
                ");
                $stmt->execute([$slug]);
                $menuItem = $stmt->fetch();
                
                if ($menuItem && $menuItem['linked_agreement_id']) {
                    $stmt = $pdo->prepare("
                        SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                        FROM t_vereinbarungen v
                        LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                        WHERE v.id = ?
                    ");
                    $stmt->execute([$menuItem['linked_agreement_id']]);
                    $agreement = $stmt->fetch();
                    
                    if ($agreement) {
                        // Vereinbarungen aus menu_items sind öffentlich zugänglich
                        echo json_encode(['success' => true, 'data' => $agreement]);
                        exit;
                    }
                }
                
                // Fallback: Try to find in footer_menu_items
                $stmt = $pdo->prepare("
                    SELECT linked_agreement_id FROM footer_menu_items 
                    WHERE slug = ? AND is_active = 1
                ");
                $stmt->execute([$slug]);
                $footerMenuItem = $stmt->fetch();
                
                if ($footerMenuItem && $footerMenuItem['linked_agreement_id']) {
                    $stmt = $pdo->prepare("
                        SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                        FROM t_vereinbarungen v
                        LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                        WHERE v.id = ?
                    ");
                    $stmt->execute([$footerMenuItem['linked_agreement_id']]);
                    $agreement = $stmt->fetch();
                    
                    if ($agreement) {
                        // Vereinbarungen aus footer_menu_items sind öffentlich zugänglich
                        echo json_encode(['success' => true, 'data' => $agreement]);
                        exit;
                    }
                }
                
                http_response_code(404);
                echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
            } elseif ($action === 'titles') {
                // Liste aller Vereinbarungstitel
                $stmt = $pdo->prepare("SELECT * FROM t_vereinbarungstitel ORDER BY titel ASC");
                $stmt->execute();
                $titles = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $titles]);
                exit;
            } elseif ($action === 'versionHistory') {
                // Versionshistorie für eine Vereinbarung
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                // Hole aktuelle Vereinbarung
                $stmt = $pdo->prepare("SELECT parent_vereinbarung_id, id FROM t_vereinbarungen WHERE id = ?");
                $stmt->execute([$id]);
                $current = $stmt->fetch();
                
                if (!$current) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                    exit;
                }
                
                // Bestimme Root-ID
                $rootId = $current['parent_vereinbarung_id'] ?: $current['id'];
                
                // Hole alle Versionen
                $stmt = $pdo->prepare("
                    SELECT id, version, status, created_at 
                    FROM t_vereinbarungen 
                    WHERE parent_vereinbarung_id = ? OR id = ?
                    ORDER BY version DESC
                ");
                $stmt->execute([$rootId, $rootId]);
                $versions = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $versions]);
                exit;
            } elseif ($action === 'logs') {
                // Logs für eine Vereinbarung
                $id = $_GET['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                // Prüfe Zugriffsrechte
                $stmt = $pdo->prepare("SELECT ersteller_user_id, empfaenger_user_id FROM t_vereinbarungen WHERE id = ?");
                $stmt->execute([$id]);
                $agreement = $stmt->fetch();
                
                if (!$agreement) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                    exit;
                }
                
                $isAuthorized = false;
                if ($user) {
                    $isAuthorized = isAdmin($pdo, $user['id']) || 
                                  $agreement['ersteller_user_id'] === $user['id'] || 
                                  $agreement['empfaenger_user_id'] === $user['id'];
                }
                
                if (!$isAuthorized) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Zugriff verweigert']);
                    exit;
                }
                
                // Hole Logs
                $stmt = $pdo->prepare("
                    SELECT l.*, u.email 
                    FROM t_vereinbarungs_logs l
                    LEFT JOIN users u ON l.user_id = u.id
                    WHERE l.vereinbarung_id = ?
                    ORDER BY l.created_at DESC
                ");
                $stmt->execute([$id]);
                $logs = $stmt->fetchAll();
                
                // Formatiere Logs
                $formattedLogs = array_map(function($log) {
                    return [
                        'id' => $log['id'],
                        'vereinbarung_id' => $log['vereinbarung_id'],
                        'user_id' => $log['user_id'],
                        'aktion' => $log['aktion'],
                        'details' => json_decode($log['details'] ?? '{}', true),
                        'created_at' => $log['created_at'],
                        'user' => $log['email'] ? [
                            'id' => $log['user_id'],
                            'email' => $log['email'],
                            'raw_user_meta_data' => []
                        ] : null
                    ];
                }, $logs);
                
                echo json_encode(['success' => true, 'data' => $formattedLogs]);
                exit;
            } elseif ($action === 'placeholderDefinitions') {
                // Alle Platzhalter-Definitionen
                $stmt = $pdo->prepare("SELECT * FROM t_platzhalter_definitionen ORDER BY platzhalter_schluessel ASC");
                $stmt->execute();
                $definitions = $stmt->fetchAll();
                
                // Formatiere zulaessige_rollen als Array
                $formattedDefinitions = array_map(function($def) {
                    $roles = $def['zulaessige_rollen'] ? json_decode($def['zulaessige_rollen'], true) : [];
                    return [
                        'id' => $def['id'],
                        'platzhalter_schluessel' => $def['platzhalter_schluessel'],
                        'beschreibung' => $def['beschreibung'],
                        'quell_tabelle' => $def['quell_tabelle'],
                        'quell_spalte' => $def['quell_spalte'],
                        'zulaessige_rollen' => is_array($roles) ? $roles : [],
                        'created_at' => $def['created_at'],
                        'updated_at' => $def['updated_at']
                    ];
                }, $definitions);
                
                echo json_encode(['success' => true, 'data' => $formattedDefinitions]);
                exit;
            }
            break;
            
        case 'POST':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Prüfe ob JSON-Daten korrekt dekodiert wurden
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültige JSON-Daten: ' . json_last_error_msg()]);
                exit;
            }
            
            // Prüfe ob es ein Update-Request ist (POST mit id-Parameter)
            $id = $data['id'] ?? $_GET['id'] ?? '';
            if (!empty($id) && (isset($data['status']) || isset($data['inhalt']))) {
                // Handle as UPDATE (POST wird auch für Updates verwendet)
                // Hole aktuellen Status und Slug
                $stmt = $pdo->prepare("SELECT status, slug, titel_id, ersteller_user_id FROM t_vereinbarungen WHERE id = ?");
                $stmt->execute([$id]);
                $currentAgreement = $stmt->fetch();
                
                if (!$currentAgreement) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                    exit;
                }
                
                // Prüfe Zugriffsrechte
                if ($currentAgreement['ersteller_user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Zugriff verweigert']);
                    exit;
                }
                
                $newStatus = $data['status'] ?? $currentAgreement['status'];
                $currentSlug = $currentAgreement['slug'];
                
                // Wenn Status auf "Unterzeichnet" gesetzt wird und kein Slug vorhanden ist, generiere einen
                $shouldGenerateSlug = false;
                $generatedSlug = null;
                if ($newStatus === 'Unterzeichnet' && (empty($currentSlug) || $currentSlug === null)) {
                    // Hole Titel für Slug-Generierung
                    $stmt = $pdo->prepare("SELECT titel FROM t_vereinbarungstitel WHERE id = ?");
                    $stmt->execute([$currentAgreement['titel_id']]);
                    $titleData = $stmt->fetch();
                    
                    if ($titleData && !empty($titleData['titel'])) {
                        $generatedSlug = generateSlugFromTitle($titleData['titel'], $id, $pdo);
                        $shouldGenerateSlug = true;
                    }
                }
                
                $updateFields = [];
                $updateValues = [];
                
                $allowedFields = ['inhalt', 'status', 'empfaenger_user_id', 'slug', 'unterzeichnet_am',
                    'bearbeiter_von', 'bearbeiter_an', 'kurze_zusammenfassung', 'anlagen',
                    'unterzeichnungsdatum_ersteller', 'unterzeichnungsdatum_empfaenger',
                    'gueltigkeit_von', 'gueltigkeit_bis', 'kuendigungsfrist_wert', 'kuendigungsfrist_einheit'];
                
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $data[$field];
                    }
                }
                
                // Füge generierten Slug hinzu, falls nötig
                if ($shouldGenerateSlug && !isset($data['slug'])) {
                    $updateFields[] = "slug = ?";
                    $updateValues[] = $generatedSlug;
                }
                
                if (empty($updateFields)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Keine Felder zum Aktualisieren']);
                    exit;
                }
                
                $updateFields[] = "updated_at = NOW()";
                $updateValues[] = $id;
                
                try {
                    $sql = "UPDATE t_vereinbarungen SET " . implode(', ', $updateFields) . " WHERE id = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($updateValues);
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Fehler beim Aktualisieren: ' . $e->getMessage()]);
                    exit;
                }
                
                // Hole aktualisierte Vereinbarung mit Titel-Informationen
                $stmt = $pdo->prepare("
                    SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                    FROM t_vereinbarungen v
                    LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                    WHERE v.id = ?
                ");
                $stmt->execute([$id]);
                $agreement = $stmt->fetch();
                
                if (!$agreement) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Fehler beim Laden der aktualisierten Vereinbarung']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'data' => $agreement]);
                exit;
            }
            
            if ($action === 'createTitle') {
                // Neuen Vereinbarungstitel erstellen
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Titel erstellen']);
                    exit;
                }
                
                $titel = trim($data['titel'] ?? '');
                $beschreibung = $data['beschreibung'] ?? null;
                
                if (empty($titel)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Titel ist erforderlich']);
                    exit;
                }
                
                // Prüfe ob Titel bereits existiert (case-insensitive)
                $stmt = $pdo->prepare("SELECT id FROM t_vereinbarungstitel WHERE LOWER(TRIM(titel)) = LOWER(TRIM(?))");
                $stmt->execute([$titel]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Ein Dokumententitel mit diesem Namen existiert bereits']);
                    exit;
                }
                
                $id = bin2hex(random_bytes(16));
                $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
                
                try {
                    $stmt = $pdo->prepare("INSERT INTO t_vereinbarungstitel (id, titel, beschreibung, erstellt_von_user_id, gesperrt, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NOW(), NOW())");
                    $stmt->execute([$id, $titel, $beschreibung, $user['id']]);
                } catch (PDOException $e) {
                    // Prüfe ob Fehler durch Duplikat verursacht wurde
                    if (strpos($e->getMessage(), 'Duplicate entry') !== false || strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Ein Dokumententitel mit diesem Namen existiert bereits']);
                        exit;
                    }
                    throw $e;
                }
                
                $stmt = $pdo->prepare("SELECT * FROM t_vereinbarungstitel WHERE id = ?");
                $stmt->execute([$id]);
                $title = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $title]);
                exit;
            } elseif ($action === 'updateTitle') {
                // Vereinbarungstitel aktualisieren
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Titel aktualisieren']);
                    exit;
                }
                
                $id = $data['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID ist erforderlich']);
                    exit;
                }
                
                $updates = [];
                $params = [];
                
                if (isset($data['titel'])) {
                    $updates[] = "titel = ?";
                    $params[] = $data['titel'];
                }
                if (isset($data['beschreibung'])) {
                    $updates[] = "beschreibung = ?";
                    $params[] = $data['beschreibung'];
                }
                if (isset($data['gesperrt'])) {
                    $updates[] = "gesperrt = ?";
                    $params[] = $data['gesperrt'] ? 1 : 0;
                }
                
                if (empty($updates)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Keine Änderungen angegeben']);
                    exit;
                }
                
                $updates[] = "updated_at = NOW()";
                $params[] = $id;
                
                $sql = "UPDATE t_vereinbarungstitel SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                $stmt = $pdo->prepare("SELECT * FROM t_vereinbarungstitel WHERE id = ?");
                $stmt->execute([$id]);
                $title = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $title]);
                exit;
            } elseif ($action === 'deleteTitle') {
                // Vereinbarungstitel löschen
                if (!isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Nur Administratoren können Titel löschen']);
                    exit;
                }
                
                $id = $data['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID ist erforderlich']);
                    exit;
                }
                
                // Prüfe ob Titel verwendet wird
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM t_vereinbarungen WHERE titel_id = ?");
                $stmt->execute([$id]);
                $result = $stmt->fetch();
                
                if ($result['count'] > 0) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Dieser Titel kann nicht gelöscht werden, da er bereits in Vereinbarungen verwendet wird']);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM t_vereinbarungstitel WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true]);
                exit;
            } elseif ($action === 'create') {
                $titelId = $data['titel_id'] ?? '';
                $inhalt = $data['inhalt'] ?? '';
                
                if (empty($titelId) || empty($inhalt)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'titel_id und inhalt sind erforderlich']);
                    exit;
                }
                
                $id = bin2hex(random_bytes(16));
                $id = substr($id, 0, 8) . '-' . substr($id, 8, 4) . '-' . substr($id, 12, 4) . '-' . substr($id, 16, 4) . '-' . substr($id, 20, 12);
                
                $status = $data['status'] ?? 'Entwurf';
                $version = $data['version'] ?? 1;
                $empfaengerUserId = $data['empfaenger_user_id'] ?? null;
                $slug = $data['slug'] ?? null;
                
                // Wenn Status "Unterzeichnet" und kein Slug angegeben, generiere einen
                if ($status === 'Unterzeichnet' && (empty($slug) || $slug === null)) {
                    // Hole Titel für Slug-Generierung
                    $stmt = $pdo->prepare("SELECT titel FROM t_vereinbarungstitel WHERE id = ?");
                    $stmt->execute([$titelId]);
                    $titleData = $stmt->fetch();
                    
                    if ($titleData && !empty($titleData['titel'])) {
                        $slug = generateSlugFromTitle($titleData['titel'], $id, $pdo);
                    }
                }
                
                $stmt = $pdo->prepare("INSERT INTO t_vereinbarungen (
                    id, titel_id, inhalt, ersteller_user_id, empfaenger_user_id, status, version, slug, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                
                $stmt->execute([
                    $id, $titelId, $inhalt, $user['id'], $empfaengerUserId, $status, $version, $slug
                ]);
                
                // Hole erstellte Vereinbarung mit Titel-Informationen
                $stmt = $pdo->prepare("
                    SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                    FROM t_vereinbarungen v
                    LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                    WHERE v.id = ?
                ");
                $stmt->execute([$id]);
                $agreement = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $agreement]);
                exit;
            } elseif ($action === 'createVersion') {
                // Neue Version einer Vereinbarung erstellen
                $id = $data['id'] ?? '';
                if (empty($id)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID erforderlich']);
                    exit;
                }
                
                // Hole ursprüngliche Vereinbarung
                $stmt = $pdo->prepare("SELECT * FROM t_vereinbarungen WHERE id = ?");
                $stmt->execute([$id]);
                $original = $stmt->fetch();
                
                if (!$original) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                    exit;
                }
                
                // Prüfe Zugriffsrechte
                if ($original['ersteller_user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Zugriff verweigert']);
                    exit;
                }
                
                // Bestimme Parent-ID
                $parentId = $original['parent_vereinbarung_id'] ?: $original['id'];
                
                // Hole maximale Version
                $stmt = $pdo->prepare("
                    SELECT MAX(version) as max_version 
                    FROM t_vereinbarungen 
                    WHERE parent_vereinbarung_id = ? OR id = ?
                ");
                $stmt->execute([$parentId, $parentId]);
                $versionData = $stmt->fetch();
                $maxVersion = $versionData['max_version'] ?: $original['version'];
                
                // Erstelle neue Version
                $newId = bin2hex(random_bytes(16));
                $newId = substr($newId, 0, 8) . '-' . substr($newId, 8, 4) . '-' . substr($newId, 12, 4) . '-' . substr($newId, 16, 4) . '-' . substr($newId, 20, 12);
                
                $newVersionData = [
                    'id' => $newId,
                    'titel_id' => $original['titel_id'],
                    'inhalt' => $data['inhalt'] ?? $original['inhalt'],
                    'ersteller_user_id' => $original['ersteller_user_id'],
                    'empfaenger_user_id' => $data['empfaenger_user_id'] ?? $original['empfaenger_user_id'],
                    'parent_vereinbarung_id' => $parentId,
                    'version' => $maxVersion + 1,
                    'status' => 'Entwurf',
                    'bearbeiter_von' => $data['bearbeiter_von'] ?? $original['bearbeiter_von'],
                    'bearbeiter_an' => $data['bearbeiter_an'] ?? $original['bearbeiter_an'],
                    'kurze_zusammenfassung' => $data['kurze_zusammenfassung'] ?? $original['kurze_zusammenfassung'],
                    'anlagen' => $data['anlagen'] ?? $original['anlagen'],
                    'gueltigkeit_von' => $data['gueltigkeit_von'] ?? $original['gueltigkeit_von'],
                    'gueltigkeit_bis' => $data['gueltigkeit_bis'] ?? $original['gueltigkeit_bis'],
                    'kuendigungsfrist_wert' => $data['kuendigungsfrist_wert'] ?? $original['kuendigungsfrist_wert'],
                    'kuendigungsfrist_einheit' => $data['kuendigungsfrist_einheit'] ?? $original['kuendigungsfrist_einheit'],
                ];
                
                $stmt = $pdo->prepare("
                    INSERT INTO t_vereinbarungen (
                        id, titel_id, inhalt, ersteller_user_id, empfaenger_user_id, 
                        parent_vereinbarung_id, version, status, bearbeiter_von, bearbeiter_an,
                        kurze_zusammenfassung, anlagen, gueltigkeit_von, gueltigkeit_bis,
                        kuendigungsfrist_wert, kuendigungsfrist_einheit, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $newVersionData['id'], $newVersionData['titel_id'], $newVersionData['inhalt'],
                    $newVersionData['ersteller_user_id'], $newVersionData['empfaenger_user_id'],
                    $newVersionData['parent_vereinbarung_id'], $newVersionData['version'],
                    $newVersionData['status'], $newVersionData['bearbeiter_von'], $newVersionData['bearbeiter_an'],
                    $newVersionData['kurze_zusammenfassung'], $newVersionData['anlagen'],
                    $newVersionData['gueltigkeit_von'], $newVersionData['gueltigkeit_bis'],
                    $newVersionData['kuendigungsfrist_wert'], $newVersionData['kuendigungsfrist_einheit']
                ]);
                
                // Archiviere alte Version
                $stmt = $pdo->prepare("UPDATE t_vereinbarungen SET status = 'Archiviert', updated_at = NOW() WHERE id = ?");
                $stmt->execute([$id]);
                
                // Log Version-Erstellung
                $logDetails = json_encode([
                    'neue_version' => $newVersionData['version'],
                    'archivierte_version' => $original['version'],
                    'original_id' => $id
                ]);
                $stmt = $pdo->prepare("
                    INSERT INTO t_vereinbarungs_logs (vereinbarung_id, user_id, aktion, details, created_at)
                    VALUES (?, ?, 'NEUE_VERSION_ERSTELLT', ?, NOW())
                ");
                $stmt->execute([$newId, $user['id'], $logDetails]);
                
                // Hole neue Vereinbarung mit Titel
                $stmt = $pdo->prepare("
                    SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                    FROM t_vereinbarungen v
                    LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                    WHERE v.id = ?
                ");
                $stmt->execute([$newId]);
                $newAgreement = $stmt->fetch();
                
                echo json_encode(['success' => true, 'data' => $newAgreement]);
                exit;
            } elseif ($action === 'logAction') {
                // Log-Aktion speichern
                $vereinbarungId = $data['vereinbarung_id'] ?? '';
                $aktion = $data['aktion'] ?? '';
                $details = $data['details'] ?? null;
                
                if (empty($vereinbarungId) || empty($aktion)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'vereinbarung_id und aktion sind erforderlich']);
                    exit;
                }
                
                // Prüfe Zugriffsrechte
                $stmt = $pdo->prepare("SELECT ersteller_user_id FROM t_vereinbarungen WHERE id = ?");
                $stmt->execute([$vereinbarungId]);
                $agreement = $stmt->fetch();
                
                if (!$agreement) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                    exit;
                }
                
                // Speichere Log
                $logDetails = $details ? json_encode($details) : null;
                $stmt = $pdo->prepare("
                    INSERT INTO t_vereinbarungs_logs (vereinbarung_id, user_id, aktion, details, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$vereinbarungId, $user['id'], $aktion, $logDetails]);
                
                echo json_encode(['success' => true]);
                exit;
            }
            break;
            
        case 'PUT':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe Zugriffsrechte
            $stmt = $pdo->prepare("SELECT ersteller_user_id FROM t_vereinbarungen WHERE id = ?");
            $stmt->execute([$id]);
            $agreement = $stmt->fetch();
            
            if (!$agreement) {
                http_response_code(404);
                echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                exit;
            }
            
            if ($agreement['ersteller_user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            // Hole aktuellen Status und Slug
            $stmt = $pdo->prepare("SELECT status, slug, titel_id FROM t_vereinbarungen WHERE id = ?");
            $stmt->execute([$id]);
            $currentAgreement = $stmt->fetch();
            
            $newStatus = $data['status'] ?? $currentAgreement['status'];
            $currentSlug = $currentAgreement['slug'];
            
            // Wenn Status auf "Unterzeichnet" gesetzt wird und kein Slug vorhanden ist, generiere einen
            $shouldGenerateSlug = false;
            if ($newStatus === 'Unterzeichnet' && (empty($currentSlug) || $currentSlug === null)) {
                // Hole Titel für Slug-Generierung
                $stmt = $pdo->prepare("SELECT titel FROM t_vereinbarungstitel WHERE id = ?");
                $stmt->execute([$currentAgreement['titel_id']]);
                $titleData = $stmt->fetch();
                
                if ($titleData && !empty($titleData['titel'])) {
                    $generatedSlug = generateSlugFromTitle($titleData['titel'], $id, $pdo);
                    $shouldGenerateSlug = true;
                }
            }
            
            $updateFields = [];
            $updateValues = [];
            
            $allowedFields = ['inhalt', 'status', 'empfaenger_user_id', 'slug', 'unterzeichnet_am',
                'bearbeiter_von', 'bearbeiter_an', 'kurze_zusammenfassung', 'anlagen',
                'unterzeichnungsdatum_ersteller', 'unterzeichnungsdatum_empfaenger',
                'gueltigkeit_von', 'gueltigkeit_bis', 'kuendigungsfrist_wert', 'kuendigungsfrist_einheit'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $data[$field];
                }
            }
            
            // Füge generierten Slug hinzu, falls nötig
            if ($shouldGenerateSlug && !isset($data['slug'])) {
                $updateFields[] = "slug = ?";
                $updateValues[] = $generatedSlug;
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'Keine Felder zum Aktualisieren']);
                exit;
            }
            
            $updateFields[] = "updated_at = NOW()";
            $updateValues[] = $id;
            
            $sql = "UPDATE t_vereinbarungen SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            // Hole aktualisierte Vereinbarung mit Titel-Informationen
            $stmt = $pdo->prepare("
                SELECT v.*, vt.titel as titel_name, vt.beschreibung as titel_beschreibung
                FROM t_vereinbarungen v
                LEFT JOIN t_vereinbarungstitel vt ON v.titel_id = vt.id
                WHERE v.id = ?
            ");
            $stmt->execute([$id]);
            $agreement = $stmt->fetch();
            
            echo json_encode(['success' => true, 'data' => $agreement]);
            exit;
            break;
            
        case 'DELETE':
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Nicht authentifiziert']);
                exit;
            }
            
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID erforderlich']);
                exit;
            }
            
            // Prüfe Zugriffsrechte
            $stmt = $pdo->prepare("SELECT ersteller_user_id FROM t_vereinbarungen WHERE id = ?");
            $stmt->execute([$id]);
            $agreement = $stmt->fetch();
            
            if (!$agreement) {
                http_response_code(404);
                echo json_encode(['error' => 'Vereinbarung nicht gefunden']);
                exit;
            }
            
            if ($agreement['ersteller_user_id'] !== $user['id'] && !isAdmin($pdo, $user['id'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Zugriff verweigert']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM t_vereinbarungen WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Vereinbarung gelöscht']);
            exit;
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Methode nicht erlaubt']);
            exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Agreements API PDO-Fehler: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage(), 'code' => 'DATABASE_ERROR']);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    error_log("Agreements API Fehler: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Server-Fehler: ' . $e->getMessage(), 'code' => 'SERVER_ERROR']);
    exit;
}

// Diese Zeile sollte nie erreicht werden, da alle Pfade mit exit beendet werden
// Falls doch, ist etwas schiefgelaufen
if (!headers_sent()) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode(['error' => 'Unbekannter Fehler - keine Antwort von API']);
}

?>

