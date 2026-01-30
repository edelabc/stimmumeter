<?php
/**
 * Script zum Erstellen von Standard Legal Pages (inkl. AI-Terms)
 */

require_once __DIR__ . '/../api/db.php';

try {
    $pdo = getDbConnection();
    
    echo "Prüfe legal_pages Tabelle...\n";
    
    // Prüfe ob Tabelle existiert
    $stmt = $pdo->query("SHOW TABLES LIKE 'legal_pages'");
    if (!$stmt->fetch()) {
        echo "❌ Tabelle legal_pages existiert nicht!\n";
        echo "Bitte führen Sie zuerst das Schema-Script aus.\n";
        exit(1);
    }
    
    echo "✅ Tabelle legal_pages existiert\n\n";
    
    // Generiere UUID
    function generateUuid() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    // Standard Legal Pages definieren
    $legalPages = [
        [
            'id' => generateUuid(),
            'page_type' => 'ai-terms',
            'title' => 'KI-Nutzungsbedingungen',
            'slug' => 'ki-nutzungsbedingungen',
            'content' => '# KI-Nutzungsbedingungen

## 1. Einführung

Diese Nutzungsbedingungen regeln die Verwendung von KI-Funktionen in unserer Anwendung.

## 2. Datenverarbeitung

- Ihre Stimmungsdaten werden zur KI-Analyse verwendet
- Die Analyse erfolgt über externe KI-Provider (OpenAI, Google, Anthropic, xAI, Manus)
- Ihre Daten werden verschlüsselt übertragen
- API-Keys werden sicher gespeichert

## 3. Datenschutz

- Wir geben Ihre Daten nicht an Dritte weiter
- KI-Provider verarbeiten Daten gemäß ihrer Datenschutzrichtlinien
- Sie können Ihre Einwilligung jederzeit widerrufen

## 4. Haftungsausschluss

- KI-Analysen sind Interpretationen und keine medizinischen Diagnosen
- Wir übernehmen keine Haftung für KI-generierte Inhalte
- Bei psychischen Problemen konsultieren Sie bitte einen Facharzt

## 5. Ihre Rechte

- Sie können KI-Funktionen jederzeit deaktivieren
- Sie können Ihre KI-Konfigurationen löschen
- Sie haben Zugriff auf alle Ihre gespeicherten Daten

## 6. Änderungen

Wir behalten uns vor, diese Bedingungen jederzeit zu ändern. Sie werden über Änderungen informiert.

**Stand:** ' . date('d.m.Y') . '

Bei Fragen kontaktieren Sie uns bitte.',
            'is_active' => 1
        ],
        [
            'id' => generateUuid(),
            'page_type' => 'privacy',
            'title' => 'Datenschutzerklärung',
            'slug' => 'datenschutz',
            'content' => '# Datenschutzerklärung

## 1. Verantwortlicher

[Ihr Unternehmen]
[Ihre Adresse]
[Ihre E-Mail]

## 2. Erhebung und Speicherung personenbezogener Daten

Wir erheben und verarbeiten Ihre Daten gemäß DSGVO.

## 3. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit.

**Stand:** ' . date('d.m.Y'),
            'is_active' => 1
        ],
        [
            'id' => generateUuid(),
            'page_type' => 'terms',
            'title' => 'Allgemeine Nutzungsbedingungen',
            'slug' => 'nutzungsbedingungen',
            'content' => '# Allgemeine Nutzungsbedingungen

## 1. Geltungsbereich

Diese Nutzungsbedingungen gelten für die Nutzung unserer Stimmungsmeter-Anwendung.

## 2. Leistungsbeschreibung

Unsere Anwendung ermöglicht das Tracking und die Analyse von Stimmungen.

## 3. Nutzerkonto

Sie sind für die Sicherheit Ihres Kontos verantwortlich.

**Stand:** ' . date('d.m.Y'),
            'is_active' => 1
        ],
        [
            'id' => generateUuid(),
            'page_type' => 'imprint',
            'title' => 'Impressum',
            'slug' => 'impressum',
            'content' => '# Impressum

## Angaben gemäß § 5 TMG

[Ihr Name/Firma]
[Ihre Straße und Hausnummer]
[PLZ und Ort]

**Kontakt:**
Telefon: [Ihre Telefonnummer]
E-Mail: [Ihre E-Mail]

**Stand:** ' . date('d.m.Y'),
            'is_active' => 1
        ]
    ];
    
    // Füge Pages ein (oder aktualisiere falls vorhanden)
    $stmt = $pdo->prepare("
        INSERT INTO legal_pages (id, page_type, title, slug, content, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            content = VALUES(content),
            is_active = VALUES(is_active),
            updated_at = NOW()
    ");
    
    foreach ($legalPages as $page) {
        $stmt->execute([
            $page['id'],
            $page['page_type'],
            $page['title'],
            $page['slug'],
            $page['content'],
            $page['is_active']
        ]);
        echo "✅ {$page['page_type']}: {$page['title']}\n";
    }
    
    echo "\n";
    
    // Zeige Zusammenfassung
    $stmt = $pdo->query("SELECT page_type, title, is_active FROM legal_pages ORDER BY page_type");
    $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Zusammenfassung:\n";
    foreach ($pages as $page) {
        $status = $page['is_active'] ? '✅ aktiv' : '❌ inaktiv';
        echo "  - {$page['page_type']}: {$page['title']} ({$status})\n";
    }
    
    echo "\n✅ Alle Legal Pages erstellt!\n";
    
} catch (PDOException $e) {
    echo "❌ Fehler: " . $e->getMessage() . "\n";
    exit(1);
}
?>

