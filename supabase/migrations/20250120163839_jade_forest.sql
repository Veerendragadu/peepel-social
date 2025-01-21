/*
  # Add username unique constraint

  1. Changes
    - Add unique constraint to username column in profiles table
    - Add function to check username availability
    - Add RLS policy for username checks

  2. Security
    - Maintain existing RLS policies
    - Add new policy for username checks
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

-- Add policy for checking username availability
CREATE POLICY "Anyone can check username availability"
  ON profiles
  FOR SELECT
  USING (true);

-- Add unique index for case-insensitive username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx 
  ON profiles (LOWER(username));