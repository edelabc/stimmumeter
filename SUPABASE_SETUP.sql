/*
  # Supabase Setup Script
  # 
  # This script creates the necessary tables for the Mood Assessment System.
  # Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
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
DROP TRIGGER IF EXISTS trigger_update_session_activity ON mood_assessments;
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
DROP POLICY IF EXISTS "Allow anonymous read access to aggregated assessments" ON mood_assessments;
CREATE POLICY "Allow anonymous read access to aggregated assessments"
ON mood_assessments FOR SELECT
USING (true);

-- Allow anonymous insert for assessments
DROP POLICY IF EXISTS "Allow anonymous insert assessments" ON mood_assessments;
CREATE POLICY "Allow anonymous insert assessments"
ON mood_assessments FOR INSERT
WITH CHECK (true);

-- Allow anonymous read/write to own session
DROP POLICY IF EXISTS "Allow session access" ON session_yra;
CREATE POLICY "Allow session access"
ON session_yra FOR ALL
USING (true)
WITH CHECK (true);

-- Allow public read access to active reward configs
DROP POLICY IF EXISTS "Allow public read reward configs" ON yra_rewards_config;
CREATE POLICY "Allow public read reward configs"
ON yra_rewards_config FOR SELECT
USING (is_active = true);

-- Allow insert to bot protection logs (for monitoring)
DROP POLICY IF EXISTS "Allow insert bot protection logs" ON bot_protection_logs;
CREATE POLICY "Allow insert bot protection logs"
ON bot_protection_logs FOR INSERT
WITH CHECK (true);

-- Admin users can see all data
DROP POLICY IF EXISTS "Admin full access to mood_assessments" ON mood_assessments;
CREATE POLICY "Admin full access to mood_assessments"
ON mood_assessments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admin full access to session_yra" ON session_yra;
CREATE POLICY "Admin full access to session_yra"
ON session_yra FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admin full access to yra_rewards_config" ON yra_rewards_config;
CREATE POLICY "Admin full access to yra_rewards_config"
ON yra_rewards_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admin full access to bot_protection_logs" ON bot_protection_logs;
CREATE POLICY "Admin full access to bot_protection_logs"
ON bot_protection_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
