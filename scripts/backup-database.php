#!/usr/bin/env php
<?php
/**
 * Datenbank-Backup erstellen
 * 
 * Erstellt ein Backup-Dump der Datenbank bevor Änderungen vorgenommen werden
 * 
 * Verwendung:
 *   php scripts/backup-database.php local      # Backup der lokalen DB
 *   php scripts/backup-database.php production  # Backup der Produktions-DB
 */

$environment = $argv[1] ?? 'local';

if ($environment === 'production') {
    require_once __DIR__ . '/../config.production.php';
} else {
    require_once __DIR__ . '/../config.local.php';
}

echo "💾 Erstelle Datenbank-Backup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "Umgebung: " . ($environment === 'production' ? 'PRODUKTION' : 'LOKAL') . "\n";
echo "Datenbank: " . DB_NAME . "\n";
echo "Host: " . DB_HOST . ":" . DB_PORT . "\n\n";

// Backup-Verzeichnis erstellen
$backupDir = __DIR__ . '/../backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    echo "✅ Backup-Verzeichnis erstellt: $backupDir\n\n";
}

// Backup-Dateiname mit Timestamp
$timestamp = date('Y-m-d_H-i-s');
$backupFile = $backupDir . '/' . DB_NAME . '_backup_' . $timestamp . '.sql';

// MySQL-Dump-Befehl
$mysqlPath = '/Applications/XAMPP/xamppfiles/bin/mysql';
$mysqldumpPath = '/Applications/XAMPP/xamppfiles/bin/mysqldump';

// Prüfe ob mysqldump verfügbar ist
if (!file_exists($mysqldumpPath)) {
    // Versuche Standard-Pfad
    $mysqldumpPath = 'mysqldump';
}

echo "📦 Erstelle Backup...\n";

// MySQL Dump ausführen
$command = sprintf(
    '%s -h%s -P%d -u%s %s %s > %s 2>&1',
    escapeshellarg($mysqldumpPath),
    escapeshellarg(DB_HOST),
    DB_PORT,
    escapeshellarg(DB_USER),
    !empty(DB_PASS) ? '-p' . escapeshellarg(DB_PASS) : '',
    escapeshellarg(DB_NAME),
    escapeshellarg($backupFile)
);

exec($command, $output, $returnCode);

if ($returnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
    $fileSize = filesize($backupFile);
    $fileSizeFormatted = $fileSize > 1024 * 1024 
        ? number_format($fileSize / (1024 * 1024), 2) . ' MB'
        : number_format($fileSize / 1024, 2) . ' KB';
    
    echo "✅ Backup erfolgreich erstellt!\n";
    echo "   Datei: $backupFile\n";
    echo "   Größe: $fileSizeFormatted\n\n";
    
    // Komprimiertes Backup erstellen (optional)
    if (function_exists('gzencode')) {
        $compressedFile = $backupFile . '.gz';
        $compressed = gzencode(file_get_contents($backupFile), 9);
        file_put_contents($compressedFile, $compressed);
        $compressedSize = filesize($compressedFile);
        $compressedSizeFormatted = $compressedSize > 1024 * 1024 
            ? number_format($compressedSize / (1024 * 1024), 2) . ' MB'
            : number_format($compressedSize / 1024, 2) . ' KB';
        
        echo "✅ Komprimiertes Backup erstellt!\n";
        echo "   Datei: $compressedFile\n";
        echo "   Größe: $compressedSizeFormatted\n\n";
    }
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "✅ Backup abgeschlossen!\n\n";
    
} else {
    echo "❌ Fehler beim Erstellen des Backups!\n";
    if (!empty($output)) {
        echo "   Ausgabe: " . implode("\n", $output) . "\n";
    }
    echo "   Return Code: $returnCode\n\n";
    
    // Versuche alternative Methode mit PDO
    echo "🔄 Versuche alternative Backup-Methode...\n";
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        
        // Hole alle Tabellen
        $tables = $pdo->query("SHOW TABLES FROM `" . DB_NAME . "`")->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($tables)) {
            echo "⚠️  Keine Tabellen gefunden in Datenbank '" . DB_NAME . "'\n";
            echo "   Möglicherweise existiert die Datenbank noch nicht.\n\n";
            exit(0);
        }
        
        // Verbinde zur Datenbank
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS
        );
        
        $backupContent = "-- Database Backup: " . DB_NAME . "\n";
        $backupContent .= "-- Created: " . date('Y-m-d H:i:s') . "\n";
        $backupContent .= "-- Environment: " . ($environment === 'production' ? 'PRODUCTION' : 'LOCAL') . "\n\n";
        $backupContent .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        
        foreach ($tables as $table) {
            // CREATE TABLE Statement
            $createTable = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
            $backupContent .= "-- Table: $table\n";
            $backupContent .= "DROP TABLE IF EXISTS `$table`;\n";
            $backupContent .= $createTable['Create Table'] . ";\n\n";
            
            // Daten exportieren
            $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $backupContent .= "-- Data for table: $table\n";
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) use ($pdo) {
                        return $pdo->quote($val);
                    }, array_values($row));
                    $backupContent .= "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                }
                $backupContent .= "\n";
            }
        }
        
        $backupContent .= "SET FOREIGN_KEY_CHECKS=1;\n";
        
        file_put_contents($backupFile, $backupContent);
        
        $fileSize = filesize($backupFile);
        $fileSizeFormatted = $fileSize > 1024 * 1024 
            ? number_format($fileSize / (1024 * 1024), 2) . ' MB'
            : number_format($fileSize / 1024, 2) . ' KB';
        
        echo "✅ Backup erfolgreich erstellt (PDO-Methode)!\n";
        echo "   Datei: $backupFile\n";
        echo "   Größe: $fileSizeFormatted\n";
        echo "   Tabellen: " . count($tables) . "\n\n";
        
    } catch (PDOException $e) {
        echo "❌ Fehler bei alternativer Backup-Methode: " . $e->getMessage() . "\n\n";
        exit(1);
    }
}

?>





