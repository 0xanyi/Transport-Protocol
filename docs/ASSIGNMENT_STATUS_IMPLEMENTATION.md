# Assignment Status Transition Implementation

## Overview

This implementation adds automatic assignment status transitions to fix the issue where assignments remain "SCHEDULED" indefinitely. Now assignments will automatically transition from `'scheduled'` to `'active'` when drivers perform their first check-in.

## What Was Implemented

### 1. Automatic Status Transition in Check-in API
- **File**: [`app/api/checkins/route.ts`](../app/api/checkins/route.ts)
- **Logic**: When a driver performs their first check-in for an assignment, the assignment status automatically changes from `'scheduled'` to `'active'`
- **Safety**: Only updates assignments that are still in `'scheduled'` status

### 2. Manual Assignment Status API
- **File**: [`app/api/assignments/[id]/status/route.ts`](../app/api/assignments/[id]/status/route.ts)
- **Purpose**: Allows coordinators to manually update assignment status
- **Features**:
  - Status validation and transition rules
  - Automatic timestamp tracking
  - Permission-based access control
  - Detailed logging

### 3. Database Schema Updates
- **File**: [`supabase/migrations/010_add_assignment_timestamps.sql`](../supabase/migrations/010_add_assignment_timestamps.sql)
- **Changes**:
  - Added `activated_at` timestamp field
  - Added `completed_at` timestamp field
  - Added performance indexes
  - Added documentation comments

### 4. TypeScript Type Updates
- **File**: [`types/index.ts`](../types/index.ts)
- **Changes**: Added `activated_at` and `completed_at` fields to `Assignment` interface

## Deployment Instructions

### Step 1: Apply Database Migration

Since you're using Coolify, apply the migration manually in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the following SQL:

```sql
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
```

3. Execute the SQL

### Step 2: Deploy Code Changes

Deploy your updated code to Coolify. The following files have been modified:
- `app/api/checkins/route.ts` (automatic status transition)
- `app/api/assignments/[id]/status/route.ts` (new manual status API)
- `types/index.ts` (updated TypeScript types)

### Step 3: Test the Implementation

1. **Create a new assignment** - should start with status `'scheduled'`
2. **Have the driver perform their first check-in** - assignment should automatically change to `'active'`
3. **Verify in dashboard** - assignment should now show "ACTIVE" instead of "SCHEDULED"

## How It Works

### Automatic Transition Flow

1. **Assignment Creation**: Status starts as `'scheduled'`
2. **Driver Check-in**: Driver performs any check-in for the assignment
3. **Status Check**: System checks if this is the first check-in for this assignment
4. **Auto-Activation**: If first check-in, assignment status changes to `'active'` and `activated_at` is set
5. **Dashboard Update**: Assignment now displays as "ACTIVE"

### Manual Status Control

Coordinators can also manually update assignment status using the new API:

```bash
# Update assignment status
PATCH /api/assignments/{id}/status
{
  "status": "active",
  "reason": "Manual activation by coordinator"
}
```

### Status Transition Rules

- `scheduled` → `active` ✅
- `scheduled` → `completed` ✅ (skip active if needed)
- `active` → `completed` ✅
- `completed` → (any) ❌ (terminal state)

## API Endpoints

### GET /api/assignments/{id}/status
- **Purpose**: Get assignment details with status
- **Permissions**: `assignments:read`
- **Response**: Full assignment details with related data

### PATCH /api/assignments/{id}/status
- **Purpose**: Update assignment status manually
- **Permissions**: `assignments:update`
- **Body**: `{ "status": "active|completed", "reason": "optional reason" }`
- **Response**: Updated assignment with previous status info

## Troubleshooting

### Assignment Still Shows "SCHEDULED"

1. **Check if migration was applied**: Verify `activated_at` column exists in assignments table
2. **Check driver check-ins**: Ensure driver has actually performed a check-in
3. **Check logs**: Look for "Activating assignment" messages in server logs
4. **Manual activation**: Use the status API to manually activate if needed

### Check-in Fails to Activate Assignment

1. **Permission issues**: Ensure check-in API has database write permissions
2. **Database constraints**: Check for any database errors in logs
3. **Status conflicts**: Verify assignment is still in `'scheduled'` status

## Benefits

- **Automatic workflow**: No manual intervention needed for normal operations
- **Real-time updates**: Status changes immediately when driver engages
- **Audit trail**: Timestamps track when assignments were activated/completed
- **Flexible control**: Manual override available for coordinators
- **Performance optimized**: Indexed queries for fast status lookups

## Future Enhancements

- **Time-based activation**: Auto-activate assignments past their start_time
- **Location-based activation**: Activate when driver starts location sharing
- **Completion detection**: Auto-complete assignments based on final check-ins
- **Status notifications**: Alert coordinators of status changes