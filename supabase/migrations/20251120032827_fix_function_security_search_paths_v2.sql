/*
  # Fix Function Security - Set Secure Search Paths (v2)

  ## Overview
  Drop and recreate functions with secure search_path set.

  ## Changes
  Update key functions to prevent search_path manipulation security issues.
*/

-- Drop and recreate update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for tables that use this function
CREATE TRIGGER update_pseudonyms_updated_at BEFORE UPDATE ON pseudonyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_indicators_updated_at BEFORE UPDATE ON mood_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop and recreate is_admin
DROP FUNCTION IF EXISTS is_admin(uuid);
CREATE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_time_of_day
DROP FUNCTION IF EXISTS get_time_of_day(timestamptz);
CREATE FUNCTION get_time_of_day(entry_time timestamptz)
RETURNS text
SET search_path = public, pg_temp
AS $$
DECLARE
  hour_of_day integer;
BEGIN
  hour_of_day := EXTRACT(HOUR FROM entry_time);
  
  IF hour_of_day >= 5 AND hour_of_day < 12 THEN
    RETURN 'morning';
  ELSIF hour_of_day >= 12 AND hour_of_day < 17 THEN
    RETURN 'afternoon';
  ELSIF hour_of_day >= 17 AND hour_of_day < 21 THEN
    RETURN 'evening';
  ELSE
    RETURN 'night';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop and recreate get_season
DROP FUNCTION IF EXISTS get_season(date);
CREATE FUNCTION get_season(entry_date date)
RETURNS text
SET search_path = public, pg_temp
AS $$
DECLARE
  month_num integer;
BEGIN
  month_num := EXTRACT(MONTH FROM entry_date);
  
  IF month_num IN (12, 1, 2) THEN
    RETURN 'winter';
  ELSIF month_num IN (3, 4, 5) THEN
    RETURN 'spring';
  ELSIF month_num IN (6, 7, 8) THEN
    RETURN 'summer';
  ELSE
    RETURN 'autumn';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop and recreate log_audit_event
DROP FUNCTION IF EXISTS log_audit_event(text, text, jsonb, text, uuid);
CREATE FUNCTION log_audit_event(
  p_category text,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_severity text DEFAULT 'info',
  p_user_id uuid DEFAULT NULL
)
RETURNS void
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO audit_logs (category, action, details, severity, user_id)
  VALUES (p_category, p_action, p_details, p_severity, COALESCE(p_user_id, auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate is_dynamic_agreement
DROP FUNCTION IF EXISTS is_dynamic_agreement(uuid);
CREATE FUNCTION is_dynamic_agreement(menu_item_id uuid)
RETURNS boolean
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM menu_items
    WHERE id = menu_item_id
    AND linked_agreement_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

