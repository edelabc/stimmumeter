/*
  # Create Cookie Consent Agreement System

  1. New Data
    - Create agreement title for Cookie Settings
    - Create initial cookie consent agreement with EU-compliant content
    - Make it versionable and updateable through admin interface
  
  2. Security
    - Public read access for cookie consent
    - Only admins can modify
*/

-- Create agreement title and content for Cookie Settings
DO $$
DECLARE
  v_titel_id uuid;
  v_user_id uuid;
BEGIN
  -- Get a user ID (use first admin or first user)
  SELECT user_id INTO v_user_id FROM admin_users LIMIT 1;
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;
  
  -- Create agreement title for Cookie Settings (only if not exists)
  IF NOT EXISTS (SELECT 1 FROM t_vereinbarungstitel WHERE titel = 'Cookie-Einstellungen') THEN
    INSERT INTO t_vereinbarungstitel (titel, beschreibung, gesperrt, erstellt_von_user_id)
    VALUES (
      'Cookie-Einstellungen',
      'Cookie- und Tracking-Einstellungen für die Webseite',
      false,
      v_user_id
    )
    RETURNING id INTO v_titel_id;
  ELSE
    SELECT id INTO v_titel_id FROM t_vereinbarungstitel WHERE titel = 'Cookie-Einstellungen';
  END IF;
  
  -- Only insert agreement if no agreement exists for this title
  IF NOT EXISTS (SELECT 1 FROM t_vereinbarungen WHERE titel_id = v_titel_id) THEN
    INSERT INTO t_vereinbarungen (
      titel_id,
      version,
      inhalt,
      gueltigkeit_von,
      status,
      ersteller_user_id
    ) VALUES (
      v_titel_id,
      1,
      E'# Cookie-Einstellungen

## Notwendige Cookies

Diese Cookies sind für die grundlegende Funktionalität der Webseite erforderlich und können nicht deaktiviert werden.

### Technisch notwendige Cookies:
- **Session-Cookie**: Speichert Ihre Sitzungsinformationen
- **Authentifizierung**: Ermöglicht Ihnen den Login
- **Cookie-Einstellungen**: Speichert Ihre Cookie-Präferenzen

## Funktionale Cookies

Diese Cookies ermöglichen erweiterte Funktionalität und Personalisierung.

### Funktionale Cookies:
- **Spracheinstellungen**: Speichert Ihre bevorzugte Sprache
- **UI-Präferenzen**: Merkt sich Ihre Anzeigeeinstellungen
- **Formular-Daten**: Speichert Eingaben für eine bessere Benutzererfahrung

## Analyse-Cookies

Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Webseite interagieren.

### Analyse-Cookies:
- **Nutzungsstatistiken**: Anonymisierte Daten über Seitenaufrufe
- **Performance-Monitoring**: Hilft uns, die Webseite zu optimieren
- **Fehlerberichterstattung**: Ermöglicht uns, technische Probleme zu beheben

## Marketing-Cookies

Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen.

### Marketing-Cookies:
- **Werbe-Tracking**: Ermöglicht personalisierte Werbung
- **Social Media**: Integration von Social-Media-Funktionen
- **Conversion-Tracking**: Misst die Effektivität unserer Marketingkampagnen

## Ihre Rechte

Sie haben jederzeit das Recht:
- Ihre Cookie-Einstellungen zu ändern
- Cookies zu löschen
- Der Verwendung von Cookies zu widersprechen

Sie können Ihre Einstellungen jederzeit in den Cookie-Einstellungen anpassen.

## Weitere Informationen

Weitere Informationen zur Datenverarbeitung finden Sie in unserer [Datenschutzerklärung](/agreement/datenschutz).

**Letzte Aktualisierung**: ' || CURRENT_DATE,
      CURRENT_DATE,
      'Entwurf',
      v_user_id
    );
  END IF;
END $$;

