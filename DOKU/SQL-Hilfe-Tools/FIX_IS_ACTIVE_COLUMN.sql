-- ============================================
-- QUICK FIX: gesperrt Feld zu t_vereinbarungstitel hinzufügen
-- ============================================
-- 
-- Führen Sie dieses Script in Supabase SQL Editor aus, um das fehlende Feld hinzuzufügen.
-- ============================================

-- Füge gesperrt Feld hinzu (nur wenn es noch nicht existiert)
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS gesperrt boolean NOT NULL DEFAULT false;

-- Kommentar hinzufügen
COMMENT ON COLUMN t_vereinbarungstitel.gesperrt IS 
  'Gibt an, ob der Dokumenten-Titel gesperrt ist. Gesperrte Titel können nicht gelöscht oder in neuen Vereinbarungen verwendet werden.';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_gesperrt 
ON t_vereinbarungstitel(gesperrt);

-- ============================================
-- FERTIG!
-- ============================================

