/*
  # Add Grouping Metadata to Mood Entries

  ## Overview
  This migration adds metadata fields to mood_entries to enable grouping and filtering
  by various dimensions (time of day, day of week, season, weather, custom rhythms).

  ## Changes

  ### 1. New Columns in `mood_entries`
    - `time_of_day` (text) - Time category: 'morning', 'noon', 'afternoon', 'evening', 'night'
    - `weather` (text) - Weather condition at time of entry (optional)
    - `custom_tags` (text[]) - Array of custom tags for flexible grouping
    - `location` (text) - Optional location information

  ### 2. Computed Fields
    The following are computed from `entry_date`:
    - Day of week (computed via SQL)
    - Month/Season (computed via SQL)
    - Hour (computed via SQL)

  ## Usage
  - Time-based grouping: Use entry_date to extract weekday, month, hour
  - Time of day grouping: Use time_of_day field
  - Weather grouping: Use weather field
  - Custom grouping: Use custom_tags array
  - Location grouping: Use location field

  ## Important Notes
  1. All new fields are nullable for backward compatibility
  2. Existing entries will have NULL values for new fields
  3. Frontend will auto-populate time_of_day based on entry_date
*/

-- Add metadata columns to mood_entries
DO $$
BEGIN
  -- Add time_of_day column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'time_of_day'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN time_of_day text;
    COMMENT ON COLUMN mood_entries.time_of_day IS 'Time of day category: morning, noon, afternoon, evening, night';
  END IF;

  -- Add weather column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'weather'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN weather text;
    COMMENT ON COLUMN mood_entries.weather IS 'Weather condition at time of entry';
  END IF;

  -- Add custom_tags column (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'custom_tags'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN custom_tags text[] DEFAULT '{}';
    COMMENT ON COLUMN mood_entries.custom_tags IS 'Custom tags for flexible grouping and filtering';
  END IF;

  -- Add location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'location'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN location text;
    COMMENT ON COLUMN mood_entries.location IS 'Optional location information';
  END IF;
END $$;

-- Create function to get time of day from timestamp
CREATE OR REPLACE FUNCTION get_time_of_day(ts timestamptz)
RETURNS text AS $$
DECLARE
  hour_of_day integer;
BEGIN
  hour_of_day := EXTRACT(HOUR FROM ts);
  
  CASE
    WHEN hour_of_day >= 5 AND hour_of_day < 12 THEN
      RETURN 'morning';
    WHEN hour_of_day >= 12 AND hour_of_day < 14 THEN
      RETURN 'noon';
    WHEN hour_of_day >= 14 AND hour_of_day < 18 THEN
      RETURN 'afternoon';
    WHEN hour_of_day >= 18 AND hour_of_day < 22 THEN
      RETURN 'evening';
    ELSE
      RETURN 'night';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get season from timestamp
CREATE OR REPLACE FUNCTION get_season(ts timestamptz)
RETURNS text AS $$
DECLARE
  month_num integer;
BEGIN
  month_num := EXTRACT(MONTH FROM ts);
  
  CASE
    WHEN month_num IN (12, 1, 2) THEN
      RETURN 'winter';
    WHEN month_num IN (3, 4, 5) THEN
      RETURN 'spring';
    WHEN month_num IN (6, 7, 8) THEN
      RETURN 'summer';
    WHEN month_num IN (9, 10, 11) THEN
      RETURN 'autumn';
    ELSE
      RETURN 'unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index for better query performance on grouping fields
CREATE INDEX IF NOT EXISTS idx_mood_entries_time_of_day ON mood_entries(time_of_day);
CREATE INDEX IF NOT EXISTS idx_mood_entries_weather ON mood_entries(weather);
CREATE INDEX IF NOT EXISTS idx_mood_entries_location ON mood_entries(location);
CREATE INDEX IF NOT EXISTS idx_mood_entries_custom_tags ON mood_entries USING GIN(custom_tags);