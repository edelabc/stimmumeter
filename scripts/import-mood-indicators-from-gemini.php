<?php
/**
 * Import-Skript für Mood Indicators aus mood_final_gemini
 * 
 * Dieses Skript:
 * 1. Extrahiert die Daten aus der Python-Datei
 * 2. Prüft und erweitert die Tabellenstruktur
 * 3. Importiert die Daten in die mood_indicators Tabelle
 */

require_once __DIR__ . '/../config.local.php';

// Datenbankverbindung
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3308) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✅ Datenbankverbindung erfolgreich\n";
} catch (PDOException $e) {
    die("❌ Datenbankverbindung fehlgeschlagen: " . $e->getMessage() . "\n");
}

// 1. Tabellenstruktur prüfen und erweitern
echo "\n📋 Prüfe Tabellenstruktur...\n";

$columnsToCheck = [
    'min_value' => "INT DEFAULT 1",
    'max_value' => "INT DEFAULT 10",
    'step_value' => "DECIMAL(5,2) DEFAULT 0.5",
    'color_start' => "VARCHAR(7) DEFAULT '#ef4444'",
    'color_end' => "VARCHAR(7) DEFAULT '#10b981'",
    'icon_url' => "VARCHAR(500) NULL",
    'category_id' => "INT NULL",
    'description' => "TEXT NULL"
];

foreach ($columnsToCheck as $column => $definition) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `mood_indicators` LIKE '$column'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE `mood_indicators` ADD COLUMN `$column` $definition");
            echo "  ✅ Spalte '$column' hinzugefügt\n";
        } else {
            echo "  ✓ Spalte '$column' existiert bereits\n";
        }
    } catch (PDOException $e) {
        echo "  ⚠️ Fehler bei Spalte '$column': " . $e->getMessage() . "\n";
    }
}

// 2. Master-Daten aus Python-Datei (manuell extrahiert)
$masterData = [
    "abgelehnt" => ["🏚️", "abgelehnt", "negativ", "Ablehnung / Einsamkeit", "#4b5563"],
    "abgelenkt" => ["🧠", "abgelenkt", "negativ", "Unkonzentriertheit", "#6b7280"],
    "abgeneigt" => ["👎", "abgeneigt", "neutral", "Ablehnung / Distanz", "#6b7280"],
    "abschreckend" => ["⚠️", "abschreckend", "negativ", "Warnung / Abwehr", "#b91c1c"],
    "absichtlos" => ["🏳️", "absichtlos", "neutral", "Neutralität", "#9ca3af"],
    "abstoßend" => ["🚫", "abstoßend", "negativ", "Ekel / Ablehnung", "#b91c1c"],
    "abtörnend" => ["🚫", "abtörnend", "negativ", "Ekel / Ablehnung", "#b91c1c"],
    "abwesend" => ["😶", "abwesend", "negativ", "Geistesabwesenheit", "#6b7280"],
    "aggressiv" => ["🥊", "aggressiv", "negativ", "Wut / Aggression", "#ef4444"],
    "ahnungslos" => ["🌫️", "ahnungslos", "negativ", "Unwissenheit", "#9ca3af"],
    "aktiv" => ["⚡", "aktiv", "positiv", "Energie / Aktivierung", "#22c55e"],
    "albern" => ["🤪", "albern", "neutral", "Verspieltheit", "#eab308"],
    "allwissend" => ["📚", "allwissend", "neutral", "Wissen / Dominanz", "#6366f1"],
    "angenehm" => ["😊", "angenehm", "positiv", "Wohlbefinden", "#22c55e"],
    "angespannt" => ["😬", "angespannt", "negativ", "Stress / Anspannung", "#f97316"],
    "antriebslos" => ["😶‍🌫️", "antriebslos", "negativ", "Erschöpfung / Apathie", "#6b7280"],
    "anziehend" => ["✨", "anziehend", "positiv", "Anziehung / Interesse", "#ec4899"],
    "arrogant" => ["🦚", "arrogant", "negativ", "Überheblichkeit", "#f97316"],
    "aufgeregt" => ["🤩", "aufgeregt", "negativ", "Unruhe / Nervosität", "#f97316"],
    "aufmerksam" => ["👁️", "aufmerksam", "neutral", "Fokus / Wachheit", "#0ea5e9"],
    "aufrichtig" => ["🤝", "aufrichtig", "positiv", "Ehrlichkeit", "#22c55e"],
    "ausgeglichen" => ["🧘", "ausgeglichen", "positiv", "Ruhe / Ausgeglichenheit", "#10b981"],
    "begeistert" => ["🤩", "begeistert", "positiv", "Freude / Begeisterung", "#eab308"],
    "behutsam" => ["🤲", "behutsam", "positiv", "Fürsorge / Achtsamkeit", "#14b8a6"],
    "belastbar" => ["💪", "belastbar", "positiv", "Stärke / Resilienz", "#22c55e"],
    "bescheiden" => ["🎖️", "bescheiden", "positiv", "Demut", "#10b981"],
    "beschämt" => ["😳", "beschämt", "negativ", "Scham", "#b91c1c"],
    "besonnen" => ["🧘‍♂️", "besonnen", "positiv", "Ruhe / Weisheit", "#10b981"],
    "besorgt" => ["😟", "besorgt", "negativ", "Sorge / Angst", "#f97316"],
    "chaotisch" => ["🎲", "chaotisch", "neutral", "Unordnung / Spontaneität", "#f97316"],
    "dankbar" => ["🙏", "dankbar", "positiv", "Dankbarkeit", "#22c55e"],
    "demotiviert" => ["🙇", "demotiviert", "negativ", "Lustlosigkeit", "#6b7280"],
    "demütig" => ["🛐", "demütig", "positiv", "Demut / Ehrfurcht", "#10b981"],
    "depressiv" => ["🫥", "depressiv", "negativ", "Traurigkeit", "#4b5563"],
    "desinteressiert" => ["😐", "desinteressiert", "negativ", "Langeweile / Rückzug", "#6b7280"],
    "desorientiert" => ["❓", "desorientiert", "negativ", "Verwirrung", "#6b7280"],
    "distanziert" => ["🧊", "distanziert", "neutral", "Rückzug / Kühle", "#64748b"],
    "dumm" => ["🤡", "dumm", "negativ", "Unvermögen", "#ef4444"],
    "dynamisch" => ["🏃", "dynamisch", "positiv", "Energie / Bewegung", "#22c55e"],
    "egoistisch" => ["🤳", "egoistisch", "negativ", "Egoismus", "#b91c1c"],
    "egozentrisch" => ["🪞", "egozentrisch", "negativ", "Selbstbezogenheit", "#f97316"],
    "ehrlich" => ["🤝", "ehrlich", "positiv", "Ehrlichkeit", "#22c55e"],
    "eifersüchtig" => ["😒", "eifersüchtig", "negativ", "Neid / Unsicherheit", "#b91c1c"],
    "eindrucksvoll" => ["🌟", "eindrucksvoll", "positiv", "Bewunderung", "#a855f7"],
    "einfach gestrickt" => ["📦", "einfach gestrickt", "neutral", "Schlichtheit", "#9ca3af"],
    "emotional" => ["🎭", "emotional", "neutral", "Gefühlvoll", "#ec4899"],
    "emotionslos" => ["😐", "emotionslos", "negativ", "Kälte / Apathie", "#6b7280"],
    "empathisch" => ["💗", "empathisch", "positiv", "Mitgefühl", "#f97316"],
    "energiegeladen" => ["🔥", "energiegeladen", "positiv", "Hohe Energie", "#f97316"],
    "energisch" => ["🔥", "energisch", "positiv", "Energie / Entschlossenheit", "#f97316"],
    "engagiert" => ["📌", "engagiert", "positiv", "Verbindlichkeit / Einsatz", "#0ea5e9"],
    "entspannt" => ["🛀", "entspannt", "positiv", "Entspannung", "#10b981"],
    "enttäuscht" => ["😞", "enttäuscht", "negativ", "Traurigkeit / Erwartungsbruch", "#b91c1c"],
    "erleichtert" => ["😌", "erleichtert", "positiv", "Erleichterung", "#22c55e"],
    "ermutigt" => ["💡", "ermutigt", "positiv", "Hoffnung / Antrieb", "#22c55e"],
    "ermüdet" => ["😴", "ermüdet", "negativ", "Erschöpfung", "#6b7280"],
    "ernsthaft" => ["👮", "ernsthaft", "positiv", "Seriosität", "#4b5563"],
    "erotisch" => ["💋", "erotisch", "positiv", "Anziehung / Sinnlichkeit", "#ec4899"],
    "erschöpft" => ["🥵", "erschöpft", "negativ", "Erschöpfung", "#f97316"],
    "fair" => ["⚖️", "fair", "positiv", "Gerechtigkeit", "#22c55e"],
    "fantasievoll" => ["🌈", "fantasievoll", "positiv", "Kreativität / Vorstellungskraft", "#a855f7"],
    "fleißig" => ["🧹", "fleißig", "positiv", "Leistung / Disziplin", "#22c55e"],
    "flexibel" => ["🧘‍♂️", "flexibel", "positiv", "Anpassungsfähigkeit", "#22c55e"],
    "fokussiert" => ["🎯", "fokussiert", "positiv", "Konzentration", "#6366f1"],
    "freundlich" => ["😊", "freundlich", "positiv", "Freundlichkeit", "#22c55e"],
    "friedlich" => ["🕊️", "friedlich", "positiv", "Harmonie", "#10b981"],
    "fröhlich" => ["😄", "fröhlich", "positiv", "Freude", "#eab308"],
    "frustriert" => ["😖", "frustriert", "negativ", "Frustration", "#ef4444"],
    "fürsorglich" => ["👶", "fürsorglich", "positiv", "Fürsorge / Wärme", "#f97316"],
    "geduldig" => ["⌛", "geduldig", "positiv", "Ruhe / Ausdauer", "#0ea5e9"],
    "gechillt" => ["🧊", "gechillt", "positiv", "Entspannung", "#10b981"],
    "geerdet" => ["🌍", "geerdet", "positiv", "Stabilität / Bodenständigkeit", "#10b981"],
    "gehorsam" => ["🐕", "gehorsam", "positiv", "Anpassung", "#22c55e"],
    "gelangweilt" => ["🥱", "gelangweilt", "negativ", "Langeweile", "#6b7280"],
    "gelassen" => ["😌", "gelassen", "positiv", "Ruhe / Entspanntheit", "#10b981"],
    "gemein" => ["🤬", "gemein", "negativ", "Bosheit", "#b91c1c"],
    "genügsam" => ["🥣", "genügsam", "neutral", "Zufriedenheit / Einfachheit", "#6b7280"],
    "gereizt" => ["😠", "gereizt", "negativ", "Ärger", "#ef4444"],
    "gerissen" => ["🦊", "gerissen", "negativ", "List / Manipulation", "#f97316"],
    "geschwätzig" => ["🗯️", "geschwätzig", "negativ", "Unruhe / Kommunikation", "#f97316"],
    "gesellig" => ["🕺", "gesellig", "positiv", "Soziale Freude", "#ec4899"],
    "gesprächig" => ["🗣️", "gesprächig", "neutral", "Kommunikation", "#0ea5e9"],
    "gestresst" => ["🤯", "gestresst", "negativ", "Stress", "#ef4444"],
    "gewissenhaft" => ["📋", "gewissenhaft", "positiv", "Verantwortung / Genauigkeit", "#6366f1"],
    "gewöhnlich" => ["🏠", "gewöhnlich", "neutral", "Normalität", "#9ca3af"],
    "großzügig" => ["🎁", "großzügig", "positiv", "Großzügigkeit", "#f97316"],
    "harmoniebedürftig" => ["🕊️", "harmoniebedürftig", "positiv", "Friedfertigkeit", "#10b981"],
    "hektisch" => ["🌪️", "hektisch", "negativ", "Unruhe", "#f97316"],
    "herzlich" => ["💖", "herzlich", "positiv", "Wärme", "#ec4899"],
    "hilfsbereit" => ["🆘", "hilfsbereit", "positiv", "Hilfsbereitschaft", "#0ea5e9"],
    "hinterhältig" => ["🐍", "hinterhältig", "negativ", "Verrat", "#b91c1c"],
    "hoffnungslos" => ["🌫️", "hoffnungslos", "negativ", "Verzweiflung", "#4b5563"],
    "hoffnungsvoll" => ["🌅", "hoffnungsvoll", "positiv", "Hoffnung", "#22c55e"],
    "humorvoll" => ["😂", "humorvoll", "positiv", "Freude / Humor", "#eab308"],
    "illoyal" => ["🚫", "illoyal", "negativ", "Verrat / Distanz", "#b91c1c"],
    "impulsiv" => ["💥", "impulsiv", "neutral", "Spontaneität", "#f97316"],
    "intelligent" => ["🧠", "intelligent", "positiv", "Verstand / Klarheit", "#6366f1"],
    "interessiert" => ["👀", "interessiert", "positiv", "Interesse / Fokus", "#0ea5e9"],
    "isoliert" => ["🚪", "isoliert", "negativ", "Einsamkeit / Rückzug", "#4b5563"],
    "kaltherzig" => ["🧊", "kaltherzig", "negativ", "Kälte", "#4b5563"],
    "kindisch" => ["🍭", "kindisch", "negativ", "Unreife", "#eab308"],
    "klar" => ["💎", "klar", "positiv", "Klarheit", "#0ea5e9"],
    "konfrontativ" => ["⚔️", "konfrontativ", "negativ", "Konflikt / Ärger", "#ef4444"],
    "konzentriert" => ["🧩", "konzentriert", "positiv", "Fokus / Klarheit", "#6366f1"],
    "kooperativ" => ["🤝", "kooperativ", "positiv", "Verbundenheit / Kooperation", "#22c55e"],
    "kreativ" => ["🎨", "kreativ", "positiv", "Kreativität", "#a855f7"],
    "launig" => ["🎡", "launig", "neutral", "Stimmungsschwankung", "#f97316"],
    "lebendig" => ["💃", "lebendig", "positiv", "Lebensfreude", "#ec4899"],
    "liebevoll" => ["❤️", "liebevoll", "positiv", "Liebe / Zuneigung", "#f97316"],
    "loyal" => ["🫡", "loyal", "positiv", "Treue", "#22c55e"],
    "lustig" => ["😄", "lustig", "positiv", "Freude / Spaß", "#eab308"],
    "lustlos" => ["😒", "lustlos", "negativ", "Apathie / Desinteresse", "#6b7280"],
    "manipulativ" => ["🎭", "manipulativ", "negativ", "Manipulation", "#b91c1c"],
    "melancholisch" => ["🌧️", "melancholisch", "negativ", "Traurigkeit / Nachdenklichkeit", "#64748b"],
    "misstrauisch" => ["🕵️", "misstrauisch", "negativ", "Misstrauen", "#f97316"],
    "motiviert" => ["🚀", "motiviert", "positiv", "Antrieb / Zielorientierung", "#22c55e"],
    "müde" => ["💤", "müde", "neutral", "Erschöpfung", "#6b7280"],
    "naiv" => ["🍼", "naiv", "negativ", "Unwissenheit", "#eab308"],
    "nervös" => ["😟", "nervös", "negativ", "Angst / Unsicherheit", "#f97316"],
    "neugierig" => ["🧐", "neugierig", "positiv", "Interesse / Neugier", "#0ea5e9"],
    "normal" => ["😐", "normal", "neutral", "Durchschnitt", "#9ca3af"],
    "offen" => ["👐", "offen", "positiv", "Offenheit", "#22c55e"],
    "oppositionell" => ["🛑", "oppositionell", "negativ", "Konflikt / Widerstand", "#ef4444"],
    "optimistisch" => ["🌞", "optimistisch", "positiv", "Hoffnung / Zuversicht", "#eab308"],
    "orientiert" => ["🧭", "orientiert", "positiv", "Fokus", "#0ea5e9"],
    "panisch" => ["😱", "panisch", "negativ", "Starke Angst", "#b91c1c"],
    "passiv" => ["🛌", "passiv", "neutral", "Rückzug / Inaktivität", "#9ca3af"],
    "planlos" => ["🤷", "planlos", "negativ", "Orientierungslosigkeit", "#6b7280"],
    "präsent" => ["🙋", "präsent", "positiv", "Anwesenheit", "#22c55e"],
    "rational" => ["📊", "rational", "neutral", "Verstand", "#6366f1"],
    "realistisch" => ["🎯", "realistisch", "neutral", "Realitätssinn", "#64748b"],
    "rebellisch" => ["🧨", "rebellisch", "negativ", "Widerstand", "#f97316"],
    "reflektiert" => ["🪞", "reflektiert", "positiv", "Selbstwahrnehmung", "#6366f1"],
    "reif" => ["🍷", "reif", "positiv", "Reife", "#4b5563"],
    "reizbar" => ["😡", "reizbar", "negativ", "Ärger / Gereiztheit", "#ef4444"],
    "relaxt" => ["🏖️", "relaxt", "positiv", "Entspannung", "#10b981"],
    "resilient" => ["🧱", "resilient", "positiv", "Widerstandskraft", "#22c55e"],
    "resigniert" => ["😔", "resigniert", "negativ", "Aufgabe / Ernüchterung", "#6b7280"],
    "respektvoll" => ["🤲", "respektvoll", "positiv", "Respekt", "#22c55e"],
    "robust" => ["💎", "robust", "positiv", "Stärke", "#4b5563"],
    "ruhig" => ["🌿", "ruhig", "positiv", "Ruhe", "#10b981"],
    "rückgratlos" => ["🪶", "rückgratlos", "negativ", "Schwäche", "#9ca3af"],
    "rücksichtslos" => ["💢", "rücksichtslos", "negativ", "Egoismus", "#b91c1c"],
    "rücksichtsvoll" => ["🤝", "rücksichtsvoll", "positiv", "Empathie", "#22c55e"],
    "scharfsinnig" => ["🔪", "scharfsinnig", "positiv", "Intelligenz", "#6366f1"],
    "schuldig" => ["😞", "schuldig", "negativ", "Schuld / Reue", "#b91c1c"],
    "schüchtern" => ["🙈", "schüchtern", "neutral", "Zurückhaltung", "#a855f7"],
    "schwach" => ["🪫", "schwach", "negativ", "Kraftlosigkeit", "#9ca3af"],
    "selbstbewusst" => ["😎", "selbstbewusst", "positiv", "Stolz / Selbstvertrauen", "#22c55e"],
    "selbstherrlich" => ["👑", "selbstherrlich", "negativ", "Arroganz", "#b91c1c"],
    "selbstlos" => ["🤲", "selbstlos", "positiv", "Altruismus", "#10b981"],
    "selbstsicher" => ["💼", "selbstsicher", "positiv", "Selbstvertrauen", "#22c55e"],
    "sensibel" => ["🌸", "sensibel", "neutral", "Empfindsamkeit", "#ec4899"],
    "sexy" => ["🔥", "sexy", "positiv", "Attraktivität", "#ec4899"],
    "sortiert" => ["📂", "sortiert", "positiv", "Ordnung", "#0ea5e9"],
    "souverän" => ["👑", "souverän", "positiv", "Überlegenheit / Ruhe", "#6366f1"],
    "spaßig" => ["😆", "spaßig", "positiv", "Freude / Verspieltheit", "#eab308"],
    "spielverderberisch" => ["🚫", "spielverderberisch", "negativ", "Negativität", "#4b5563"],
    "spontan" => ["⚡", "spontan", "neutral", "Spontaneität", "#eab308"],
    "stabil" => ["🏗️", "stabil", "positiv", "Sicherheit", "#22c55e"],
    "stolz" => ["🦁", "stolz", "positiv", "Stolz / Selbstwert", "#f59e0b"],
    "streitsüchtig" => ["⚡", "streitsüchtig", "negativ", "Konfliktlust", "#ef4444"],
    "strukturiert" => ["🏗️", "strukturiert", "positiv", "Ordnung", "#0ea5e9"],
    "stur" => ["🐂", "stur", "negativ", "Widerstand / Starrheit", "#f97316"],
    "sympathisch" => ["🤗", "sympathisch", "positiv", "Sympathie", "#22c55e"],
    "träge" => ["🧟", "träge", "negativ", "Passivität", "#6b7280"],
    "transparent" => ["🪟", "transparent", "positiv", "Klarheit", "#0ea5e9"],
    "traurig" => ["😢", "traurig", "negativ", "Trauer", "#4b5563"],
    "trostlos" => ["🌑", "trostlos", "negativ", "Hoffnungslosigkeit", "#4b5563"],
    "trotzig" => ["😤", "trotzig", "negativ", "Ärger / Widerstand", "#f97316"],
    "überfordert" => ["🎉", "überfordert", "negativ", "Stress / Überlastung", "#f97316"],
    "überheblich" => ["🤴", "überheblich", "negativ", "Arroganz", "#b91c1c"],
    "überlastet" => ["🏋️", "überlastet", "negativ", "Stress", "#ef4444"],
    "übermütig" => ["🎉", "übermütig", "neutral", "Energie / Risiko", "#eab308"],
    "überrascht" => ["😲", "überrascht", "neutral", "Überraschung", "#f59e0b"],
    "unausgeglichen" => ["⚖️", "unausgeglichen", "negativ", "Instabilität", "#f97316"],
    "undankbar" => ["👎", "undankbar", "negativ", "Undankbarkeit", "#b91c1c"],
    "unfähig" => ["🤕", "unfähig", "negativ", "Inkompetenz", "#b91c1c"],
    "unfair" => ["⚖️", "unfair", "negativ", "Ungerechtigkeit", "#b91c1c"],
    "ungeduldig" => ["⏳", "ungeduldig", "neutral", "Unruhe", "#f97316"],
    "unklug" => ["🧠", "unklug", "negativ", "Unvernunft", "#eab308"],
    "unkooperativ" => ["🙅", "unkooperativ", "negativ", "Konflikt / Ablehnung", "#ef4444"],
    "unnahbar" => ["🧊", "unnahbar", "neutral", "Distanz", "#64748b"],
    "unruhig" => ["🐜", "unruhig", "negativ", "Nervosität", "#f97316"],
    "unsympathisch" => ["🙅", "unsympathisch", "negativ", "Antipathie", "#b91c1c"],
    "unumgänglich" => ["📌", "unumgänglich", "neutral", "Akzeptanz / Realität", "#64748b"],
    "unzugänglich" => ["🧊", "unzugänglich", "negativ", "Distanziertheit", "#6b7280"],
    "verantwortungsbewusst" => ["📘", "verantwortungsbewusst", "positiv", "Verantwortung", "#22c55e"],
    "verängstigt" => ["😰", "verängstigt", "negativ", "Angst", "#ef4444"],
    "verliebt" => ["💘", "verliebt", "positiv", "Liebe", "#ec4899"],
    "verständnisvoll" => ["🧠", "verständnisvoll", "positiv", "Empathie", "#22c55e"],
    "vertrauensvoll" => ["🤝", "vertrauensvoll", "positiv", "Vertrauen", "#22c55e"],
    "vertrauenswürdig" => ["🛡️", "vertrauenswürdig", "positiv", "Integrität", "#22c55e"],
    "verträumt" => ["🌙", "verträumt", "neutral", "Tagträumerei", "#a855f7"],
    "verwirrt" => ["🤔", "verwirrt", "neutral", "Unklarheit", "#6b7280"],
    "warmherzig" => ["🥵", "warmherzig", "positiv", "Wärme", "#f97316"],
    "wertlos" => ["🗑️", "wertlos", "negativ", "Selbstabwertung", "#4b5563"],
    "wertvoll" => ["💎", "wertvoll", "positiv", "Selbstwert / Bedeutung", "#22c55e"],
    "wirr" => ["😵", "wirr", "negativ", "Verwirrung", "#6b7280"],
    "wissbegierig" => ["🔍", "wissbegierig", "positiv", "Neugier / Lernen", "#0ea5e9"],
    "witzig" => ["🤣", "witzig", "positiv", "Freude / Humor", "#fbbf24"],
    "wütend" => ["😡", "wütend", "negativ", "Wut", "#b91c1c"],
    "zerbrechlich" => ["🥚", "zerbrechlich", "neutral", "Sensibilität", "#a855f7"],
    "zielstrebig" => ["🎯", "zielstrebig", "positiv", "Ambition", "#22c55e"],
    "zufrieden" => ["🙂", "zufrieden", "positiv", "Zufriedenheit", "#22c55e"],
    "zugewandt" => ["🤗", "zugewandt", "positiv", "Verbundenheit / Offenheit", "#f97316"],
    "zugeneigt" => ["👍", "zugeneigt", "positiv", "Sympathie", "#22c55e"],
    "zuverlässig" => ["⏱️", "zuverlässig", "positiv", "Verlässlichkeit", "#22c55e"],
    "zuversichtlich" => ["🌈", "zuversichtlich", "positiv", "Hoffnung / Zuversicht", "#22c55e"],
    "ängstlich" => ["😨", "ängstlich", "negativ", "Angst", "#ef4444"]
];

// Wissenschaftliche Beschreibungen (aus Python-Funktion extrahiert)
$scientificDescriptions = [
    "abgelehnt" => "Subjektives Erleben sozialer Exklusion; korreliert mit vermindertem Selbstwertgefühl und negativer Affektivität.",
    "abgelenkt" => "Defizit in der selektiven Aufmerksamkeit; Unfähigkeit, den kognitiven Fokus aufrechterhalten, bedingt durch externe/interne Störreize.",
    "abgeneigt" => "Einstellung der Distanzierung oder Aversion gegenüber einem Stimulus, ohne zwingend starke emotionale Erregung.",
    "abschreckend" => "Eigenschaft eines Stimulus, die Vermeidungsverhalten auslöst; assoziiert mit der Antizipation negativer Konsequenzen.",
    "absichtlos" => "Zustand fehlender volitionaler Ausrichtung oder Zielorientierung; Handeln ohne explizite kognitive Intention.",
    "abstoßend" => "Starke Aversionsreaktion auf einen Reiz, oft gekoppelt mit dem Ekel-System oder moralischer Indignation.",
    "abtörnend" => "Umgangssprachlich für den Verlust sexueller oder romantischer Appetenz durch spezifische negative Reizeigenschaften.",
    "abwesend" => "Phänomenologische Dissoziation oder mangelnde mentale Präsenz im aktuellen situationalen Kontext.",
    "aggressiv" => "Verhaltensdisposition zur Schädigung anderer Organismen oder Objekte; hohe physiologische Erregung und Feindseligkeit.",
    "ahnungslos" => "Kognitiver Zustand des Nichtwissens; Mangel an Informationen oder Bewusstsein bezüglich relevanter Situationsfaktoren.",
    "aktiv" => "Zustand erhöhter psychophysiologischer Aktivierung (Arousal) und Handlungsbereitschaft; positiv korreliert mit Extraversion.",
    "albern" => "Verhalten, das soziale Normen spielerisch verletzt; Ausdruck von Ungezwungenheit und Regression in kindliche Muster.",
    "allwissend" => "Subjektive Überzeugung umfassender Kompetenz oder kognitiver Überlegenheit; oft assoziiert mit narzisstischen Tendenzen.",
    "angenehm" => "Zustand positiver Valenz und hedonischen Wohlbefindens; Abwesenheit aversiver Reize.",
    "angespannt" => "Erhöhter Muskeltonus und psychische Erregung in Antizipation von Stressoren oder Bedrohungen.",
    "antriebslos" => "Mangel an motivationaler Energie und Initiativkraft; Kernsymptom depressiver Syndrome (Avolition).",
    "anziehend" => "Positive Valenz eines Objekts/Subjekts, die Annäherungsverhalten (Approach Motivation) auslöst.",
    "arrogant" => "Übersteigertes Selbstwertgefühl, das sich in der Abwertung anderer und dominierendem Verhalten manifestiert.",
    "aufgeregt" => "Zustand hoher physiologischer Erregung (Arousal), der je nach Valenz als Vorfreude oder Nervosität erlebt wird.",
    "aufmerksam" => "Fokussierung kognitiver Ressourcen auf spezifische Reize (selektive Aufmerksamkeit) bei gleichzeitiger Hemmung von Störreizen.",
    "aufrichtig" => "Kongruenz zwischen innerem Erleben und kommuniziertem Verhalten; Ausdruck von Authentizität und Ehrlichkeit.",
    "ausgeglichen" => "Psychische Homöostase; Zustand emotionaler Stabilität und geringer Vulnerabilität gegenüber Stressoren.",
    "begeistert" => "Intensive positive Emotion mit hohem Arousal, gekennzeichnet durch Enthusiasmus und intrinsische Motivation.",
    "behutsam" => "Vorsichtiges, rücksichtsvolles Agieren zur Vermeidung negativer Konsequenzen für andere oder sich selbst.",
    "belastbar" => "Fähigkeit zur psychischen Widerstandskraft (Resilienz) gegenüber Stressoren ohne funktionale Einbußen.",
    "bescheiden" => "Realistische oder unterschätzende Selbsteinschätzung eigener Fähigkeiten; Verzicht auf soziale Dominanzsignale.",
    "beschämt" => "Selbstbezogene negative Emotion resultierend aus der Diskrepanz zwischen Ideal-Selbst und wahrgenommenem Verhalten.",
    "besonnen" => "Fähigkeit zur kognitiven Kontrolle von Impulsen zugunsten reflektierter Entscheidungsfindung (Prudenz).",
    "besorgt" => "Kognitive Antizipation potentieller negativer Ereignisse, begleitet von Unruhe und physiologischer Anspannung.",
    "chaotisch" => "Mangel an Struktur und Ordnung in kognitiven Prozessen oder externem Verhalten; oft assoziiert mit geringer Gewissenhaftigkeit.",
    "dankbar" => "Positive Emotion in Reaktion auf den Erhalt eines Benefits, verbunden mit prosozialer Motivation gegenüber dem Geber.",
    "demotiviert" => "Zustand reduzierter Handlungsbereitschaft aufgrund fehlender Anreize oder negativer Erfolgserwartung.",
    "demütig" => "Anerkennung der eigenen Begrenztheit und Abhängigkeit von äußeren Faktoren; Gegenteil von Hybris.",
    "depressiv" => "Anhaltender Zustand negativer Affektivität, Anhedonie und Hoffnungslosigkeit; klinisch relevantes Syndrom.",
    "desinteressiert" => "Fehlen von Neugier oder motivationaler Zuwendung gegenüber einem spezifischen Reiz oder Thema.",
    "desorientiert" => "Verlust der situativen Einordnung bezüglich Zeit, Ort, Person oder Situation; kognitive Konfusion.",
    "distanziert" => "Emotionale oder physische Rückzugstendenz; Vermeidung von Intimität oder sozialer Involvierung.",
    "dumm" => "Umgangssprachlich für kognitive Defizite in der Informationsverarbeitung oder Urteilsbildung.",
    "dynamisch" => "Hohes Maß an Energiefluss und Veränderungsbereitschaft; assoziiert mit Flexibilität und Aktivität.",
    "egoistisch" => "Fokussierung auf den eigenen Vorteil unter Inkaufnahme von Nachteilen für andere (Self-Interest Maximization).",
    "egozentrisch" => "Kognitive Unfähigkeit, die Perspektive anderer einzunehmen (Theory of Mind Defizit); Selbst als Referenzzentrum.",
    "ehrlich" => "Verhaltensdisposition zur wahrheitsgemäßen Kommunikation und Einhaltung normativer Standards.",
    "eifersüchtig" => "Komplexer emotionaler Zustand aus Angst vor Verlust einer Beziehung an einen Rivalen, oft gepaart mit Wut.",
    "eindrucksvoll" => "Eigenschaft eines Stimulus, starke kognitive oder emotionale Reaktionen (Bewunderung, Ehrfurcht) auszulösen.",
    "einfach gestrickt" => "Metapher für kognitive Simplizität oder geringe Komplexität in der Persönlichkeitsstruktur.",
    "emotional" => "Zustand erhöhter affektiver Reaktivität; Dominanz von Gefühlen über rein rationale Kognition.",
    "emotionslos" => "Zustand reduzierter affektiver Schwingungsfähigkeit (Affektverflachung) oder bewusste Unterdrückung von Emotionen.",
    "empathisch" => "Fähigkeit, emotionale Zustände anderer zu erkennen (kognitiv) und mitzufühlen (affektiv).",
    "energiegeladen" => "Subjektives Erleben hoher vitaler Kraft und Handlungsbereitschaft; hohes physiologisches Arousal.",
    "energisch" => "Zielgerichtetes, kraftvolles Handeln mit hoher Durchsetzungsfähigkeit und Willenskraft.",
    "engagiert" => "Hohe motivationale Identifikation und Einsatzbereitschaft für eine Aufgabe oder ein Ziel (Commitment).",
    "entspannt" => "Zustand reduzierter physiologischer Erregung und muskulärer Spannung; Dominanz des Parasympathikus.",
    "enttäuscht" => "Negative Emotion resultierend aus der Diskrepanz zwischen Erwartung und real eingetretenem Ergebnis.",
    "erleichtert" => "Positive Emotion nach dem Wegfall einer antizipierten Bedrohung oder Belastung (Relief).",
    "ermutigt" => "Steigerung der Selbstwirksamkeitserwartung durch externen Zuspruch oder Erfolgserlebnisse.",
    "ermüdet" => "Physischer oder kognitiver Erschöpfungszustand mit reduziertem Leistungsvermögen und Ruhebedürfnis.",
    "ernsthaft" => "Fokussierte, gewissenhafte Grundhaltung ohne spielerische oder ironische Elemente.",
    "erotisch" => "Reizqualität, die sexuelles Begehren oder sinnliche Erregung stimuliert.",
    "erschöpft" => "Zustand vollständiger Ressourcenentleerung (Burnout-nahe) mit Unfähigkeit zur weiteren Leistungsabgabe.",
    "fair" => "Verhalten, das auf Gerechtigkeitsprinzipien (Equity, Equality) und Unparteilichkeit basiert.",
    "fantasievoll" => "Fähigkeit zur Generierung origineller mentaler Bilder und divergentes Denken (Kreativität).",
    "fleißig" => "Hohe Ausprägung von Gewissenhaftigkeit, gekennzeichnet durch Ausdauer und Arbeitsdisziplin.",
    "flexibel" => "Fähigkeit zur schnellen Anpassung kognitiver Schemata oder Verhaltensweisen an wechselnde Umweltbedingungen.",
    "fokussiert" => "Zustand gebündelter Aufmerksamkeit auf einen spezifischen Stimulus unter Ausblendung von Distraktoren (Flow-nah).",
    "freundlich" => "Prosoziale Verhaltensdisposition, gekennzeichnet durch Wohlwollen und Kooperationsbereitschaft.",
    "friedlich" => "Zustand der Konfliktfreiheit und inneren Ruhe; Abwesenheit von Aggression.",
    "fröhlich" => "Zustand heiterer Stimmung und positiver Affektivität, oft begleitet von Lachen und Extraversion.",
    "frustriert" => "Negative Emotion bei Blockierung eines zielgerichteten Verhaltens oder Nichterreichung eines Ziels.",
    "fürsorglich" => "Motivation und Verhalten, das auf den Schutz und das Wohlergehen anderer ausgerichtet ist (Caregiving).",
    "geduldig" => "Fähigkeit zum Belohnungsaufschub (Delay of Gratification) und Ertragen von Wartezeiten ohne negative Affekte.",
    "gechillt" => "Umgangssprachlich für einen Zustand tiefer Entspannung und Gelassenheit.",
    "geerdet" => "Metaphorisch für psychische Stabilität, Realitätssinn und Verbundenheit mit dem Hier und Jetzt.",
    "gehorsam" => "Bereitschaft, den Anweisungen einer Autorität oder Regeln Folge zu leisten (Compliance).",
    "gelangweilt" => "Unangenehmer Zustand niedrigen Arousals durch Mangel an stimulierenden Reizen (Underload).",
    "gelassen" => "Fähigkeit, emotionale Fassung und Ruhe auch in stressreichen Situationen zu bewahren (Equanimity).",
    "gemein" => "Verhalten, das darauf abzielt, anderen physischen oder psychischen Schmerz zuzufügen (Hostilität).",
    "genügsam" => "Einstellung der Zufriedenheit mit geringen materiellen oder sozialen Ressourcen; Anspruchslosigkeit.",
    "gereizt" => "Niedrige Reizschwelle für Ärgerreaktionen; Zustand erhöhter emotionaler Labilität und Aggressionsbereitschaft.",
    "gerissen" => "Einsatz von Täuschung oder Manipulation zur Erreichung eigener Ziele (Machiavellismus).",
    "geschwätzig" => "Tendenz zu übermäßiger verbaler Kommunikation, oft mit geringem Informationsgehalt.",
    "gesellig" => "Präferenz für soziale Interaktion und Gemeinschaft; Merkmal der Extraversion.",
    "gesprächig" => "Hohe verbale Kommunikationsbereitschaft und Mitteilungsbedürfnis.",
    "gestresst" => "Zustand der Überlastung, wenn Anforderungen die verfügbaren Bewältigungsressourcen übersteigen.",
    "gewissenhaft" => "Persönlichkeitsmerkmal, das Ordnungsliebe, Zuverlässigkeit und Pflichtbewusstsein umfasst.",
    "gewöhnlich" => "Entsprechung der statistischen Norm oder sozialen Konvention; Unauffälligkeit.",
    "großzügig" => "Bereitschaft, Ressourcen (Zeit, Geld, Emotionen) ohne unmittelbare Gegenleistung zu teilen.",
    "harmoniebedürftig" => "Starkes Motiv, Konflikte zu vermeiden und positive soziale Beziehungen aufrechtzuerhalten.",
    "hektisch" => "Zustand ungerichteter motorischer und kognitiver Unruhe unter Zeitdruck.",
    "herzlich" => "Ausdruck warmer, authentischer Zuneigung und emotionaler Offenheit in der Interaktion.",
    "hilfsbereit" => "Prosoziales Verhalten, das darauf abzielt, die Situation anderer zu verbessern.",
    "hinterhältig" => "Verdeckte Aggression; Schädigung anderer unter dem Deckmantel der Harmlosigkeit.",
    "hoffnungslos" => "Überzeugung, dass negative Zustände unveränderbar sind; Kernmerkmal der Depression.",
    "hoffnungsvoll" => "Positive Erwartungshaltung bezüglich zukünftiger Ereignisse und der eigenen Bewältigungskompetenz.",
    "humorvoll" => "Fähigkeit, Inkongruenzen kognitiv zu verarbeiten und belohnende Heiterkeit zu erleben/erzeugen.",
    "illoyal" => "Verletzung von Treueerwartungen oder Gruppennormen zugunsten eigener Interessen.",
    "impulsiv" => "Neigung zu spontanem Handeln ohne vorherige Reflexion der Konsequenzen; geringe Inhibitionskontrolle.",
    "intelligent" => "Fähigkeit zu schlussfolgerndem Denken, Problemlösen und schneller Informationsverarbeitung (g-Faktor).",
    "interessiert" => "Zustand kognitiver Zuwendung und Neugier gegenüber einem Objekt oder Sachverhalt.",
    "isoliert" => "Objektiver oder subjektiver Zustand mangelnder sozialer Einbindung; Risikofaktor für Psychopathologie.",
    "kaltherzig" => "Mangel an Empathie und emotionaler Wärme im Umgang mit anderen (Callous-Unemotional Traits).",
    "kindisch" => "Verhalten, das nicht dem biologischen Alter entspricht; Regression auf frühere Entwicklungsstufen.",
    "klar" => "Zustand kognitiver Luzidität und Eindeutigkeit in Wahrnehmung und Kommunikation.",
    "konfrontativ" => "Bereitschaft, Konflikte direkt anzusprechen oder auszutragen; geringe Vermeidungstendenz.",
    "konzentriert" => "Willentliche Bündelung der Aufmerksamkeitsressourcen auf eine Tätigkeit.",
    "kooperativ" => "Zusammenarbeit zur Erreichung gemeinsamer Ziele; Basis für sozialen Austausch.",
    "kreativ" => "Fähigkeit zur Produktion von Ideen, die sowohl neuartig als auch nützlich/angemessen sind.",
    "launig" => "Unvorhersehbare Wechsel der Stimmungslage (emotionale Labilität) ohne klaren äußeren Anlass.",
    "lebendig" => "Ausdruck hoher Vitalität, Reaktivität und emotionaler Expressivität.",
    "liebevoll" => "Verhalten, das durch tiefe Zuneigung, Fürsorge und emotionale Wärme gekennzeichnet ist.",
    "loyal" => "Beständige emotionale und verhaltensmäßige Verbundenheit gegenüber Personen oder Gruppen.",
    "lustig" => "Eigenschaft, die positive Emotionen (Amüsement) auslöst; humorvoll oder komisch.",
    "lustlos" => "Mangel an hedonischem Interesse oder Motivation, eine Handlung auszuführen.",
    "manipulativ" => "Einsatz psychologischer Strategien zur Beeinflussung anderer zum eigenen Vorteil.",
    "melancholisch" => "Sanfte Form der Traurigkeit, oft verbunden mit Nachdenklichkeit und ästhetischem Empfinden.",
    "misstrauisch" => "Tendenz, die Motive anderer als böswillig zu interpretieren; geringes Vertrauen.",
    "motiviert" => "Zustand der Ausrichtung auf ein Ziel, gespeist durch intrinsische oder extrinsische Anreize.",
    "müde" => "Physiologisches Signal für Erholungsbedarf; Reduktion von Wachheit und kognitiver Leistung.",
    "naiv" => "Mangel an Erfahrung oder kritischem Urteilsvermögen; übermäßiges Vertrauen.",
    "nervös" => "Zustand innerer Unruhe und vegetativer Erregung in Erwartung einer Leistung oder Bedrohung.",
    "neugierig" => "Appetenzverhalten zur Exploration neuer Reize und Informationsgewinnung.",
    "normal" => "Zustand im Bereich des statistischen Mittels; psychische Unauffälligkeit.",
    "offen" => "Bereitschaft, sich auf neue Erfahrungen, Ideen oder Emotionen einzulassen (Openness to Experience).",
    "oppositionell" => "Widerstand gegen Autoritäten oder Regeln; oft Ausdruck von Autonomiebestreben oder Trotz.",
    "optimistisch" => "Generelle Erwartung positiver Ergebnisse; Attributionsstil, der Erfolg internal und stabil erklärt.",
    "orientiert" => "Kognitive Klarheit über die eigene Position im räumlichen, zeitlichen und sozialen Gefüge.",
    "panisch" => "Akute, überwältigende Angstreaktion mit Kontrollverlust und Fluchtimpulsen (Fight-or-Flight).",
    "passiv" => "Verhalten der Nicht-Aktion; Geschehenlassen von Ereignissen ohne eigenen Eingriff.",
    "planlos" => "Fehlen einer strukturierten Vorgehensweise oder Strategie zur Problemlösung.",
    "präsent" => "Zustand voller geistiger Wachheit und Aufmerksamkeit im aktuellen Moment (Achtsamkeit).",
    "rational" => "Dominanz logisch-analytischer Kognition über emotionale Impulse bei der Entscheidungsfindung.",
    "realistisch" => "Wahrnehmung und Beurteilung von Situationen basierend auf Fakten statt Wunschdenken.",
    "rebellisch" => "Aktiver Widerstand gegen bestehende Normen oder Machtstrukturen; Nonkonformismus.",
    "reflektiert" => "Fähigkeit zur Introspektion und kritischen Analyse des eigenen Erlebens und Verhaltens.",
    "reif" => "Entwicklungsstand, der durch emotionale Stabilität, Verantwortung und Weisheit gekennzeichnet ist.",
    "reizbar" => "Erhöhte Empfindlichkeit gegenüber Störungen; schnelle Auslösung von negativen Affekten.",
    "relaxt" => "Zustand der Entspannung und Gelassenheit; Abwesenheit von Stresssymptomen.",
    "resilient" => "Fähigkeit, Krisen durch Rückgriff auf persönliche und soziale Ressourcen zu bewältigen.",
    "resigniert" => "Aufgabe des Widerstands oder der Bemühung angesichts als unkontrollierbar erlebter Negativität.",
    "respektvoll" => "Haltung der Wertschätzung und Anerkennung der Würde/Grenzen anderer Personen.",
    "robust" => "Psychische Stabilität und Unempfindlichkeit gegenüber Belastungen.",
    "ruhig" => "Zustand niedrigen physiologischen Arousals und inneren Friedens.",
    "rückgratlos" => "Metaphorisch für Mangel an Charakterstärke, Prinzipientreue oder Durchsetzungsvermögen.",
    "rücksichtslos" => "Verfolgung eigener Ziele ohne Beachtung der negativen Konsequenzen für andere.",
    "rücksichtsvoll" => "Antizipation und Beachtung der Bedürfnisse anderer im eigenen Handeln.",
    "scharfsinnig" => "Fähigkeit zu präziser Analyse und schnellem Erfassen komplexer Zusammenhänge.",
    "schuldig" => "Moralische Emotion nach Verletzung eigener Werte oder sozialer Normen; induziert Wiedergutmachung.",
    "schüchtern" => "Soziale Gehemmtheit und Ängstlichkeit in Interaktionssituationen.",
    "schwach" => "Erleben mangelnder psychischer oder physischer Kraft zur Bewältigung von Anforderungen.",
    "selbstbewusst" => "Überzeugung von den eigenen Fähigkeiten und dem eigenen Wert; soziale Sicherheit.",
    "selbstherrlich" => "Autoritäres Verhalten basierend auf der Annahme eigener Unfehlbarkeit.",
    "selbstlos" => "Handeln zum Wohle anderer unter Zurückstellung eigener Interessen (Altruismus).",
    "selbstsicher" => "Vertrauen in die eigene Kompetenz und das Urteilsvermögen in sozialen Situationen.",
    "sensibel" => "Erhöhte Empfänglichkeit für sensorische oder emotionale Reize (Hochsensibilität).",
    "sexy" => "Ausstrahlung, die sexuelle Attraktivität signalisiert.",
    "sortiert" => "Zustand innerer Ordnung und kognitiver Strukturierung.",
    "souverän" => "Zustand überlegener Gelassenheit und Kompetenz in der Bewältigung von Situationen.",
    "spaßig" => "Auf Heiterkeit und Spiel ausgerichtete Verhaltensweise.",
    "spielverderberisch" => "Verhalten, das die Freude oder den Flow einer Gruppe stört.",
    "spontan" => "Ungeplantes, aus dem Moment entstehendes Handeln; Ausdruck von Flexibilität.",
    "stabil" => "Konstanz in Stimmung und Verhalten; geringe Anfälligkeit für Schwankungen.",
    "stolz" => "Positive Emotion über eigene Leistungen oder zugehörige Gruppen; stärkt den Selbstwert.",
    "streitsüchtig" => "Neigung, Konflikte aktiv zu suchen oder zu eskalieren (Quarrelsome).",
    "strukturiert" => "Organisierte Vorgehensweise; Vorhandensein klarer kognitiver oder verhaltensbezogener Pläne.",
    "stur" => "Rigides Festhalten an Meinungen oder Plänen trotz rationaler Gegenargumente.",
    "sympathisch" => "Eigenschaft, die bei anderen positive Zuneigung und Wohlwollen auslöst.",
    "träge" => "Schwerfälligkeit in Denken oder Handeln; Widerstand gegen Aktivierungsreize.",
    "transparent" => "Offenlegung der eigenen Motive und Prozesse; Durchschaubarkeit für andere.",
    "traurig" => "Primäremotion bei Verlust oder Misserfolg; Rückzug und gedrückte Stimmung.",
    "trostlos" => "Gefühl tiefer Verlassenheit und Leere; Abwesenheit von positiven Perspektiven.",
    "trotzig" => "Widerstand gegen Anforderungen als Reaktion auf wahrgenommene Freiheitseinschränkung (Reaktanz).",
    "überfordert" => "Zustand, in dem die Anforderungen die verfügbaren Bewältigungskapazitäten übersteigen.",
    "überheblich" => "Herablassendes Verhalten basierend auf einem Gefühl der Überlegenheit.",
    "überlastet" => "Objektives oder subjektives Zuviel an Aufgaben oder Reizen.",
    "übermütig" => "Überschwängliche Stimmung mit Tendenz zu riskantem oder normverletzendem Verhalten.",
    "überrascht" => "Kurzzeitige Reaktion auf unerwartete Reize; Unterbrechung laufender Prozesse zur Neuausrichtung.",
    "unausgeglichen" => "Schwankende Stimmungslage; Fehlen innerer Balance.",
    "undankbar" => "Fehlende Wertschätzung für erhaltene Unterstützung oder Vorteile.",
    "unfähig" => "Subjektives oder objektives Fehlen von Kompetenz zur Aufgabenbewältigung.",
    "unfair" => "Verletzung von Gerechtigkeitsnormen; Bevorzugung oder Benachteiligung ohne sachlichen Grund.",
    "ungeduldig" => "Unfähigkeit, Wartezeiten oder Verzögerungen ohne negative Emotionen zu ertragen.",
    "unklug" => "Entscheidung oder Handlung, die negative Konsequenzen ignoriert; mangelnde Weisheit.",
    "unkooperativ" => "Verweigerung der Zusammenarbeit oder Unterstützung gemeinsamer Ziele.",
    "unnahbar" => "Signalisieren von Distanz und fehlender emotionaler Verfügbarkeit.",
    "unruhig" => "Motorische oder innere Agitiertheit; Unfähigkeit zur Entspannung.",
    "unsympathisch" => "Auslösen von Aversion oder Ablehnung bei anderen Personen.",
    "unumgänglich" => "Akzeptanz einer Situation als faktisch notwendig und nicht vermeidbar.",
    "unzugänglich" => "Verschlossenheit gegenüber Kontaktangeboten oder neuen Informationen.",
    "verantwortungsbewusst" => "Bereitschaft, für die Konsequenzen eigenen Handelns einzustehen; Zuverlässigkeit.",
    "verängstigt" => "Zustand akuter Furcht und Bedrohungserleben.",
    "verliebt" => "Intensiver emotionaler Zustand der Zuneigung und Fixierung auf eine andere Person.",
    "verständnisvoll" => "Fähigkeit und Bereitschaft, die Perspektive und Gefühle anderer validierend anzunehmen.",
    "vertrauensvoll" => "Bereitschaft, sich in Abhängigkeit von anderen zu begeben in der Erwartung positiven Verhaltens.",
    "vertrauenswürdig" => "Eigenschaft, die Zuverlässigkeit und Integrität signalisiert; Basis für Vertrauen.",
    "verträumt" => "Zustand der Absorption in inneren Bildern und Fantasien; Dissoziation von der Außenwelt.",
    "verwirrt" => "Zustand der kognitiven Desorganisation und Unklarheit.",
    "warmherzig" => "Ausdruck von Freundlichkeit, Empathie und emotionaler Nähe.",
    "wertlos" => "Globales Gefühl der eigenen Unzulänglichkeit und Bedeutungslosigkeit.",
    "wertvoll" => "Erleben der eigenen Person oder einer Sache als bedeutsam und schützenswert.",
    "wirr" => "Desorganisierte Denk- oder Sprachmuster; fehlender roter Faden.",
    "wissbegierig" => "Intrinsische Motivation zum Erwerb neuen Wissens (Need for Cognition).",
    "witzig" => "Fähigkeit, Humor zu produzieren und andere zum Lachen zu bringen.",
    "wütend" => "Intensive emotionale Reaktion auf Frustration oder Bedrohung, oft mit Aggressionsimpuls.",
    "zerbrechlich" => "Hohe Vulnerabilität gegenüber Stressoren; geringe psychische Widerstandskraft.",
    "zielstrebig" => "Konsequente Ausrichtung des Handelns auf definierte Ziele; Persistenz.",
    "zufrieden" => "Zustand des Einverständnisses mit den aktuellen Lebensumständen; Bedürfnisbefriedigung.",
    "zugewandt" => "Aktive Ausrichtung der Aufmerksamkeit und Freundlichkeit auf ein Gegenüber.",
    "zugeneigt" => "Positive emotionale Präferenz für eine Person oder Sache.",
    "zuverlässig" => "Konsistenz im Verhalten; Einhaltung von Zusagen und Erwartungen.",
    "zuversichtlich" => "Glaube an den Erfolg eigener Handlungen oder einen positiven Ausgang (Selbstwirksamkeit).",
    "ängstlich" => "Generelle Tendenz, Situationen als bedrohlich zu bewerten; erhöhte Besorgnis."
];

// Kategorie-Mapping
$categoryMap = [
    "positiv" => 1,
    "negativ" => 2,
    "neutral" => 3
];

// Startfarben-Mapping (aus Python-Funktion)
function getStartColor($hexColor) {
    $colorMap = [
        "#b91c1c" => "#fee2e2", // Dunkelrot -> Hellrot
        "#ef4444" => "#fee2e2", // Rot -> Hellrot
        "#f97316" => "#ffedd5", // Orange -> Hellorange
        "#4b5563" => "#f3f4f6", // Dunkelgrau -> Hellgrau
        "#6b7280" => "#f3f4f6", // Grau -> Hellgrau
        "#9ca3af" => "#f3f4f6", // Hellgrau -> Sehr Hellgrau
        "#22c55e" => "#dcfce7", // Grün -> Hellgrün
        "#10b981" => "#d1fae5", // Smaragd -> Hell-Smaragd
        "#eab308" => "#fef9c3", // Gelb -> Hellgelb
        "#f59e0b" => "#fef3c7", // Amber -> Hellamber
        "#0ea5e9" => "#e0f2fe", // Hellblau -> Sehr Hellblau
        "#6366f1" => "#e0e7ff", // Indigo -> Hellindigo
        "#a855f7" => "#f3e8ff", // Lila -> Helllila
        "#ec4899" => "#fce7f3", // Pink -> Hellpink
        "#fbbf24" => "#fef3c7", // Gold -> Hellgold
        "#64748b" => "#f1f5f9"  // Slate -> Hellslate
    ];
    return $colorMap[$hexColor] ?? "#e5e7eb"; // Default Hellgrau
}

// 3. Daten importieren
echo "\n📥 Importiere Daten...\n";

// Sortiere nach Name
uksort($masterData, function($a, $b) {
    return strcasecmp($a, $b);
});

$imported = 0;
$updated = 0;
$errors = 0;

$stmtInsert = $pdo->prepare("
    INSERT INTO `mood_indicators` 
    (`id`, `name`, `color`, `sort_order`, `is_active`, `created_at`, `min_value`, `max_value`, `step_value`, `color_start`, `color_end`, `icon_url`, `category_id`, `description`)
    VALUES 
    (UUID(), ?, ?, ?, 1, NOW(), 1, 10, 0.5, ?, ?, ?, ?, ?)
");

$stmtUpdate = $pdo->prepare("
    UPDATE `mood_indicators` 
    SET `color` = ?, `sort_order` = ?, `min_value` = 1, `max_value` = 10, `step_value` = 0.5, 
        `color_start` = ?, `color_end` = ?, `icon_url` = ?, `category_id` = ?, `description` = ?
    WHERE `name` = ?
");

$sortOrder = 1;

foreach ($masterData as $name => $data) {
    $emoji = $data[0];
    $category = $data[2];
    $colorEnd = $data[4];
    $colorStart = getStartColor($colorEnd);
    $categoryId = $categoryMap[$category] ?? 3;
    $description = $scientificDescriptions[$name] ?? "";

    // Prüfe ob bereits vorhanden
    $checkStmt = $pdo->prepare("SELECT `id` FROM `mood_indicators` WHERE `name` = ?");
    $checkStmt->execute([$name]);
    $existing = $checkStmt->fetch();

    try {
        if ($existing) {
            // Update
            $stmtUpdate->execute([
                $colorEnd,
                $sortOrder,
                $colorStart,
                $colorEnd,
                $emoji,
                $categoryId,
                $description,
                $name
            ]);
            $updated++;
            echo "  ✓ Aktualisiert: $name\n";
        } else {
            // Insert
            $stmtInsert->execute([
                $name,
                $colorEnd,
                $sortOrder,
                $colorStart,
                $colorEnd,
                $emoji,
                $categoryId,
                $description
            ]);
            $imported++;
            echo "  ✅ Importiert: $name\n";
        }
        $sortOrder++;
    } catch (PDOException $e) {
        $errors++;
        echo "  ❌ Fehler bei '$name': " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Import abgeschlossen!\n";
echo "  - Importiert: $imported\n";
echo "  - Aktualisiert: $updated\n";
echo "  - Fehler: $errors\n";
echo "  - Gesamt: " . ($imported + $updated) . "\n";
