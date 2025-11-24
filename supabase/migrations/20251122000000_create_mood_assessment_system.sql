/*
  # Mood Assessment System - Session-basierte Stimmungserfassung
  
  ## Overview
  This migration creates a system for anonymous, session-based mood assessments
  where users can place symbols on a map and rate the mood of people around them.
  
  ## New Tables
  
  ### 1. `mood_assessments`
  Stores individual mood assessments placed on the map.
  - `id` (uuid, primary key)
  - `session_id` (text) - Anonymous session identifier
  - `symbol_type` (text) - 'woman', 'man', 'child', 'family', 'group'
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `mood` (text) - 'positive', 'neutral', 'negative'
  - `intensity` (integer, default 1) - Intensity level (1-5, for future use)
  - `created_at` (timestamptz) - Assessment timestamp
  - `ip_address` (inet) - IP address for bot detection
  - `user_agent` (text) - Browser user agent
  - `device_fingerprint` (text) - Device fingerprint hash
  
  ### 2. `session_yra`
  Tracks YRA balance per anonymous session.
  - `session_id` (text, primary key) - Unique session identifier
  - `yra_balance` (integer, default 0) - Current YRA balance
  - `assessments_count` (integer, default 0) - Number of assessments made
  - `created_at` (timestamptz) - Session creation time
  - `last_activity` (timestamptz) - Last activity timestamp
  - `user_id` (uuid, nullable) - Linked user_id after registration
  - `yra_transferred` (boolean, default false) - Whether YRA was transferred to account
  
  ### 3. `yra_rewards_config`
  Admin-configurable YRA reward settings.
  - `id` (uuid, primary key)
  - `reward_type` (text, unique) - 'mood_assessment', 'streak_bonus', etc.
  - `min_amount` (integer) - Minimum YRA reward
  - `max_amount` (integer) - Maximum YRA reward
  - `is_active` (boolean, default true) - Is this reward active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 4. `bot_protection_logs`
  Logs for bot protection analysis.
  - `id` (uuid, primary key)
  - `session_id` (text) - Session identifier
  - `event_type` (text) - 'rate_limit', 'suspicious_timing', 'geolocation_jump', etc.
  - `details` (jsonb) - Additional event details
  - `created_at` (timestamptz)
  
  ## Indexes
  - Indexes on session_id, created_at, and location for performance
  - Indexes for bot protection queries
*/

-- Create mood_assessments table
CREATE TABLE IF NOT EXISTS mood_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  symbol_type TEXT NOT NULL CHECK (symbol_type IN ('woman', 'man', 'child', 'family', 'group')),
  latitude NUMERIC(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  mood TEXT NOT NULL CHECK (mood IN ('positive', 'neutral', 'negative')),
  intensity INTEGER DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT
);

-- Create session_yra table
CREATE TABLE IF NOT EXISTS session_yra (
  session_id TEXT PRIMARY KEY,
  yra_balance INTEGER DEFAULT 0 NOT NULL CHECK (yra_balance >= 0),
  assessments_count INTEGER DEFAULT 0 NOT NULL CHECK (assessments_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  yra_transferred BOOLEAN DEFAULT false
);

-- Create yra_rewards_config table
CREATE TABLE IF NOT EXISTS yra_rewards_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type TEXT UNIQUE NOT NULL,
  min_amount INTEGER NOT NULL CHECK (min_amount >= 0),
  max_amount INTEGER NOT NULL CHECK (max_amount >= min_amount),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bot_protection_logs table
CREATE TABLE IF NOT EXISTS bot_protection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_assessments_session_id ON mood_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_mood_assessments_created_at ON mood_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_assessments_location ON mood_assessments USING GIST(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX IF NOT EXISTS idx_mood_assessments_symbol_type ON mood_assessments(symbol_type);
CREATE INDEX IF NOT EXISTS idx_session_yra_user_id ON session_yra(user_id);
CREATE INDEX IF NOT EXISTS idx_session_yra_last_activity ON session_yra(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_bot_protection_logs_session_id ON bot_protection_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_protection_logs_created_at ON bot_protection_logs(created_at DESC);

-- Insert default YRA reward configuration
INSERT INTO yra_rewards_config (reward_type, min_amount, max_amount, is_active)
VALUES 
  ('mood_assessment', 5, 15, true),
  ('streak_bonus_3', 10, 20, true),
  ('streak_bonus_7', 25, 50, true),
  ('streak_bonus_14', 50, 100, true)
ON CONFLICT (reward_type) DO NOTHING;

-- Function to update session last_activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE session_yra
  SET last_activity = NOW(),
      assessments_count = assessments_count + 1
  WHERE session_id = NEW.session_id;
  
  -- Create session if it doesn't exist
  INSERT INTO session_yra (session_id, last_activity, assessments_count)
  VALUES (NEW.session_id, NOW(), 1)
  ON CONFLICT (session_id) DO UPDATE
  SET last_activity = NOW(),
      assessments_count = session_yra.assessments_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session activity on assessment insert
CREATE TRIGGER trigger_update_session_activity
AFTER INSERT ON mood_assessments
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

-- Function to calculate YRA reward (random between min and max)
CREATE OR REPLACE FUNCTION calculate_yra_reward(reward_type_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  min_amt INTEGER;
  max_amt INTEGER;
BEGIN
  SELECT min_amount, max_amount INTO min_amt, max_amt
  FROM yra_rewards_config
  WHERE reward_type = reward_type_param AND is_active = true;
  
  IF min_amt IS NULL OR max_amt IS NULL THEN
    RETURN 5; -- Default reward
  END IF;
  
  -- Return random value between min and max
  RETURN floor(random() * (max_amt - min_amt + 1) + min_amt)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to add YRA to session
CREATE OR REPLACE FUNCTION add_yra_to_session(session_id_param TEXT, amount_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE session_yra
  SET yra_balance = yra_balance + amount_param,
      last_activity = NOW()
  WHERE session_id = session_id_param
  RETURNING yra_balance INTO new_balance;
  
  -- Create session if it doesn't exist
  IF new_balance IS NULL THEN
    INSERT INTO session_yra (session_id, yra_balance, last_activity)
    VALUES (session_id_param, amount_param, NOW())
    RETURNING yra_balance INTO new_balance;
  END IF;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE mood_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_yra ENABLE ROW LEVEL SECURITY;
ALTER TABLE yra_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_protection_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anonymous read access to aggregated data (for heatmaps)
CREATE POLICY "Allow anonymous read access to aggregated assessments"
ON mood_assessments FOR SELECT
USING (true);

-- Allow anonymous insert for assessments
CREATE POLICY "Allow anonymous insert assessments"
ON mood_assessments FOR INSERT
WITH CHECK (true);

-- Allow anonymous read/write to own session
CREATE POLICY "Allow session access"
ON session_yra FOR ALL
USING (true)
WITH CHECK (true);

-- Allow public read access to active reward configs
CREATE POLICY "Allow public read reward configs"
ON yra_rewards_config FOR SELECT
USING (is_active = true);

-- Allow insert to bot protection logs (for monitoring)
CREATE POLICY "Allow insert bot protection logs"
ON bot_protection_logs FOR INSERT
WITH CHECK (true);

-- Admin users can see all data
CREATE POLICY "Admin full access to mood_assessments"
ON mood_assessments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admin full access to session_yra"
ON session_yra FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admin full access to yra_rewards_config"
ON yra_rewards_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admin full access to bot_protection_logs"
ON bot_protection_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Comments
COMMENT ON TABLE mood_assessments IS 'Stores anonymous mood assessments placed on map';
COMMENT ON TABLE session_yra IS 'Tracks YRA balance per anonymous session';
COMMENT ON TABLE yra_rewards_config IS 'Admin-configurable YRA reward settings';
COMMENT ON TABLE bot_protection_logs IS 'Logs for bot protection and analysis';

