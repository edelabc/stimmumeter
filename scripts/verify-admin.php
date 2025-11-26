<?php
/**
 * Verifiziert Admin-Status eines Benutzers
 */

require_once __DIR__ . '/../config.local.php';

$email = $argv[1] ?? $_GET['email'] ?? 'admin@test.com';

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Hole Benutzer
    $stmt = $pdo->prepare("SELECT id, email FROM users_profile WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "❌ Benutzer '$email' nicht gefunden.\n";
        exit(1);
    }
    
    echo "✅ Benutzer gefunden:\n";
    echo "   ID: {$user['id']}\n";
    echo "   E-Mail: {$user['email']}\n\n";
    
    // Prüfe Admin-Status
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "✅ Admin-Status:\n";
        echo "   User-ID: {$admin['user_id']}\n";
        echo "   Rolle: " . ($admin['role'] ?? 'admin') . "\n";
        echo "   Aktiv: " . ($admin['is_active'] == 1 ? 'Ja' : 'Nein') . "\n";
        echo "   Erstellt: " . ($admin['created_at'] ?? 'N/A') . "\n";
    } else {
        echo "❌ Benutzer ist NICHT als Admin eingetragen.\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}



