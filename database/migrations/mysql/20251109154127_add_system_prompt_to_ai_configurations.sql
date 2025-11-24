/*
  # Add System Prompt to AI Configurations

  1. Changes
    - Add `system_prompt` column to `ai_configurations` table
    - Optional text field for custom AI prompts
    - Allows users to customize the AI behavior per configuration
  
  2. Notes
    - Field is nullable (optional)
    - Existing configurations will have NULL by default
    - Used to override default AI analysis prompts
*/