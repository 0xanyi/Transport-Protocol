-- Update checkin_type enum to use "Events Venue" terminology and add session support
-- This migration updates the existing check-in types to be more generic

-- First, add the new enum values with Events Venue terminology
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'hotel_to_events_venue';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'arrived_at_events_venue';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'departing_events_venue';

-- Add session support for multiple daily check-ins (morning/evening)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS session_id VARCHAR(20);

-- Add custom check-in label for unlimited custom check-ins
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS custom_label VARCHAR(255);

-- Create index for efficient session-based queries
CREATE INDEX IF NOT EXISTS idx_checkins_session ON checkins(driver_id, assignment_id, checkin_type, event_date, session_id)
WHERE is_daily_checkin = true;

-- Create index for custom check-ins
CREATE INDEX IF NOT EXISTS idx_checkins_custom ON checkins(driver_id, assignment_id, custom_label)
WHERE checkin_type = 'custom';

-- Update comments for clarity
COMMENT ON COLUMN checkins.is_daily_checkin IS 'True for hotel_to_events_venue, arrived_at_events_venue, departing_events_venue, arrived_at_hotel check-ins';
COMMENT ON COLUMN checkins.event_date IS 'Date of the event for daily check-ins (allows multiple sessions per day)';
COMMENT ON COLUMN checkins.session_id IS 'Session identifier for daily check-ins (e.g., morning, evening, session_1, session_2)';
COMMENT ON COLUMN checkins.custom_label IS 'Custom label for custom check-in types (unlimited per assignment)';

-- Create a view for tracking dashboard queries
CREATE OR REPLACE VIEW driver_tracking_view AS
SELECT 
    c.id,
    c.driver_id,
    c.assignment_id,
    c.checkin_type,
    c.custom_label,
    c.session_id,
    c.event_date,
    c.is_daily_checkin,
    c.latitude,
    c.longitude,
    c.notes,
    c.timestamp,
    d.name as driver_name,
    d.phone as driver_phone,
    v.name as vip_name,
    vh.make as vehicle_make,
    vh.model as vehicle_model,
    vh.registration as vehicle_registration,
    a.status as assignment_status
FROM checkins c
LEFT JOIN drivers d ON c.driver_id = d.id
LEFT JOIN assignments a ON c.assignment_id = a.id
LEFT JOIN vips v ON a.vip_id = v.id
LEFT JOIN vehicles vh ON a.vehicle_id = vh.id
ORDER BY c.timestamp DESC;

-- Grant access to the view
GRANT SELECT ON driver_tracking_view TO authenticated;