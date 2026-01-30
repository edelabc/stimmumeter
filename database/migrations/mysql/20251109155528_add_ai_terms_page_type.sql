/*
  # Add AI Terms Page Type

  1. Changes
    - Alter legal_pages table CHECK constraint to include 'ai-terms' page type
    - Insert default AI terms page content

  2. Security
    - Uses existing RLS policies
*/

-- Drop old constraint and add new one with ai-terms
ALTER TABLE legal_pages DROP CONSTRAINT IF EXISTS legal_pages_page_type_check;

ALTER TABLE legal_pages ADD CONSTRAINT legal_pages_page_type_check
  CHECK (page_type = ANY (ARRAY['impressum'::text, 'dsgvo'::text, 'cookies'::text, 'datenschutz'::text, 'ai-terms'::text]));

-- Insert default AI terms page
INSERT INTO legal_pages (page_type, title, content, is_active)
VALUES (
  'ai-terms',
  'KI-Nutzungsbedingungen',
  E'# KI-Nutzungsbedingungen\n\n## 1. Allgemeine Bestimmungen\n\nDurch die Nutzung unserer KI-gestützten Stimmungsanalyse-Funktionen erklären Sie sich mit den folgenden Bedingungen einverstanden.\n\n## 2. Datenverarbeitung\n\n### 2.1 Verarbeitete Daten\n- Ihre Stimmungsdaten werden an den von Ihnen ausgewählten KI-Provider übermittelt\n- Dies umfasst: Stimmungswerte, Notizen, Zeitstempel und Pseudonym-Informationen\n- Die Daten werden ausschließlich zur Analyse und Prognose verwendet\n\n### 2.2 Datenschutz\n- Ihre API-Schlüssel werden verschlüsselt gespeichert\n- Wir geben keine Daten ohne Ihre ausdrückliche Zustimmung weiter\n- Sie können Ihre Daten jederzeit löschen\n\n## 3. KI-Provider\n\n### 3.1 Unterstützte Provider\n- OpenAI (GPT-Modelle)\n- Google Gemini\n- Anthropic Claude\n- xAI (Grok)\n- Manus AI\n\n### 3.2 Verantwortung\n- Sie sind selbst verantwortlich für die Einhaltung der Nutzungsbedingungen des jeweiligen Providers\n- Sie tragen die Kosten für API-Anfragen an Ihren Provider\n- Wir übernehmen keine Haftung für Ausfälle oder Fehler der Provider\n\n## 4. Nutzungsrechte\n\n### 4.1 Ihre Rechte\n- Sie behalten alle Rechte an Ihren Daten\n- KI-Analysen und Prognosen gehören Ihnen\n- Sie können die KI-Funktionen jederzeit deaktivieren\n\n### 4.2 Unsere Rechte\n- Wir behalten uns das Vor, KI-Provider zu deaktivieren\n- Wir können diese Bedingungen jederzeit anpassen\n- Änderungen werden Ihnen mitgeteilt\n\n## 5. Haftungsausschluss\n\n### 5.1 KI-Prognosen\n- KI-Analysen sind Prognosen und keine medizinischen Diagnosen\n- Sie ersetzen keine professionelle psychologische Beratung\n- Wir übernehmen keine Haftung für Entscheidungen basierend auf KI-Prognosen\n\n### 5.2 Technische Verfügbarkeit\n- Wir garantieren keine ununterbrochene Verfügbarkeit\n- KI-Provider können ausfallen oder Wartungsarbeiten durchführen\n- Wir haften nicht für Datenverlust oder -beschädigung\n\n## 6. Datensicherheit\n\n### 6.1 Sicherheitsmaßnahmen\n- Verschlüsselte Übertragung aller Daten\n- Sichere Speicherung von API-Schlüsseln\n- Regelmäßige Sicherheitsupdates\n\n### 6.2 Ihre Pflichten\n- Halten Sie Ihre API-Schlüssel geheim\n- Melden Sie Sicherheitsvorfälle umgehend\n- Nutzen Sie sichere Passwörter\n\n## 7. Beendigung der Nutzung\n\nSie können die KI-Nutzung jederzeit beenden durch:\n- Deaktivierung aller KI-Konfigurationen\n- Löschen Ihrer API-Schlüssel\n- Löschen Ihres Accounts\n\n## 8. Kontakt\n\nBei Fragen zu diesen Bedingungen kontaktieren Sie uns über die im Impressum angegebenen Kontaktdaten.\n\n## 9. Änderungen\n\nDiese Bedingungen wurden zuletzt aktualisiert am: ' || CURRENT_DATE || E'\n\nWir behalten uns vor, diese Bedingungen jederzeit zu ändern. Bei wesentlichen Änderungen werden Sie informiert.',
  true
)
ON DUPLICATE KEY UPDATE page_type = page_type;