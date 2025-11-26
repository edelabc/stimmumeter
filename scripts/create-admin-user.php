<?php
/**
 * Skript zum Erstellen eines Admin-Benutzers
 * 
 * Verwendung:
 * php scripts/create-admin-user.php admin@test.com
 * 
 * Oder direkt im Browser aufrufen:
 * http://localhost/stimmumeter/scripts/create-admin-user.php?email=admin@test.com
 */

// Load configuration
require_once __DIR__ . '/../config.local.php';

// Prüfe ob E-Mail über Parameter übergeben wurde
$email = $argv[1] ?? $_GET['email'] ?? 'admin@test.com';

if (empty($email)) {
    die("❌ Fehler: Bitte geben Sie eine E-Mail-Adresse an.\n");
}

try {
    // Datenbankverbindung herstellen
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "✅ Datenbankverbindung erfolgreich hergestellt.\n\n";
    
    // Prüfe ob Benutzer existiert
    $stmt = $pdo->prepare("SELECT id, email FROM users_profile WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "⚠️  Benutzer mit E-Mail '$email' existiert nicht.\n";
        echo "📝 Erstelle neuen Benutzer...\n";
        
        // Erstelle Benutzer-ID (UUID-ähnlich)
        $userId = bin2hex(random_bytes(16));
        $userId = substr($userId, 0, 8) . '-' . substr($userId, 8, 4) . '-' . substr($userId, 12, 4) . '-' . substr($userId, 16, 4) . '-' . substr($userId, 20, 12);
        
        // Standard-Passwort: "admin123" (sollte nach dem ersten Login geändert werden)
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        
        // Erstelle Benutzer-Profil
        $stmt = $pdo->prepare("INSERT INTO users_profile (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$userId, $email, $passwordHash]);
        
        echo "✅ Benutzer '$email' wurde erstellt.\n";
        echo "🔑 Standard-Passwort: admin123 (bitte nach dem ersten Login ändern!)\n\n";
    } else {
        $userId = $user['id'];
        echo "✅ Benutzer '$email' gefunden (ID: $userId).\n\n";
    }
    
    // Prüfe ob Benutzer bereits Admin ist
    $stmt = $pdo->prepare("SELECT user_id, role, is_active FROM admin_users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $admin = $stmt->fetch();
    
    if ($admin) {
        if ($admin['is_active'] == 1) {
            echo "ℹ️  Benutzer '$email' ist bereits als Admin aktiv.\n";
            echo "   Rolle: " . ($admin['role'] ?? 'admin') . "\n";
        } else {
            echo "⚠️  Benutzer '$email' ist als Admin vorhanden, aber inaktiv.\n";
            echo "📝 Aktiviere Admin-Status...\n";
            
            $stmt = $pdo->prepare("UPDATE admin_users SET is_active = 1, role = 'admin' WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            echo "✅ Admin-Status wurde aktiviert.\n";
        }
    } else {
        echo "📝 Füge Benutzer '$email' als Admin hinzu...\n";
        
        // Prüfe ob Tabelle existiert
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'admin_users'")->fetch();
        if (!$tableCheck) {
            echo "⚠️  Tabelle 'admin_users' existiert nicht. Erstelle sie...\n";
            
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `admin_users` (
                    `user_id` CHAR(36) PRIMARY KEY,
                    `role` VARCHAR(50) DEFAULT 'admin',
                    `is_active` TINYINT(1) DEFAULT 1,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            
            echo "✅ Tabelle 'admin_users' wurde erstellt.\n";
        }
        
        // Füge Benutzer als Admin hinzu
        $stmt = $pdo->prepare("INSERT INTO admin_users (user_id, role, is_active, created_at) VALUES (?, 'admin', 1, NOW()) ON DUPLICATE KEY UPDATE is_active = 1, role = 'admin'");
        $stmt->execute([$userId]);
        
        echo "✅ Benutzer '$email' wurde erfolgreich als Admin hinzugefügt.\n";
    }
    
    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "✅ Erfolgreich abgeschlossen!\n\n";
    echo "📧 E-Mail: $email\n";
    echo "🆔 User-ID: $userId\n";
    echo "👤 Rolle: Admin\n";
    echo "🔑 Passwort: " . (isset($passwordHash) ? "admin123 (neu erstellt)" : "(bestehend)") . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
} catch (PDOException $e) {
    echo "❌ Datenbankfehler: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}



