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
  - `latitude` (DECIMAL(10,2)) - GPS latitude
  - `longitude` (DECIMAL(10,2)) - GPS longitude
  - `mood` (text) - 'positive', 'neutral', 'negative'
  - `intensity` (INT, default 1) - Intensity level (1-5, for future use)
  - `created_at` (DATETIME) - Assessment timestamp
  - `ip_address` (VARCHAR(45)) - IP address for bot detection
  - `user_agent` (text) - Browser user agent
  - `device_fingerprint` (text) - Device fingerprint hash
  
  ### 2. `session_yra`
  Tracks YRA balance per anonymous session.
  - `session_id` (text, primary key) - Unique session identifier
  - `yra_balance` (INT, default 0) - Current YRA balance
  - `assessments_count` (INT, default 0) - Number of assessments made
  - `created_at` (DATETIME) - Session creation time
  - `last_activity` (DATETIME) - Last activity timestamp
  - `user_id` (uuid, nullable) - Linked user_id after registration
  - `yra_transferred` (TINYINT(1), DEFAULT 0) - Whether YRA was transferred to account
  
  ### 3. `yra_rewards_config`
  Admin-configurable YRA reward settings.
  - `id` (uuid, primary key)
  - `reward_type` (text, unique) - 'mood_assessment', 'streak_bonus', etc.
  - `min_amount` (INT) - Minimum YRA reward
  - `max_amount` (INT) - Maximum YRA reward
  - `is_active` (TINYINT(1), DEFAULT 1) - Is this reward active
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)
  
  ### 4. `bot_protection_logs`
  Logs for bot protection analysis.
  - `id` (uuid, primary key)
  - `session_id` (text) - Session identifier
  - `event_type` (text) - 'rate_limit', 'suspicious_timing', 'geolocation_jump', etc.
  - `details` (JSON) - Additional event details
  - `created_at` (DATETIME)
  
  ## Indexes
  - Indexes on session_id, created_at, and location for performance
  - Indexes for bot protection queries
*/

-- Create mood_assessments table
CREATE TABLE IF NOT EXISTS mood_assessments (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  symbol_type TEXT NOT NULL CHECK (symbol_type IN ('woman', 'man', 'child', 'family', 'group')),
  latitude DECIMAL(10,8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DECIMAL(11,8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  mood TEXT NOT NULL CHECK (mood IN ('positive', 'neutral', 'negative')),
  intensity INT DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint TEXT
);

-- Create session_yra table
CREATE TABLE IF NOT EXISTS session_yra (
  session_id TEXT PRIMARY KEY,
  yra_balance INT DEFAULT 0 NOT NULL CHECK (yra_balance >= 0),
  assessments_count INT DEFAULT 0 NOT NULL CHECK (assessments_count >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id CHAR(36) REFERENCES auth.users(id) ON DELETE SET NULL,
  yra_transferred TINYINT(1) DEFAULT 0
);

-- Create yra_rewards_config table
CREATE TABLE IF NOT EXISTS yra_rewards_config (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type TEXT UNIQUE NOT NULL,
  min_amount INT NOT NULL CHECK (min_amount >= 0),
  max_amount INT NOT NULL CHECK (max_amount >= min_amount),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create bot_protection_logs table
CREATE TABLE IF NOT EXISTS bot_protection_logs (
  id CHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_assessments_session_id ON mood_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_mood_assessments_created_at ON mood_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_assessments_location ON mood_assessments , 4326)
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
ON DUPLICATE KEY UPDATE reward_type = reward_type;

-- Function to update session last_activity

-- Trigger to update session activity on assessment insert

-- Function to calculate YRA reward (random between min and max)

-- Function to add YRA to session

-- Enable Row Level Security

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