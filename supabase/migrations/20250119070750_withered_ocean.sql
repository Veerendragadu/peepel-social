/*
  # Create Initial Admin User

  1. Changes
    - Creates the initial admin user in auth.users
    - Creates corresponding profile with admin privileges
    - Sets up secure password for admin access

  2. Security
    - Creates admin user with proper authentication
    - Sets admin flag in profiles table
*/

-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'admin@peepel.com',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  is_admin,
  created_at,
  updated_at
)
SELECT
  id,
  'admin',
  'Admin User',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'admin@peepel.com'
ON CONFLICT (username) DO NOTHING;