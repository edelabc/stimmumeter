<?php
/**
 * Schema-Migrator
 * 
 * Erkennt automatisch Schema-Änderungen und passt Tabellen an:
 * - Neue Felder hinzufügen
 * - Felder ändern (Typ, Constraints)
 * - Felder löschen (optional)
 * 
 * Wird automatisch von auto-setup.php aufgerufen
 */

class SchemaMigrator {
    private $pdo;
    private $backupDir;
    private $allowDropColumns = false; // Sicherheit: Standardmäßig keine Spalten löschen
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->backupDir = __DIR__ . '/../backups';
    }
    
    /**
     * Setzt ob Spalten gelöscht werden dürfen (Standard: false)
     */
    public function setAllowDropColumns($allow) {
        $this->allowDropColumns = $allow;
    }
    
    /**
     * Migriert alle Tabellen basierend auf SQL-Datei
     */
    public function migrateAllTables(): array {
        $results = [
            'added' => [],
            'modified' => [],
            'dropped' => [],
            'errors' => []
        ];
        
        // Lade SQL-Datei
        $sqlFile = __DIR__ . '/../database/create-complete-database.sql';
        if (!file_exists($sqlFile)) {
            $results['errors'][] = "SQL-Datei nicht gefunden: $sqlFile";
            return $results;
        }
        
        $sql = file_get_contents($sqlFile);
        
        // Extrahiere CREATE TABLE Statements
        preg_match_all('/CREATE TABLE IF NOT EXISTS `(\w+)`\s*\((.*?)\)\s*ENGINE=InnoDB/si', $sql, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            $tableName = $match[1];
            $desiredColumns = $this->parseTableDefinition($match[2]);
            
            // Prüfe ob Tabelle existiert
            $tableExists = $this->pdo->query("SHOW TABLES LIKE '$tableName'")->fetch();
            
            if (!$tableExists) {
                // Tabelle existiert nicht - wird von auto-setup.php erstellt
                continue;
            }
            
            // Hole aktuelle Struktur
            $currentColumns = $this->getCurrentTableStructure($tableName);
            
            // Vergleiche und migriere
            $migrationResult = $this->migrateTable($tableName, $currentColumns, $desiredColumns);
            
            $results['added'] = array_merge($results['added'], $migrationResult['added']);
            $results['modified'] = array_merge($results['modified'], $migrationResult['modified']);
            $results['dropped'] = array_merge($results['dropped'], $migrationResult['dropped']);
            $results['errors'] = array_merge($results['errors'], $migrationResult['errors']);
        }
        
        return $results;
    }
    
    /**
     * Migriert eine einzelne Tabelle
     */
    private function migrateTable($tableName, $currentColumns, $desiredColumns): array {
        $results = [
            'added' => [],
            'modified' => [],
            'dropped' => [],
            'errors' => []
        ];
        
        // Neue Spalten hinzufügen
        foreach ($desiredColumns as $columnName => $columnDef) {
            if (!isset($currentColumns[$columnName])) {
                // Neue Spalte hinzufügen
                try {
                    $alterSQL = "ALTER TABLE `$tableName` ADD COLUMN `$columnName` " . $columnDef['definition'];
                    
                    // Position bestimmen
                    if (isset($columnDef['after'])) {
                        $alterSQL .= " AFTER `{$columnDef['after']}`";
                    } elseif (isset($columnDef['first']) && $columnDef['first']) {
                        $alterSQL .= " FIRST";
                    }
                    
                    $this->pdo->exec($alterSQL);
                    $results['added'][] = "$tableName.$columnName";
                    error_log("✅ Spalte hinzugefügt: $tableName.$columnName");
                } catch (PDOException $e) {
                    $results['errors'][] = "$tableName.$columnName (ADD): " . $e->getMessage();
                }
            } else {
                // Spalte existiert - prüfe ob Änderung nötig
                $needsUpdate = $this->columnNeedsUpdate($currentColumns[$columnName], $columnDef);
                
                if ($needsUpdate) {
                    try {
                        $alterSQL = "ALTER TABLE `$tableName` MODIFY COLUMN `$columnName` " . $columnDef['definition'];
                        $this->pdo->exec($alterSQL);
                        $results['modified'][] = "$tableName.$columnName";
                        error_log("✅ Spalte geändert: $tableName.$columnName");
                    } catch (PDOException $e) {
                        $results['errors'][] = "$tableName.$columnName (MODIFY): " . $e->getMessage();
                    }
                }
            }
        }
        
        // Spalten löschen (nur wenn erlaubt)
        if ($this->allowDropColumns) {
            foreach ($currentColumns as $columnName => $columnDef) {
                if (!isset($desiredColumns[$columnName])) {
                    try {
                        $alterSQL = "ALTER TABLE `$tableName` DROP COLUMN `$columnName`";
                        $this->pdo->exec($alterSQL);
                        $results['dropped'][] = "$tableName.$columnName";
                        error_log("⚠️ Spalte gelöscht: $tableName.$columnName");
                    } catch (PDOException $e) {
                        $results['errors'][] = "$tableName.$columnName (DROP): " . $e->getMessage();
                    }
                }
            }
        }
        
        return $results;
    }
    
    /**
     * Parst Tabellen-Definition und extrahiert Spalten
     */
    private function parseTableDefinition($tableDef): array {
        $columns = [];
        $lines = explode("\n", $tableDef);
        $previousColumn = null;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Überspringe Kommentare und leere Zeilen
            if (empty($line) || strpos($line, '--') === 0) {
                continue;
            }
            
            // Entferne Kommas am Ende
            $line = rtrim($line, ',');
            
            // Prüfe ob es eine Spalten-Definition ist
            if (preg_match('/^`?(\w+)`?\s+(.+)$/i', $line, $matches)) {
                $columnName = trim($matches[1], '`');
                $columnDef = trim($matches[2]);
                
                // Entferne Constraints am Ende (PRIMARY KEY, INDEX, etc.)
                $columnDef = preg_replace('/\s+(PRIMARY\s+KEY|UNIQUE|INDEX|KEY|FOREIGN\s+KEY).*$/i', '', $columnDef);
                
                $columns[$columnName] = [
                    'definition' => $columnDef,
                    'after' => $previousColumn,
                    'first' => count($columns) === 0
                ];
                
                $previousColumn = $columnName;
            }
        }
        
        return $columns;
    }
    
    /**
     * Holt aktuelle Tabellen-Struktur
     */
    private function getCurrentTableStructure($tableName): array {
        $columns = [];
        
        $result = $this->pdo->query("SHOW COLUMNS FROM `$tableName`");
        $rows = $result->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rows as $row) {
            $columnName = $row['Field'];
            $columnType = $row['Type'];
            $isNull = $row['Null'] === 'YES' ? 'NULL' : 'NOT NULL';
            $default = $row['Default'] !== null ? "DEFAULT '{$row['Default']}'" : '';
            $extra = $row['Extra'];
            
            $definition = "$columnType $isNull";
            if ($default) {
                $definition .= " $default";
            }
            if ($extra) {
                $definition .= " $extra";
            }
            
            $columns[$columnName] = [
                'definition' => $definition,
                'type' => $columnType,
                'null' => $isNull,
                'default' => $row['Default'],
                'extra' => $extra
            ];
        }
        
        return $columns;
    }
    
    /**
     * Prüft ob Spalte aktualisiert werden muss
     */
    private function columnNeedsUpdate($current, $desired): bool {
        // Normalisiere Definitionen für Vergleich
        $currentDef = strtoupper(preg_replace('/\s+/', ' ', trim($current['definition'])));
        $desiredDef = strtoupper(preg_replace('/\s+/', ' ', trim($desired['definition'])));
        
        // Entferne DEFAULT-Werte für Vergleich (können unterschiedlich sein)
        $currentDef = preg_replace('/\s+DEFAULT\s+[\'"]?[^\'"]+[\'"]?/i', '', $currentDef);
        $desiredDef = preg_replace('/\s+DEFAULT\s+[\'"]?[^\'"]+[\'"]?/i', '', $desiredDef);
        
        // Entferne AUTO_INCREMENT für Vergleich
        $currentDef = preg_replace('/\s+AUTO_INCREMENT/i', '', $currentDef);
        $desiredDef = preg_replace('/\s+AUTO_INCREMENT/i', '', $desiredDef);
        
        return $currentDef !== $desiredDef;
    }
    
    /**
     * Erstellt Backup vor Schema-Änderungen
     */
    public function createBackupBeforeMigration($tableName): bool {
        try {
            $dbName = $this->getDatabaseName();
            $timestamp = date('Y-m-d_H-i-s');
            $backupFile = $this->backupDir . '/' . $dbName . '_schema_backup_' . $tableName . '_' . $timestamp . '.sql';
            
            // Erstelle Backup nur für diese Tabelle
            $mysqldumpPath = '/Applications/XAMPP/xamppfiles/bin/mysqldump';
            if (!file_exists($mysqldumpPath)) {
                $mysqldumpPath = 'mysqldump';
            }
            
            $dbConfig = $this->getDatabaseConfig();
            
            $command = sprintf(
                '%s -h%s -P%d -u%s %s %s %s > %s 2>&1',
                escapeshellarg($mysqldumpPath),
                escapeshellarg($dbConfig['host']),
                $dbConfig['port'],
                escapeshellarg($dbConfig['user']),
                !empty($dbConfig['pass']) ? '-p' . escapeshellarg($dbConfig['pass']) : '',
                escapeshellarg($dbName),
                escapeshellarg($tableName),
                escapeshellarg($backupFile)
            );
            
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
                error_log("✅ Schema-Backup erstellt: $backupFile");
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("⚠️ Schema-Backup-Fehler: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Helper-Methoden (wie in AutoSetup)
     */
    private function getDatabaseName(): string {
        try {
            $result = $this->pdo->query("SELECT DATABASE()")->fetchColumn();
            return $result ?: 'wameli';
        } catch (Exception $e) {
            return defined('DB_NAME') ? DB_NAME : 'wameli';
        }
    }
    
    private function getDatabaseConfig(): array {
        if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASS')) {
            return [
                'host' => DB_HOST,
                'port' => defined('DB_PORT') ? DB_PORT : 3306,
                'user' => DB_USER,
                'pass' => DB_PASS,
            ];
        }
        
        return [
            'host' => '127.0.0.1',
            'port' => 3306,
            'user' => 'root',
            'pass' => '',
        ];
    }
}

?>


