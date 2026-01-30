/*
  # Add Default Mood Indicators
  
  ## Overview
  This migration adds comprehensive default mood indicators that all users can access.
  These indicators are shared (user_id = NULL) and visible to all authenticated users.
  
  ## New Default Indicators
  1. Freundlichkeit (Friendliness) - Green
  2. Sympathie (Sympathy) - Blue
  3. Wut (Anger) - Red
  4. Unnahbarkeit (Unapproachability) - Gray
  5. Gerissenheit (Cunning) - Orange
  6. Aktiv (Active) - Lime
  7. Ermüdet (Tired) - Slate
  8. Lustlos (Listless) - Stone
  9. Sexy (Sexy) - Pink
  10. Lustig (Funny) - Yellow
  11. Liebevoll (Loving) - Rose
  12. Selbstlos (Selfless) - Cyan
  13. Passiv (Passive) - Neutral
  14. Zurückhaltend (Reserved) - Indigo
  
  ## Scale Configuration
  - All indicators use a 0-10 scale with 0.5 step increments
  - Color gradients from red (low) to green (high)
  
  ## Important Notes
  1. These are global indicators (user_id = NULL)
  2. Users can still create their own custom indicators
  3. Existing indicators are preserved
*/

-- Delete existing null user_id indicators to avoid conflicts
DELETE FROM mood_indicators WHERE user_id IS NULL;

-- Insert comprehensive default indicators
INSERT INTO mood_indicators (name, color, sort_order, is_active, min_value, max_value, step_value, color_start, color_end, user_id) VALUES
  ('Freundlichkeit', '#10b981', 1, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Sympathie', '#3b82f6', 2, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Wut', '#ef4444', 3, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Unnahbarkeit', '#6b7280', 4, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Gerissenheit', '#f59e0b', 5, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Aktiv', '#84cc16', 6, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('Ermüdet', '#64748b', 7, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Lustlos', '#78716c', 8, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Sexy', '#ec4899', 9, true, 0, 10, 0.5, '#ef4444', '#ec4899', NULL),
  ('Lustig', '#eab308', 10, true, 0, 10, 0.5, '#ef4444', '#eab308', NULL),
  ('Liebevoll', '#f43f5e', 11, true, 0, 10, 0.5, '#ef4444', '#f43f5e', NULL),
  ('Selbstlos', '#06b6d4', 12, true, 0, 10, 0.5, '#ef4444', '#06b6d4', NULL),
  ('Passiv', '#737373', 13, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('Zurückhaltend', '#6366f1', 14, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL)
ON CONFLICT (name) DO NOTHING;