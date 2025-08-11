-- Add dropoff_photos column to vehicles table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'vehicles' 
                 AND column_name = 'dropoff_photos') THEN
    ALTER TABLE vehicles ADD COLUMN dropoff_photos TEXT[];
  END IF;
END $$;
