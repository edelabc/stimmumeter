<?php
/**
 * Create AI Tables Script
 * Führt das SQL-Script zur Erstellung der AI-Tabellen aus
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();

    if (!$pdo) {
        die("❌ Datenbankverbindung fehlgeschlagen\n");
    }

    echo "✅ Datenbankverbindung erfolgreich\n";

    // SQL-Datei lesen
    $sqlFile = __DIR__ . '/../database/create-ai-tables-production.sql';

    if (!file_exists($sqlFile)) {
        die("❌ SQL-Datei nicht gefunden: $sqlFile\n");
    }

    $sql = file_get_contents($sqlFile);

    if (empty($sql)) {
        die("❌ SQL-Datei ist leer\n");
    }

    echo "📄 SQL-Datei geladen: " . basename($sqlFile) . "\n";

    // SQL in einzelne Statements aufteilen
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    $executedCount = 0;
    $errorCount = 0;

    foreach ($statements as $statement) {
        // Überspringe Kommentare und leere Zeilen
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }

        try {
            $pdo->exec($statement);
            $executedCount++;
            echo "✅ Statement ausgeführt\n";
        } catch (PDOException $e) {
            // Bei IF NOT EXISTS Statements sind Fehler manchmal OK
            if (strpos($statement, 'CREATE TABLE IF NOT EXISTS') === 0 ||
                strpos($statement, 'INSERT IGNORE') === 0) {
                echo "⚠️  Statement hatte Warnung (wahrscheinlich bereits vorhanden): " . $e->getMessage() . "\n";
            } else {
                echo "❌ Fehler beim Ausführen: " . $e->getMessage() . "\n";
                echo "   SQL: " . substr($statement, 0, 100) . "...\n";
                $errorCount++;
            }
        }
    }

    echo "\n📊 Zusammenfassung:\n";
    echo "   Ausgeführte Statements: $executedCount\n";
    echo "   Fehler: $errorCount\n";

    // Verifizierung: Tabellen prüfen
    echo "\n🔍 Verifizierung der Tabellen:\n";

    $tables = ['ai_configurations', 'ai_provider_settings', 'ai_terms_acceptance'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "   ✅ $table: {$result['count']} Datensätze\n";
        } catch (PDOException $e) {
            echo "   ❌ $table: Tabelle nicht gefunden oder Fehler: " . $e->getMessage() . "\n";
        }
    }

    echo "\n🎉 Script erfolgreich beendet!\n";

} catch (Exception $e) {
    echo "❌ Unerwarteter Fehler: " . $e->getMessage() . "\n";
    exit(1);
}

?>

