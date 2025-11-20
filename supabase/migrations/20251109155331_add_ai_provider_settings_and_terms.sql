/*
  # Add AI Provider Settings and Terms Acceptance

  1. New Tables
    - `ai_provider_settings` - Admin control for AI providers
      - `id` (uuid, primary key)
      - `provider` (text) - Provider name
      - `is_enabled` (boolean) - Admin toggle for provider availability
      - `system_prompt` (text) - Default system prompt for this provider
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_terms_acceptance` - User acceptance of AI terms
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `provider` (text) - Which provider terms were accepted
      - `accepted_at` (timestamptz)
      - `terms_version` (text) - Version of terms accepted
  
  2. Security
    - Enable RLS on both tables
    - Admin users can manage ai_provider_settings
    - Users can view their own ai_terms_acceptance
    - Users can insert their own ai_terms_acceptance
  
  3. Initial Data
    - Insert default providers with standard system prompt
*/

-- Create AI provider settings table
CREATE TABLE IF NOT EXISTS ai_provider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text UNIQUE NOT NULL CHECK (provider IN ('openai', 'gemini', 'claude', 'xai', 'manus')),
  is_enabled boolean DEFAULT true,
  system_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI terms acceptance table
CREATE TABLE IF NOT EXISTS ai_terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'gemini', 'claude', 'xai', 'manus')),
  accepted_at timestamptz DEFAULT now(),
  terms_version text DEFAULT '1.0',
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Policies for ai_provider_settings
CREATE POLICY "Admin users can view AI provider settings"
  ON ai_provider_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update AI provider settings"
  ON ai_provider_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "All users can view enabled AI providers"
  ON ai_provider_settings FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Policies for ai_terms_acceptance
CREATE POLICY "Users can view own AI terms acceptance"
  ON ai_terms_acceptance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI terms acceptance"
  ON ai_terms_acceptance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all AI terms acceptance"
  ON ai_terms_acceptance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Insert default providers with default system prompt
INSERT INTO ai_provider_settings (provider, is_enabled, system_prompt) VALUES
  ('openai', true, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
  ('gemini', true, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
  ('claude', true, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
  ('xai', true, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.'),
  ('manus', true, 'Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen. Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.')
ON CONFLICT (provider) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_terms_acceptance_user_id ON ai_terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_enabled ON ai_provider_settings(is_enabled);