<?php
/**
 * Automatisches Datenbank-Setup
 * 
 * Erstellt automatisch:
 * 1. Backup (falls Datenbank existiert)
 * 2. Fehlende Tabellen
 * 3. Schema-Anpassungen (neue/geänderte/gelöschte Felder)
 * 4. Standard-Daten
 * 
 * Wird automatisch von db.php aufgerufen, wenn Tabellen fehlen oder Schema-Änderungen erkannt werden
 */
class AutoSetup {
    private $pdo;
    private $backupDir;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->backupDir = __DIR__ . '/../backups';
        
        // Erstelle Backup-Verzeichnis
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }
    
    /**
     * Prüft ob Datenbank existiert und erstellt Backup
     */
    public function createBackupIfNeeded(): bool {
        try {
            // Prüfe ob Tabellen existieren
            $tables = $this->pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                // Keine Tabellen = keine Datenbank oder leere Datenbank
                return false;
            }
            
            // Backup erstellen
            $dbName = $this->getDatabaseName();
            $dbConfig = $this->getDatabaseConfig();
            $timestamp = date('Y-m-d_H-i-s');
            $backupFile = $this->backupDir . '/' . $dbName . '_auto_backup_' . $timestamp . '.sql';
            
            // MySQL Dump
            $mysqldumpPath = '/Applications/XAMPP/xamppfiles/bin/mysqldump';
            if (!file_exists($mysqldumpPath)) {
                $mysqldumpPath = 'mysqldump';
            }
            
            $command = sprintf(
                '%s -h%s -P%d -u%s %s %s > %s 2>&1',
                escapeshellarg($mysqldumpPath),
                escapeshellarg($dbConfig['host']),
                $dbConfig['port'],
                escapeshellarg($dbConfig['user']),
                !empty($dbConfig['pass']) ? '-p' . escapeshellarg($dbConfig['pass']) : '',
                escapeshellarg($dbName),
                escapeshellarg($backupFile)
            );
            
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
                error_log("✅ Auto-Backup erstellt: $backupFile");
                return true;
            }
            
            // Fallback: PDO-Backup
            return $this->createPDOBackup($backupFile, $tables);
            
        } catch (Exception $e) {
            error_log("⚠️ Backup-Fehler: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Erstellt Backup mit PDO (Fallback)
     */
    private function createPDOBackup($backupFile, $tables): bool {
        try {
            $dbName = $this->getDatabaseName();
            $backupContent = "-- Database Backup: " . $dbName . "\n";
            $backupContent .= "-- Created: " . date('Y-m-d H:i:s') . "\n";
            $backupContent .= "-- Auto-Backup before table creation\n\n";
            $backupContent .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
            
            foreach ($tables as $table) {
                // CREATE TABLE Statement
                $createTable = $this->pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
                $backupContent .= "-- Table: $table\n";
                $backupContent .= "DROP TABLE IF EXISTS `$table`;\n";
                $backupContent .= $createTable['Create Table'] . ";\n\n";
                
                // Daten exportieren
                $rows = $this->pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $backupContent .= "-- Data for table: $table\n";
                    foreach ($rows as $row) {
                        $columns = array_keys($row);
                        $values = array_map(function($val) {
                            return $this->pdo->quote($val);
                        }, array_values($row));
                        $backupContent .= "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                    }
                    $backupContent .= "\n";
                }
            }
            
            $backupContent .= "SET FOREIGN_KEY_CHECKS=1;\n";
            file_put_contents($backupFile, $backupContent);
            
            error_log("✅ PDO-Backup erstellt: $backupFile");
            return true;
            
        } catch (Exception $e) {
            error_log("❌ PDO-Backup-Fehler: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Prüft welche Tabellen fehlen und erstellt sie
     * Migriert auch bestehende Tabellen (Schema-Anpassungen)
     */
    public function createMissingTables(): array {
        $created = [];
        $errors = [];
        
        // Liste der benötigten Tabellen
        $requiredTables = $this->getRequiredTables();
        
        // Lade Schema-Migrator
        require_once __DIR__ . '/schema-migrator.php';
        $migrator = new SchemaMigrator($this->pdo);
        
        foreach ($requiredTables as $tableName => $createSQL) {
            try {
                // Prüfe ob Tabelle existiert
                $check = $this->pdo->query("SHOW TABLES LIKE '$tableName'")->fetch();
                
                if (!$check) {
                    // Tabelle fehlt - erstelle sie
                    $this->pdo->exec($createSQL);
                    $created[] = $tableName;
                    error_log("✅ Tabelle erstellt: $tableName");
                } else {
                    // Tabelle existiert - prüfe Schema-Änderungen
                    // Schema-Migration wird nach Tabellen-Erstellung durchgeführt
                }
            } catch (PDOException $e) {
                $errors[] = [
                    'table' => $tableName,
                    'error' => $e->getMessage()
                ];
                error_log("❌ Fehler beim Erstellen der Tabelle $tableName: " . $e->getMessage());
            }
        }
        
        // Führe Schema-Migrationen durch (für alle Tabellen)
        try {
            error_log("🔄 Prüfe Schema-Änderungen...");
            $migrationResults = $migrator->migrateAllTables();
            
            if (!empty($migrationResults['added'])) {
                error_log("✅ Neue Spalten hinzugefügt: " . implode(', ', $migrationResults['added']));
            }
            
            if (!empty($migrationResults['modified'])) {
                error_log("✅ Spalten geändert: " . implode(', ', $migrationResults['modified']));
            }
            
            if (!empty($migrationResults['dropped'])) {
                error_log("⚠️ Spalten gelöscht: " . implode(', ', $migrationResults['dropped']));
            }
            
            if (!empty($migrationResults['errors'])) {
                foreach ($migrationResults['errors'] as $error) {
                    error_log("❌ Migrations-Fehler: $error");
                }
            }
        } catch (Exception $e) {
            error_log("⚠️ Schema-Migration Fehler: " . $e->getMessage());
        }
        
        return [
            'created' => $created,
            'errors' => $errors,
            'migrations' => $migrationResults ?? []
        ];
    }
    
    /**
     * Gibt Liste der benötigten Tabellen zurück
     * Lädt Tabellen-Definitionen aus der SQL-Datei
     */
    private function getRequiredTables(): array {
        $tables = [];
        
        // Lade SQL-Datei
        $sqlFile = __DIR__ . '/../database/create-complete-database.sql';
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            
            // Extrahiere CREATE TABLE Statements
            preg_match_all('/CREATE TABLE IF NOT EXISTS `(\w+)`\s*\((.*?)\)\s*ENGINE=InnoDB/si', $sql, $matches, PREG_SET_ORDER);
            
            foreach ($matches as $match) {
                $tableName = $match[1];
                $tableDef = $match[2];
                $fullSQL = "CREATE TABLE IF NOT EXISTS `$tableName` ($tableDef) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                $tables[$tableName] = $fullSQL;
            }
        }
        
        // Fallback: Mindest-Tabellen falls SQL-Datei nicht geladen werden kann
        if (empty($tables)) {
            $tables = [
                'session_yra' => "CREATE TABLE IF NOT EXISTS `session_yra` (
                    `session_id` VARCHAR(255) PRIMARY KEY,
                    `yra_balance` INT DEFAULT 0 NOT NULL,
                    `assessments_count` INT DEFAULT 0 NOT NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `last_activity` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `user_id` CHAR(36) NULL,
                    `yra_transferred` TINYINT(1) DEFAULT 0,
                    INDEX `idx_session_yra_user_id` (`user_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                
                'mood_assessments' => "CREATE TABLE IF NOT EXISTS `mood_assessments` (
                    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                    `session_id` VARCHAR(255) NOT NULL,
                    `symbol_type` ENUM('woman', 'man', 'child', 'family', 'group') NOT NULL,
                    `latitude` DECIMAL(10,8) NOT NULL,
                    `longitude` DECIMAL(11,8) NOT NULL,
                    `mood` ENUM('positive', 'neutral', 'negative') NOT NULL,
                    `intensity` INT DEFAULT 1,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `ip_address` VARCHAR(45) NULL,
                    `user_agent` TEXT NULL,
                    `device_fingerprint` VARCHAR(255) NULL,
                    INDEX `idx_mood_assessments_session_id` (`session_id`),
                    INDEX `idx_mood_assessments_created_at` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                
                'yra_rewards_config' => "CREATE TABLE IF NOT EXISTS `yra_rewards_config` (
                    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                    `reward_type` VARCHAR(100) UNIQUE NOT NULL,
                    `min_amount` INT NOT NULL,
                    `max_amount` INT NOT NULL,
                    `is_active` TINYINT(1) DEFAULT 1,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                
                'bot_protection_logs' => "CREATE TABLE IF NOT EXISTS `bot_protection_logs` (
                    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                    `session_id` VARCHAR(255) NOT NULL,
                    `event_type` VARCHAR(100) NOT NULL,
                    `details` JSON NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_bot_protection_logs_session_id` (`session_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            ];
        }
        
        return $tables;
    }
    
    /**
     * Hole Datenbank-Name aus PDO
     */
    private function getDatabaseName(): string {
        try {
            $result = $this->pdo->query("SELECT DATABASE()")->fetchColumn();
            return $result ?: 'wameli';
        } catch (Exception $e) {
            return defined('DB_NAME') ? DB_NAME : 'wameli';
        }
    }
    
    /**
     * Hole Datenbank-Konfiguration
     */
    private function getDatabaseConfig(): array {
        // Versuche aus Constants zu lesen
        if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASS')) {
            return [
                'host' => DB_HOST,
                'port' => defined('DB_PORT') ? DB_PORT : 3306,
                'user' => DB_USER,
                'pass' => DB_PASS,
            ];
        }
        
        // Fallback: Standard-Werte
        return [
            'host' => '127.0.0.1',
            'port' => 3306,
            'user' => 'root',
            'pass' => '',
        ];
    }
    
    /**
     * Fügt Standard-Daten ein (falls nicht vorhanden)
     */
    public function insertDefaultData(): void {
        try {
            // YRA Rewards Config
            $check = $this->pdo->query("SELECT COUNT(*) FROM yra_rewards_config")->fetchColumn();
            if ($check == 0) {
                $this->pdo->exec("INSERT INTO `yra_rewards_config` (`reward_type`, `min_amount`, `max_amount`, `is_active`) VALUES
                    ('mood_assessment', 5, 15, 1),
                    ('streak_bonus_3', 10, 20, 1),
                    ('streak_bonus_7', 25, 50, 1),
                    ('streak_bonus_14', 50, 100, 1)
                    ON DUPLICATE KEY UPDATE `min_amount` = VALUES(`min_amount`)");
                error_log("✅ Standard YRA-Config eingefügt");
            }
        } catch (PDOException $e) {
            error_log("⚠️ Fehler beim Einfügen der Standard-Daten: " . $e->getMessage());
        }
    }
}

// Auto-Setup ausführen (nur wenn direkt aufgerufen)
if (php_sapi_name() === 'cli') {
    $setup = new AutoSetup($pdo);
    
    echo "🔧 Automatisches Datenbank-Setup\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Backup erstellen
    echo "💾 Erstelle Backup...\n";
    $backupCreated = $setup->createBackupIfNeeded();
    if ($backupCreated) {
        echo "✅ Backup erstellt\n\n";
    } else {
        echo "⚠️ Kein Backup erstellt (Datenbank leer oder nicht vorhanden)\n\n";
    }
    
    // Fehlende Tabellen erstellen
    echo "📦 Erstelle fehlende Tabellen...\n";
    $result = $setup->createMissingTables();
    
    if (!empty($result['created'])) {
        echo "✅ Erstellte Tabellen: " . implode(', ', $result['created']) . "\n";
    }
    
    if (!empty($result['errors'])) {
        echo "❌ Fehler:\n";
        foreach ($result['errors'] as $error) {
            echo "   - {$error['table']}: {$error['error']}\n";
        }
    }
    
    // Standard-Daten einfügen
    echo "\n📋 Füge Standard-Daten ein...\n";
    $setup->insertDefaultData();
    echo "✅ Standard-Daten eingefügt\n\n";
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "✅ Setup abgeschlossen!\n";
}

?>

