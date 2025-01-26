/*
  # Add username availability check function and index

  1. Changes
    - Add function to check username availability
    - Add unique case-insensitive index for usernames
  
  2. Notes
    - Removed duplicate policy since it already exists
    - Added IF NOT EXISTS to prevent index creation errors
*/

-- Function to check username availability
CREATE OR REPLACE FUNCTION check_username_availability(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(profiles.username) = LOWER(username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique index for case-insensitive username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx 
  ON profiles (LOWER(username));