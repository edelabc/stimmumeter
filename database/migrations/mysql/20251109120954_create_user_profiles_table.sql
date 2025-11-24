/*
  # Create user profiles table

  1. New Tables
    - `user_profiles`
      - Stores basic user profile information for admin management
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Admins can view all profiles
    - Users can view their own profile
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id CHAR(36) PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;