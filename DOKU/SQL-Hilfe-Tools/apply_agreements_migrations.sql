-- ============================================
-- AGREEMENTS MODUL - MIGRATIONEN AUSFÜHREN
-- ============================================
-- 
-- Anleitung:
-- 1. Öffnen Sie Supabase Dashboard
-- 2. Gehen Sie zu "SQL Editor"
-- 3. Kopieren Sie diesen gesamten Inhalt
-- 4. Führen Sie das Script aus
--
-- ODER verwenden Sie Supabase CLI:
-- supabase db push
-- ============================================

-- Migration 1: Agreements System erstellen
\i supabase/migrations/20251120000000_create_agreements_system.sql

-- Migration 2: Menu Items erweitern
\i supabase/migrations/20251120000001_extend_menu_items_for_agreements.sql

-- ============================================
-- ALTERNATIV: Direkt ausführen (kopieren Sie den Inhalt der Migration-Dateien hier)
-- ============================================

