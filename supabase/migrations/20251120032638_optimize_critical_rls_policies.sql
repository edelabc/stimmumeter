/*
  # Optimize Critical RLS Policies

  ## Overview
  Optimize the most frequently accessed RLS policies by using (select auth.uid())
  instead of auth.uid() to prevent re-evaluation for each row.

  ## Changes
  Optimize policies for core user tables:
  - pseudonyms
  - mood_indicators
  - mood_entries
  - mood_indicator_values
  - ai_configurations
  - user_profiles
  - user_account_config
*/

-- PSEUDONYMS
DROP POLICY IF EXISTS "Users can read own pseudonyms" ON pseudonyms;
CREATE POLICY "Users can read own pseudonyms" ON pseudonyms FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;
CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own pseudonyms" ON pseudonyms;
CREATE POLICY "Users can update own pseudonyms" ON pseudonyms FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own pseudonyms" ON pseudonyms;
CREATE POLICY "Users can delete own pseudonyms" ON pseudonyms FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- MOOD_INDICATORS
DROP POLICY IF EXISTS "Users can read own indicators" ON mood_indicators;
CREATE POLICY "Users can read own indicators" ON mood_indicators FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own indicators" ON mood_indicators;
CREATE POLICY "Users can insert own indicators" ON mood_indicators FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own indicators" ON mood_indicators;
CREATE POLICY "Users can update own indicators" ON mood_indicators FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own indicators" ON mood_indicators;
CREATE POLICY "Users can delete own indicators" ON mood_indicators FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- MOOD_ENTRIES
DROP POLICY IF EXISTS "Users can read own entries" ON mood_entries;
CREATE POLICY "Users can read own entries" ON mood_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pseudonyms WHERE pseudonyms.id = mood_entries.pseudonym_id AND pseudonyms.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own entries" ON mood_entries;
CREATE POLICY "Users can insert own entries" ON mood_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM pseudonyms WHERE pseudonyms.id = mood_entries.pseudonym_id AND pseudonyms.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update own entries" ON mood_entries;
CREATE POLICY "Users can update own entries" ON mood_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM pseudonyms WHERE pseudonyms.id = mood_entries.pseudonym_id AND pseudonyms.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM pseudonyms WHERE pseudonyms.id = mood_entries.pseudonym_id AND pseudonyms.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can delete own entries" ON mood_entries;
CREATE POLICY "Users can delete own entries" ON mood_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM pseudonyms WHERE pseudonyms.id = mood_entries.pseudonym_id AND pseudonyms.user_id = (select auth.uid())));

-- MOOD_INDICATOR_VALUES
DROP POLICY IF EXISTS "Users can read own indicator values" ON mood_indicator_values;
CREATE POLICY "Users can read own indicator values" ON mood_indicator_values FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM mood_entries me JOIN pseudonyms p ON p.id = me.pseudonym_id 
    WHERE me.id = mood_indicator_values.mood_entry_id AND p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own indicator values" ON mood_indicator_values;
CREATE POLICY "Users can insert own indicator values" ON mood_indicator_values FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM mood_entries me JOIN pseudonyms p ON p.id = me.pseudonym_id 
    WHERE me.id = mood_indicator_values.mood_entry_id AND p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update own indicator values" ON mood_indicator_values;
CREATE POLICY "Users can update own indicator values" ON mood_indicator_values FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM mood_entries me JOIN pseudonyms p ON p.id = me.pseudonym_id 
    WHERE me.id = mood_indicator_values.mood_entry_id AND p.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM mood_entries me JOIN pseudonyms p ON p.id = me.pseudonym_id 
    WHERE me.id = mood_indicator_values.mood_entry_id AND p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can delete own indicator values" ON mood_indicator_values;
CREATE POLICY "Users can delete own indicator values" ON mood_indicator_values FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM mood_entries me JOIN pseudonyms p ON p.id = me.pseudonym_id 
    WHERE me.id = mood_indicator_values.mood_entry_id AND p.user_id = (select auth.uid())));

-- AI_CONFIGURATIONS
DROP POLICY IF EXISTS "Users can view own AI configurations" ON ai_configurations;
CREATE POLICY "Users can view own AI configurations" ON ai_configurations FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own AI configurations" ON ai_configurations;
CREATE POLICY "Users can insert own AI configurations" ON ai_configurations FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own AI configurations" ON ai_configurations;
CREATE POLICY "Users can update own AI configurations" ON ai_configurations FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own AI configurations" ON ai_configurations;
CREATE POLICY "Users can delete own AI configurations" ON ai_configurations FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- USER_PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

-- USER_ACCOUNT_CONFIG
DROP POLICY IF EXISTS "Users can view own account config" ON user_account_config;
CREATE POLICY "Users can view own account config" ON user_account_config FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own account config" ON user_account_config;
CREATE POLICY "Users can insert own account config" ON user_account_config FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own account config" ON user_account_config;
CREATE POLICY "Users can update own account config" ON user_account_config FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

