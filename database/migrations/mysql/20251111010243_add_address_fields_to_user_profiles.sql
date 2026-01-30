/*
  # Add Address Fields to User Profiles

  1. Changes
    - Add comprehensive address fields to user_profiles table
    - Fields: location_label, street, house_number, house_number_addition, postal_code, city, city_addition, state, country
    - Add is_blocked field for user blocking functionality
  
  2. Security
    - No RLS changes needed - existing policies cover new fields
*/

-- Add address fields to user_profiles