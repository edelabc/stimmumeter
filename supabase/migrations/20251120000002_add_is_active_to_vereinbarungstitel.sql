-- ============================================
-- MIGRATION: is_active Feld zu t_vereinbarungstitel hinzufügen
-- ============================================
-- 
-- Zweck: Ermöglicht das Sperren/Entsperren von Dokumenten-Titeln
-- Datum: 2025-11-20
-- 
-- Diese Migration fügt das is_active Feld zu bestehenden Tabellen hinzu.
-- Neue Tabellen sollten das Feld bereits in der CREATE TABLE Statement haben.
-- ============================================

-- Füge is_active Feld hinzu (Standard: true) - nur wenn es noch nicht existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 't_vereinbarungstitel' 
    AND column_name = 'is_active'
  ) THEN
    -- Füge Spalte hinzu
    ALTER TABLE t_vereinbarungstitel 
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    
    -- Kommentar hinzufügen
    COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
      'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';
    
    RAISE NOTICE 'Spalte is_active wurde erfolgreich zu t_vereinbarungstitel hinzugefügt.';
  ELSE
    RAISE NOTICE 'Spalte is_active existiert bereits in t_vereinbarungstitel.';
  END IF;
END $$;

-- Index für bessere Performance bei Filtern - nur wenn er noch nicht existiert
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);
