/*
  # User Agreement Consents
  
  ## Overview
  This migration creates a table to store user consent for agreements (AGB, Datenschutz, Cookies, etc.)
  during registration. This ensures GDPR compliance and tracks which version of each agreement
  the user has accepted.
  
  ## New Table
  
  ### `user_agreement_consents`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `agreement_id` (uuid, references t_vereinbarungen) - The agreement the user consented to
  - `agreement_version` (integer) - Version of the agreement at time of consent
  - `consent_type` (text) - Type: 'AGB', 'Datenschutz', 'Cookies', 'DSGVO', etc.
  - `consented_at` (timestamptz) - When the user gave consent
  - `ip_address` (inet) - IP address at time of consent
  - `user_agent` (text) - Browser user agent
  - `revoked_at` (timestamptz, nullable) - When consent was revoked (if applicable)
  
  ## Indexes
  - Index on user_id for quick lookups
  - Index on agreement_id for agreement queries
  - Index on consent_type for filtering by type
  - Unique constraint on (user_id, agreement_id, agreement_version) to prevent duplicates
*/

-- Create user_agreement_consents table
CREATE TABLE IF NOT EXISTS user_agreement_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agreement_id UUID REFERENCES t_vereinbarungen(id) ON DELETE RESTRICT NOT NULL,
  agreement_version INTEGER NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('AGB', 'Datenschutz', 'Cookies', 'DSGVO', 'Impressum', 'Widerruf')),
  consented_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_agreement_consents_user_id ON user_agreement_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreement_consents_agreement_id ON user_agreement_consents(agreement_id);
CREATE INDEX IF NOT EXISTS idx_user_agreement_consents_consent_type ON user_agreement_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_agreement_consents_consented_at ON user_agreement_consents(consented_at DESC);

-- Unique constraint: One consent per user per agreement version
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_agreement_consents_unique 
ON user_agreement_consents(user_id, agreement_id, agreement_version);

-- Enable RLS
ALTER TABLE user_agreement_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own consents
CREATE POLICY "Users can view own consents"
  ON user_agreement_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can insert consents (for registration)
CREATE POLICY "Public can insert consents"
  ON user_agreement_consents FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can update their own consents (e.g., revoke)
CREATE POLICY "Users can update own consents"
  ON user_agreement_consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all consents
CREATE POLICY "Admins can view all consents"
  ON user_agreement_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

COMMENT ON TABLE user_agreement_consents IS 'Stores user consent for legal agreements (AGB, Datenschutz, Cookies, etc.) during registration';





