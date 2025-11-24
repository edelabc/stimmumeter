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

-- Index für bessere Performance bei Filtern - nur wenn er noch nicht existiert
CREATE INDEX IF NOT EXISTS idx_vereinbarungstitel_is_active 
ON t_vereinbarungstitel(is_active);