-- ============================================
-- AGREEMENTS MODUL - KOMPLETTE MIGRATION
-- ============================================
-- 
-- ANLEITUNG:
-- 1. Öffnen Sie Supabase Dashboard: https://supabase.com/dashboard
-- 2. Wählen Sie Ihr Stimmumeter-Projekt aus
-- 3. Gehen Sie zu "SQL Editor"
-- 4. Kopieren Sie diesen GESAMTEN Inhalt
-- 5. Fügen Sie ihn in den SQL Editor ein
-- 6. Klicken Sie auf "Run" oder drücken Sie Ctrl+Enter / Cmd+Enter
-- 7. Warten Sie auf "Success"
--
-- ============================================

-- ============================================
-- MIGRATION 1: AGREEMENTS SYSTEM ERSTELLEN
-- ============================================

-- 1. Agreement Titles Table
CREATE TABLE IF NOT EXISTS t_vereinbarungstitel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titel text NOT NULL,
  beschreibung text,
  erstellt_von_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Agreements Table
CREATE TABLE IF NOT EXISTS t_vereinbarungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titel_id uuid REFERENCES t_vereinbarungstitel(id) ON DELETE RESTRICT NOT NULL,
  inhalt text NOT NULL,
  ersteller_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empfaenger_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'Entwurf' CHECK (status IN ('Entwurf', 'Unterzeichnet', 'Archiviert')),
  version integer NOT NULL DEFAULT 1,
  parent_vereinbarung_id uuid REFERENCES t_vereinbarungen(id) ON DELETE SET NULL,
  unterzeichnet_am date,
  bearbeiter_von text,
  bearbeiter_an text,
  kurze_zusammenfassung text,
  anlagen text,
  unterzeichnungsdatum_ersteller date,
  unterzeichnungsdatum_empfaenger date,
  gueltigkeit_von date,
  gueltigkeit_bis date,
  kuendigungsfrist_wert integer,
  kuendigungsfrist_einheit text CHECK (kuendigungsfrist_einheit IN ('Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Agreement Logs Table
CREATE TABLE IF NOT EXISTS t_vereinbarungs_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vereinbarung_id uuid REFERENCES t_vereinbarungen(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aktion text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4. Placeholder Definitions Table
CREATE TABLE IF NOT EXISTS t_platzhalter_definitionen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platzhalter_schluessel text UNIQUE NOT NULL,
  beschreibung text NOT NULL,
  quell_tabelle text NOT NULL,
  quell_spalte text NOT NULL,
  zulaessige_rollen jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
ALTER TABLE t_vereinbarungstitel ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_vereinbarungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_vereinbarungs_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_platzhalter_definitionen ENABLE ROW LEVEL SECURITY;

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
  ('{{ersteller.username}}', 'Benutzername des Erstellers', 'auth.users', 'raw_user_meta_data->>username', '["admin", "user"]'::jsonb),
  ('{{ersteller.email}}', 'E-Mail-Adresse des Erstellers', 'auth.users', 'email', '["admin", "user"]'::jsonb),
  ('{{empfaenger.username}}', 'Benutzername des Empfängers', 'auth.users', 'raw_user_meta_data->>username', '["admin", "user"]'::jsonb),
  ('{{empfaenger.email}}', 'E-Mail-Adresse des Empfängers', 'auth.users', 'email', '["admin", "user"]'::jsonb),
  ('{{datum.heute}}', 'Aktuelles Datum', 'system', 'current_date', '["admin", "user", "public"]'::jsonb),
  ('{{datum.jahr}}', 'Aktuelles Jahr', 'system', 'current_year', '["admin", "user", "public"]'::jsonb)
ON CONFLICT (platzhalter_schluessel) DO NOTHING;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_t_vereinbarungstitel_updated_at ON t_vereinbarungstitel;
CREATE TRIGGER update_t_vereinbarungstitel_updated_at
  BEFORE UPDATE ON t_vereinbarungstitel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_t_vereinbarungen_updated_at ON t_vereinbarungen;
CREATE TRIGGER update_t_vereinbarungen_updated_at
  BEFORE UPDATE ON t_vereinbarungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_t_platzhalter_definitionen_updated_at ON t_platzhalter_definitionen;
CREATE TRIGGER update_t_platzhalter_definitionen_updated_at
  BEFORE UPDATE ON t_platzhalter_definitionen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 2: MENU ITEMS ERWEITERN
-- ============================================

-- Add new columns to menu_items
DO $$
BEGIN
  -- Add linked_agreement_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'linked_agreement_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN linked_agreement_id uuid REFERENCES t_vereinbarungen(id) ON DELETE SET NULL;
  END IF;

  -- Add slug column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'slug'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN slug text;
  END IF;

  -- Add icon column (optional, for future use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'icon'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN icon text;
  END IF;
END $$;

-- Create unique index on slug (allowing NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_slug_unique 
  ON menu_items(slug) 
  WHERE slug IS NOT NULL;

-- Create index on linked_agreement_id
CREATE INDEX IF NOT EXISTS idx_menu_items_linked_agreement 
  ON menu_items(linked_agreement_id) 
  WHERE linked_agreement_id IS NOT NULL;

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text text, exclude_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  slug_text text;
  counter integer := 0;
  final_slug text;
BEGIN
  -- Convert to lowercase and replace umlauts
  slug_text := lower(input_text);
  slug_text := replace(slug_text, 'ä', 'ae');
  slug_text := replace(slug_text, 'ö', 'oe');
  slug_text := replace(slug_text, 'ü', 'ue');
  slug_text := replace(slug_text, 'ß', 'ss');
  
  -- Remove special characters, keep only alphanumeric and spaces
  slug_text := regexp_replace(slug_text, '[^a-z0-9\s]', '', 'g');
  
  -- Replace spaces and multiple hyphens with single hyphen
  slug_text := regexp_replace(slug_text, '\s+', '-', 'g');
  slug_text := regexp_replace(slug_text, '-+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  slug_text := trim(both '-' from slug_text);
  
  -- Ensure slug is not empty
  IF slug_text = '' THEN
    slug_text := 'menu-item';
  END IF;
  
  -- Check for conflicts and append counter if needed
  final_slug := slug_text;
  WHILE EXISTS (
    SELECT 1 FROM menu_items 
    WHERE slug = final_slug 
    AND (exclude_id IS NULL OR id != exclude_id)
  ) LOOP
    counter := counter + 1;
    final_slug := slug_text || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug when linked_agreement_id is set
CREATE OR REPLACE FUNCTION auto_generate_menu_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if linked_agreement_id is set and slug is empty
  IF NEW.linked_agreement_id IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  
  -- If linked_agreement_id is removed, clear slug
  IF NEW.linked_agreement_id IS NULL THEN
    NEW.slug := NULL;
  END IF;
  
  -- If title changed and linked_agreement_id is set, regenerate slug
  IF TG_OP = 'UPDATE' AND NEW.linked_agreement_id IS NOT NULL AND OLD.title != NEW.title THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS trigger_auto_generate_menu_slug ON menu_items;
CREATE TRIGGER trigger_auto_generate_menu_slug
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_menu_slug();

-- Function to check if menu item is dynamic agreement (computed)
CREATE OR REPLACE FUNCTION is_dynamic_agreement(menu_item_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM menu_items
    WHERE id = menu_item_id
    AND linked_agreement_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment to columns
COMMENT ON COLUMN menu_items.linked_agreement_id IS 'References t_vereinbarungen.id. If set, this menu item displays the linked agreement document.';
COMMENT ON COLUMN menu_items.slug IS 'URL-friendly identifier for dynamic agreement routes. Auto-generated from title when linked_agreement_id is set.';
COMMENT ON COLUMN menu_items.icon IS 'Optional icon identifier for the menu item (e.g., icon name from icon library).';

-- ============================================
-- MIGRATION ABGESCHLOSSEN
-- ============================================
-- 
-- Prüfen Sie die Tabellen:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('t_vereinbarungstitel', 't_vereinbarungen', 't_vereinbarungs_logs', 't_platzhalter_definitionen');
--
-- Prüfen Sie die Menu-Items-Erweiterung:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'menu_items' 
-- AND column_name IN ('linked_agreement_id', 'slug', 'icon');
--
-- ============================================

