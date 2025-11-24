<?php
/**
 * Findet alle Dateien mit Supabase-Verwendung
 * Hilft bei der systematischen Umstellung auf MySQL
 */

$projectRoot = __DIR__ . '/..';
$srcDir = $projectRoot . '/src';

function findSupabaseUsage($dir) {
    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && preg_match('/\.(ts|tsx)$/', $file->getFilename())) {
            $content = file_get_contents($file->getPathname());
            if (preg_match('/supabase|isSupabaseConfigured/i', $content)) {
                $relativePath = str_replace($dir . '/', '', $file->getPathname());
                
                // Zähle Supabase-Aufrufe
                $supabaseCalls = preg_match_all('/supabase\s*\.\s*[a-zA-Z]/', $content, $matches);
                $imports = preg_match_all('/import.*supabase|from.*supabase/i', $content, $importMatches);
                
                $files[] = [
                    'file' => $relativePath,
                    'supabase_calls' => $supabaseCalls,
                    'imports' => $imports,
                    'lines' => count(explode("\n", $content))
                ];
            }
        }
    }

    return $files;
}

$files = findSupabaseUsage($srcDir);

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📋 Supabase-Verwendung in TypeScript-Dateien\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

usort($files, function($a, $b) {
    return $b['supabase_calls'] - $a['supabase_calls'];
});

$totalCalls = 0;
foreach ($files as $file) {
    $totalCalls += $file['supabase_calls'];
    $priority = $file['supabase_calls'] > 5 ? '🔴 HOCH' : ($file['supabase_calls'] > 0 ? '🟡 MITTEL' : '🟢 NIEDRIG');
    
    echo sprintf(
        "%s %s\n   Aufrufe: %d | Imports: %d | Zeilen: %d\n\n",
        $priority,
        $file['file'],
        $file['supabase_calls'],
        $file['imports'],
        $file['lines']
    );
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Zusammenfassung:\n";
echo "   Gesamt Dateien: " . count($files) . "\n";
echo "   Gesamt Supabase-Aufrufe: $totalCalls\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

