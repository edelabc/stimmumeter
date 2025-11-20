/*
  # Create AI Configurations Table

  1. New Tables
    - `ai_configurations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `nickname` (text) - Display name for this AI configuration
      - `provider` (text) - AI provider: openai, gemini, claude, xai, manus
      - `model` (text) - Specific model name (e.g., gpt-4, gemini-pro)
      - `api_key` (text) - Encrypted API key for the provider
      - `text_color` (text) - Hex color for text display
      - `background_color` (text) - Hex color for background
      - `is_active` (boolean) - Whether this AI is currently selected
      - `is_enabled` (boolean) - Global toggle for AI features
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_configurations` table
    - Add policies for authenticated users to manage their own AI configurations

  3. Indexes
    - Index on user_id for faster queries
    - Index on is_active for active configuration lookup
*/

CREATE TABLE IF NOT EXISTS ai_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'gemini', 'claude', 'xai', 'manus')),
  model text NOT NULL,
  api_key text NOT NULL,
  text_color text DEFAULT '#000000',
  background_color text DEFAULT '#ffffff',
  is_active boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI configurations"
  ON ai_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI configurations"
  ON ai_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI configurations"
  ON ai_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI configurations"
  ON ai_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_configurations_user_id ON ai_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_is_active ON ai_configurations(user_id, is_active) WHERE is_active = true;