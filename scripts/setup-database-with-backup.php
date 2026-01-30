#!/usr/bin/env php
<?php
/**
 * Datenbank-Setup mit automatischem Backup
 * 
 * Erstellt automatisch ein Backup bevor die Datenbank erstellt/geändert wird
 * 
 * Verwendung:
 *   php scripts/setup-database-with-backup.php local      # Lokale DB mit Backup
 *   php scripts/setup-database-with-backup.php production # Produktions-DB mit Backup
 */

$environment = $argv[1] ?? 'local';

echo "🚀 Datenbank-Setup mit automatischem Backup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Schritt 1: Backup erstellen (falls Datenbank existiert)
echo "📋 Schritt 1: Backup erstellen\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$backupScript = __DIR__ . '/backup-database.php';
if (file_exists($backupScript)) {
    echo "💾 Erstelle Backup...\n";
    passthru("php $backupScript $environment", $backupReturnCode);
    
    if ($backupReturnCode === 0) {
        echo "\n✅ Backup erfolgreich erstellt!\n\n";
    } else {
        echo "\n⚠️  Backup konnte nicht erstellt werden (Datenbank existiert möglicherweise noch nicht)\n\n";
    }
} else {
    echo "⚠️  Backup-Script nicht gefunden: $backupScript\n";
    echo "   Überspringe Backup...\n\n";
}

// Schritt 2: Datenbank-Setup ausführen
echo "📋 Schritt 2: Datenbank-Setup\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$setupScript = __DIR__ . '/create-all-tables.php';
if (file_exists($setupScript)) {
    echo "🔧 Führe Datenbank-Setup aus...\n";
    passthru("php $setupScript $environment", $setupReturnCode);
    
    if ($setupReturnCode === 0) {
        echo "\n✅ Datenbank-Setup erfolgreich!\n\n";
    } else {
        echo "\n❌ Datenbank-Setup fehlgeschlagen!\n\n";
        exit(1);
    }
} else {
    echo "⚠️  Setup-Script nicht gefunden: $setupScript\n";
    echo "   Bitte führen Sie die Migrationen manuell aus.\n\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "✅ Fertig!\n";
echo "   Backup wurde erstellt (falls Datenbank existierte)\n";
echo "   Datenbank-Setup wurde ausgeführt\n\n";

?>





