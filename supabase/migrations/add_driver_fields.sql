-- Migration: Add new fields to drivers table
-- Run this in Supabase SQL Editor if you already have a drivers table with data

-- Add new columns to existing drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS years_driving_experience INTEGER,
ADD COLUMN IF NOT EXISTS license_duration_years INTEGER;

-- Update existing records with default values (you may want to update these manually)
UPDATE drivers 
SET 
  email = COALESCE(email, ''),
  emergency_contact_name = COALESCE(emergency_contact_name, ''),
  emergency_contact_phone = COALESCE(emergency_contact_phone, ''),
  years_driving_experience = COALESCE(years_driving_experience, 0),
  license_duration_years = COALESCE(license_duration_years, 0)
WHERE email IS NULL OR emergency_contact_name IS NULL OR emergency_contact_phone IS NULL 
   OR years_driving_experience IS NULL OR license_duration_years IS NULL;

-- Make fields required for new registrations (after updating existing data)
ALTER TABLE drivers 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN emergency_contact_name SET NOT NULL,
ALTER COLUMN emergency_contact_phone SET NOT NULL,
ALTER COLUMN years_driving_experience SET NOT NULL,
ALTER COLUMN license_duration_years SET NOT NULL;