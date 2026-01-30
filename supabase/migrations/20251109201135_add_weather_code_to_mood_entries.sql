/*
  # Add Weather Code and Coordinates to Mood Entries

  ## Overview
  This migration adds WMO weather code support and geolocation coordinates
  to mood entries for automatic weather tracking using Open-Meteo API.

  ## Changes

  ### 1. New Columns in `mood_entries`
    - `weather_code` (integer) - WMO Weather Interpretation Code (0-99)
    - `latitude` (decimal) - Geographic latitude for weather lookup
    - `longitude` (decimal) - Geographic longitude for weather lookup
    - `temperature` (decimal) - Temperature in Celsius at time of entry

  ## WMO Weather Codes Reference
  - 0: Clear sky
  - 1: Mainly clear
  - 2: Partly cloudy
  - 3: Overcast
  - 45: Fog
  - 48: Depositing rime fog
  - 51, 53, 55: Drizzle (light, moderate, dense)
  - 56, 57: Freezing drizzle
  - 61, 63, 65: Rain (slight, moderate, heavy)
  - 66, 67: Freezing rain
  - 71, 73, 75: Snowfall (slight, moderate, heavy)
  - 77: Snow grains
  - 80, 81, 82: Rain showers (slight, moderate, violent)
  - 85, 86: Snow showers (slight, heavy)
  - 95: Thunderstorm
  - 96, 99: Thunderstorm with hail

  ## Important Notes
  1. All new fields are nullable
  2. WMO codes are internationally standardized
  3. Coordinates enable accurate weather data retrieval
  4. The existing `weather` text field remains for manual entry
*/

-- Add weather tracking fields to mood_entries
DO $$
BEGIN
  -- Add weather_code column (WMO standard)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'weather_code'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN weather_code integer;
    COMMENT ON COLUMN mood_entries.weather_code IS 'WMO Weather Interpretation Code (0-99)';
  END IF;

  -- Add latitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN latitude decimal(10, 6);
    COMMENT ON COLUMN mood_entries.latitude IS 'Geographic latitude for weather lookup';
  END IF;

  -- Add longitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN longitude decimal(10, 6);
    COMMENT ON COLUMN mood_entries.longitude IS 'Geographic longitude for weather lookup';
  END IF;

  -- Add temperature column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'temperature'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN temperature decimal(5, 2);
    COMMENT ON COLUMN mood_entries.temperature IS 'Temperature in Celsius at time of entry';
  END IF;
END $$;

-- Create indexes for weather analysis queries
CREATE INDEX IF NOT EXISTS idx_mood_entries_weather_code ON mood_entries(weather_code);
CREATE INDEX IF NOT EXISTS idx_mood_entries_coordinates ON mood_entries(latitude, longitude);

-- Add constraint to ensure weather_code is valid WMO code
ALTER TABLE mood_entries 
  DROP CONSTRAINT IF EXISTS check_valid_weather_code;

ALTER TABLE mood_entries 
  ADD CONSTRAINT check_valid_weather_code 
  CHECK (weather_code IS NULL OR (weather_code >= 0 AND weather_code <= 99));