#!/usr/bin/env php
<?php
/**
 * Konvertiert PostgreSQL-Migrationen zu MySQL
 * 
 * Dieses Script liest alle Supabase-Migrationen (PostgreSQL) und konvertiert sie
 * zu MySQL-kompatiblen SQL-Dateien.
 * 
 * Verwendung:
 *   php scripts/convert-migrations-to-mysql.php
 */

echo "🔄 Konvertiere PostgreSQL-Migrationen zu MySQL\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$sourceDir = __DIR__ . '/../supabase/migrations';
$targetDir = __DIR__ . '/../database/migrations/mysql';

// Erstelle Ziel-Verzeichnis
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "✅ Ziel-Verzeichnis erstellt: $targetDir\n\n";
}

// Lade alle Migrationen
$migrations = glob($sourceDir . '/*.sql');
sort($migrations);

if (empty($migrations)) {
    echo "❌ Keine Migrationen gefunden in: $sourceDir\n";
    exit(1);
}

echo "📋 Gefundene Migrationen: " . count($migrations) . "\n\n";

foreach ($migrations as $migration) {
    $filename = basename($migration);
    $targetFile = $targetDir . '/' . $filename;
    
    echo "🔄 Konvertiere: $filename...\n";
    
    $sql = file_get_contents($migration);
    
    // PostgreSQL → MySQL Konvertierungen
    
    // 1. Entferne PostgreSQL-spezifische Blöcke
    $sql = preg_replace('/DO \$\$.*?\$\$;/s', '', $sql); // DO $$ Blöcke entfernen
    $sql = preg_replace('/BEGIN\s*END;/s', '', $sql); // Leere BEGIN END Blöcke
    
    // 2. UUID → CHAR(36)
    $sql = preg_replace('/UUID\s+PRIMARY KEY/i', 'CHAR(36) PRIMARY KEY', $sql);
    $sql = preg_replace('/UUID\s+DEFAULT gen_random_uuid\(\)/i', 'CHAR(36) DEFAULT (UUID())', $sql);
    $sql = preg_replace('/UUID\s+REFERENCES/i', 'CHAR(36) REFERENCES', $sql);
    $sql = preg_replace('/UUID\s+NOT NULL/i', 'CHAR(36) NOT NULL', $sql);
    $sql = preg_replace('/UUID\s+/i', 'CHAR(36) ', $sql);
    
    // 3. TIMESTAMPTZ → DATETIME
    $sql = preg_replace('/TIMESTAMPTZ/i', 'DATETIME', $sql);
    $sql = preg_replace('/DEFAULT NOW\(\)/i', 'DEFAULT CURRENT_TIMESTAMP', $sql);
    
    // 4. TEXT bleibt TEXT (MySQL unterstützt TEXT)
    
    // 5. JSONB → JSON
    $sql = preg_replace('/JSONB/i', 'JSON', $sql);
    
    // 6. NUMERIC → DECIMAL
    $sql = preg_replace('/NUMERIC\((\d+),\s*(\d+)\)/i', 'DECIMAL($1,$2)', $sql);
    $sql = preg_replace('/NUMERIC/i', 'DECIMAL(10,2)', $sql);
    
    // 7. INET → VARCHAR(45) (für IPv6)
    $sql = preg_replace('/INET/i', 'VARCHAR(45)', $sql);
    
    // 8. BOOLEAN → TINYINT(1)
    $sql = preg_replace('/BOOLEAN/i', 'TINYINT(1)', $sql);
    $sql = preg_replace('/DEFAULT true/i', 'DEFAULT 1', $sql);
    $sql = preg_replace('/DEFAULT false/i', 'DEFAULT 0', $sql);
    
    // 9. INTEGER → INT
    $sql = preg_replace('/INTEGER/i', 'INT', $sql);
    
    // 10. Entferne RLS (Row Level Security) - MySQL hat kein RLS
    $sql = preg_replace('/ALTER TABLE .+ ENABLE ROW LEVEL SECURITY;/i', '', $sql);
    $sql = preg_replace('/CREATE POLICY .+;/i', '', $sql);
    $sql = preg_replace('/DROP POLICY IF EXISTS .+;/i', '', $sql);
    
    // 11. Entferne PostgreSQL-spezifische Index-Syntax
    $sql = preg_replace('/USING GIST\([^)]+\)/i', '', $sql);
    
    // 12. Entferne PostgreSQL-Functions (werden später separat behandelt)
    $sql = preg_replace('/CREATE OR REPLACE FUNCTION .+?END;.*?LANGUAGE plpgsql;/is', '', $sql);
    $sql = preg_replace('/CREATE TRIGGER .+?EXECUTE FUNCTION .+?;/is', '', $sql);
    
    // 13. Entferne Kommentare mit speziellen Zeichen
    $sql = preg_replace('/COMMENT ON TABLE .+?;/i', '', $sql);
    
    // 14. ON CONFLICT → MySQL INSERT ... ON DUPLICATE KEY UPDATE
    $sql = preg_replace(
        '/ON CONFLICT \(([^)]+)\) DO NOTHING/i',
        'ON DUPLICATE KEY UPDATE $1 = $1',
        $sql
    );
    
    // 15. Entferne CHECK Constraints (MySQL unterstützt sie, aber Syntax ist anders)
    // Behalte sie erstmal, MySQL 8.0+ unterstützt CHECK
    
    // 16. Entferne leere Zeilen und mehrfache Leerzeilen
    $sql = preg_replace('/\n\s*\n\s*\n+/', "\n\n", $sql);
    
    // 17. Entferne führende/trailing Leerzeichen
    $sql = trim($sql);
    
    // Speichere konvertierte Datei
    file_put_contents($targetFile, $sql);
    
    echo "   ✅ Gespeichert: $targetFile\n";
}

echo "\n✅ Konvertierung abgeschlossen!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "📝 Nächste Schritte:\n";
echo "   1. Lokale DB: php scripts/setup-database-local.php\n";
echo "   2. Produktions-DB: php scripts/setup-database-production.php\n\n";

?>




