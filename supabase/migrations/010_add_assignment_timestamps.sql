-- Add timestamp fields for assignment status tracking
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_activated_at ON assignments(activated_at);
CREATE INDEX IF NOT EXISTS idx_assignments_completed_at ON assignments(completed_at);
CREATE INDEX IF NOT EXISTS idx_assignments_status_activated ON assignments(status, activated_at);

-- Add comments for documentation
COMMENT ON COLUMN assignments.activated_at IS 'Timestamp when assignment status changed from scheduled to active';
COMMENT ON COLUMN assignments.completed_at IS 'Timestamp when assignment status changed to completed';