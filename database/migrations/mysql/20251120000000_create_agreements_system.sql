/*
  # Agreements System (Dokumenten-Modul)

  ## Overview
  This migration creates a complete agreements/document management system with:
  - Agreement titles (Vereinbarungstitel)
  - Agreements (Vereinbarungen) with versioning
  - Agreement logs (Aktionsprotokoll)
  - Placeholder definitions (Platzhalter-Definitionen)
  - Dynamic menu linking to agreements

  ## New Tables

  ### 1. `t_vereinbarungstitel` (Agreement Titles)
  - `id` (uuid, primary key)
  - `titel` (text) - Title of the agreement type
  - `beschreibung` (text) - Description
  - `erstellt_von_user_id` (uuid, references auth.users)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 2. `t_vereinbarungen` (Agreements)
  - `id` (uuid, primary key)
  - `titel_id` (uuid, references t_vereinbarungstitel)
  - `inhalt` (text) - HTML content with placeholders
  - `ersteller_user_id` (uuid, references auth.users)
  - `empfaenger_user_id` (uuid, references auth.users, nullable for public docs)
  - `status` (text) - 'Entwurf', 'Unterzeichnet', 'Archiviert'
  - `version` (INT) - Version number
  - `parent_vereinbarung_id` (uuid, self-reference for versioning)
  - `unterzeichnet_am` (date)
  - `bearbeiter_von` (text)
  - `bearbeiter_an` (text)
  - `kurze_zusammenfassung` (text)
  - `anlagen` (text)
  - `unterzeichnungsdatum_ersteller` (date)
  - `unterzeichnungsdatum_empfaenger` (date)
  - `gueltigkeit_von` (date)
  - `gueltigkeit_bis` (date)
  - `kuendigungsfrist_wert` (INT)
  - `kuendigungsfrist_einheit` (text) - 'Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre'
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ### 3. `t_vereinbarungs_logs` (Agreement Logs)
  - `id` (uuid, primary key)
  - `vereinbarung_id` (uuid, references t_vereinbarungen)
  - `user_id` (uuid, references auth.users)
  - `aktion` (text) - Action type
  - `details` (JSON) - Additional details
  - `created_at` (DATETIME)

  ### 4. `t_platzhalter_definitionen` (Placeholder Definitions)
  - `id` (uuid, primary key)
  - `platzhalter_schluessel` (text, unique) - Placeholder key (e.g., '{{ersteller.username}}')
  - `beschreibung` (text) - Description
  - `quell_tabelle` (text) - Source table
  - `quell_spalte` (text) - Source column
  - `zulaessige_rollen` (JSON) - Allowed roles
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

  ## Security
  - Enable RLS on all tables
  - Admins can manage all agreements
  - Users can view public agreements
  - Users can manage their own agreements
*/

-- 1. Agreement Titles Table
CREATE TABLE IF NOT EXISTS t_vereinbarungstitel (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  titel text NOT NULL,
  beschreibung text,
  erstellt_von_user_id CHAR(36) REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agreements Table
CREATE TABLE IF NOT EXISTS t_vereinbarungen (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  titel_id CHAR(36) REFERENCES t_vereinbarungstitel(id) ON DELETE RESTRICT NOT NULL,
  inhalt text NOT NULL,
  ersteller_user_id CHAR(36) REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empfaenger_user_id CHAR(36) REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'Entwurf' CHECK (status IN ('Entwurf', 'Unterzeichnet', 'Archiviert')),
  version INT NOT NULL DEFAULT 1,
  parent_vereinbarung_id CHAR(36) REFERENCES t_vereinbarungen(id) ON DELETE SET NULL,
  unterzeichnet_am date,
  bearbeiter_von text,
  bearbeiter_an text,
  kurze_zusammenfassung text,
  anlagen text,
  unterzeichnungsdatum_ersteller date,
  unterzeichnungsdatum_empfaenger date,
  gueltigkeit_von date,
  gueltigkeit_bis date,
  kuendigungsfrist_wert INT,
  kuendigungsfrist_einheit text CHECK (kuendigungsfrist_einheit IN ('Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Agreement Logs Table
CREATE TABLE IF NOT EXISTS t_vereinbarungs_logs (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  vereinbarung_id CHAR(36) REFERENCES t_vereinbarungen(id) ON DELETE CASCADE NOT NULL,
  user_id CHAR(36) REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aktion text NOT NULL,
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Placeholder Definitions Table
CREATE TABLE IF NOT EXISTS t_platzhalter_definitionen (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  platzhalter_schluessel text UNIQUE NOT NULL,
  beschreibung text NOT NULL,
  quell_tabelle text NOT NULL,
  quell_spalte text NOT NULL,
  zulaessige_rollen JSON NOT NULL DEFAULT '[]'::JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungen_titel_id ON t_vereinbarungen(titel_id);
CREATE INDEX IF NOT EXISTS idx_vereinbarungen_ersteller ON t_vereinbarungen(ersteller_user_id);
CREATE INDEX IF NOT EXISTS idx_vereinbarungen_empfaenger ON t_vereinbarungen(empfaenger_user_id);
CREATE INDEX IF NOT EXISTS idx_vereinbarungen_parent ON t_vereinbarungen(parent_vereinbarung_id);
CREATE INDEX IF NOT EXISTS idx_vereinbarungen_status ON t_vereinbarungen(status);
CREATE INDEX IF NOT EXISTS idx_vereinbarungs_logs_vereinbarung ON t_vereinbarungs_logs(vereinbarung_id);
CREATE INDEX IF NOT EXISTS idx_vereinbarungs_logs_user ON t_vereinbarungs_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_platzhalter_schluessel ON t_platzhalter_definitionen(platzhalter_schluessel);

-- Enable RLS

-- RLS Policies for t_vereinbarungstitel
CREATE POLICY "Admins can view all agreement titles"
  ON t_vereinbarungstitel FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert agreement titles"
  ON t_vereinbarungstitel FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update agreement titles"
  ON t_vereinbarungstitel FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete agreement titles"
  ON t_vereinbarungstitel FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for t_vereinbarungen
CREATE POLICY "Admins can view all agreements"
  ON t_vereinbarungen FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view published agreements"
  ON t_vereinbarungen FOR SELECT
  TO public
  USING (status = 'Unterzeichnet');

CREATE POLICY "Users can view their own agreements"
  ON t_vereinbarungen FOR SELECT
  TO authenticated
  USING (
    ersteller_user_id = auth.uid() OR empfaenger_user_id = auth.uid()
  );

CREATE POLICY "Admins can insert agreements"
  ON t_vereinbarungen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update agreements"
  ON t_vereinbarungen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete agreements"
  ON t_vereinbarungen FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for t_vereinbarungs_logs
CREATE POLICY "Admins can view all agreement logs"
  ON t_vereinbarungs_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view logs for their agreements"
  ON t_vereinbarungs_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_vereinbarungen
      WHERE t_vereinbarungen.id = t_vereinbarungs_logs.vereinbarung_id
      AND (t_vereinbarungen.ersteller_user_id = auth.uid() OR t_vereinbarungen.empfaenger_user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can insert agreement logs"
  ON t_vereinbarungs_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for t_platzhalter_definitionen
CREATE POLICY "Anyone can view placeholder definitions"
  ON t_platzhalter_definitionen FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage placeholder definitions"
  ON t_platzhalter_definitionen FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Insert default placeholder definitions
INSERT INTO t_platzhalter_definitionen (platzhalter_schluessel, beschreibung, quell_tabelle, quell_spalte, zulaessige_rollen)
VALUES
  ('{{ersteller.username}}', 'Benutzername des Erstellers', 'auth.users', 'raw_user_meta_data->>username', '["admin", "user"]'::JSON),
  ('{{ersteller.email}}', 'E-Mail-Adresse des Erstellers', 'auth.users', 'email', '["admin", "user"]'::JSON),
  ('{{empfaenger.username}}', 'Benutzername des Empfängers', 'auth.users', 'raw_user_meta_data->>username', '["admin", "user"]'::JSON),
  ('{{empfaenger.email}}', 'E-Mail-Adresse des Empfängers', 'auth.users', 'email', '["admin", "user"]'::JSON),
  ('{{datum.heute}}', 'Aktuelles Datum', 'system', 'current_date', '["admin", "user", "public"]'::JSON),
  ('{{datum.jahr}}', 'Aktuelles Jahr', 'system', 'current_year', '["admin", "user", "public"]'::JSON)
ON DUPLICATE KEY UPDATE platzhalter_schluessel = platzhalter_schluessel;

-- Create updated_at trigger function (if not exists)

-- Add updated_at triggers