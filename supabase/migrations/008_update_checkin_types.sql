-- Update checkin_type enum to support daily event check-ins
-- This migration safely adds new check-in types

-- First, add the new enum values
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'hotel_to_barking';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'arriving_at_barking';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'departing_barking';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'arriving_at_hotel';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'final_departure';

-- Add a column to track if this is a daily check-in (resets each day)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_daily_checkin BOOLEAN DEFAULT false;

-- Add a column to track the event date for daily check-ins
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS event_date DATE;

-- Create index for efficient querying of daily check-ins
CREATE INDEX IF NOT EXISTS idx_checkins_daily ON checkins(driver_id, assignment_id, checkin_type, event_date) 
WHERE is_daily_checkin = true;

-- Create index for tracking dashboard queries
CREATE INDEX IF NOT EXISTS idx_checkins_tracking ON checkins(assignment_id, timestamp DESC);

-- Update the schema to mark which check-in types are daily
-- This will be handled in the application logic, but we can add a comment for clarity
COMMENT ON COLUMN checkins.is_daily_checkin IS 'True for hotel_to_barking, arriving_at_barking, departing_barking, arriving_at_hotel check-ins';
COMMENT ON COLUMN checkins.event_date IS 'Date of the event for daily check-ins (Thu 14th - Sun 17th)';