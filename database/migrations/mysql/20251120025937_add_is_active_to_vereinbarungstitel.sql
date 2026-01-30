-- ============================================
-- QUICK FIX: is_active Feld zu t_vereinbarungstitel hinzufügen
-- ============================================
-- 
-- Führen Sie dieses Script in Supabase SQL Editor aus, um das fehlende Feld hinzuzufügen.
-- ============================================

-- Füge is_active Feld hinzu (nur wenn es noch nicht existiert)
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1;

-- Kommentar hinzufügen
COMMENT ON COLUMN t_vereinbarungstitel.is_active IS 
  'Gibt an, ob der Dokumenten-Titel aktiv ist. Gesperrte Titel können nicht in neuen Vereinbarungen verwendet werden.';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);

-- ============================================
-- FERTIG!
-- ============================================