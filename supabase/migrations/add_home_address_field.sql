-- Migration: Add home_address field and reorganize driver fields
-- Run this in Supabase SQL Editor if you already have a drivers table

-- Add home_address column
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS home_address TEXT;

-- Update existing records with empty home_address (optional)
-- You can leave this commented out if you don't want to set default values
-- UPDATE drivers SET home_address = '' WHERE home_address IS NULL;