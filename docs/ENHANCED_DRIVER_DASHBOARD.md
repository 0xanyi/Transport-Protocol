# Enhanced Driver Dashboard & Tracking System

## Overview

The enhanced driver dashboard introduces a comprehensive check-in system with daily and one-time check-ins, session support, and a real-time tracking dashboard for different departments.

## Features Implemented

### 1. Enhanced Check-in System

#### Daily Check-ins (Reset Daily)
- **Hotel → Events Venue**: Driver departing hotel to events venue
- **Arrived at Events Venue**: Driver has arrived at the events venue
- **Departing Events Venue**: Driver is leaving the events venue
- **Arrived at Hotel**: Driver has returned to hotel

**Key Features:**
- Reset daily at midnight
- Support multiple sessions per day (morning, evening, session_1, session_2)
- Require event date selection
- Prevent duplicate check-ins for same type/date/session combination

#### One-time Check-ins (Per Assignment)
- **Airport Arrival**: Driver has arrived at airport for pickup
- **VIP Pickup**: Driver has picked up the VIP
- **Custom**: Unlimited custom check-ins with user-defined labels

**Key Features:**
- Completed once per assignment (except custom)
- Custom check-ins allow unlimited entries with custom labels
- Persist throughout assignment lifecycle

### 2. New Tracking Dashboard

**Location:** `/dashboard/tracking`

**Access Control:**
- Admins: Full access
- Hospitality department: Read-only access
- Lounge department: Read-only access
- Transport coordinators: Read-only access

**Features:**
- Real-time driver location and status tracking
- VIP movement tracking based on check-ins
- Assignment progress visualization
- Advanced filtering and search capabilities
- Live status updates

## Database Changes

### New Migration: `009_update_checkin_types_events_venue.sql`

**New Check-in Types:**
```sql
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'hotel_to_events_venue';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'arrived_at_events_venue';
ALTER TYPE checkin_type ADD VALUE IF NOT EXISTS 'departing_events_venue';
```

**New Columns:**
- `session_id VARCHAR(20)`: Session identifier for daily check-ins
- `custom_label VARCHAR(255)`: Custom label for custom check-in types

**New Indexes:**
- Session-based queries optimization
- Custom check-ins indexing
- Tracking dashboard query optimization

**New View:**
- `driver_tracking_view`: Optimized view for tracking dashboard queries

## API Endpoints

### Enhanced Check-ins API

#### `POST /api/checkins`
Create a new check-in with enhanced features.

**Request Body:**
```json
{
  "assignment_id": "uuid",
  "checkin_type": "hotel_to_events_venue",
  "event_date": "2025-08-12", // Required for daily check-ins
  "session_id": "morning", // Optional for daily check-ins
  "custom_label": "Custom description", // Required for custom check-ins
  "notes": "Optional notes",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

**Response:**
```json
{
  "checkin": {
    "id": "uuid",
    "driver_id": "uuid",
    "assignment_id": "uuid",
    "checkin_type": "hotel_to_events_venue",
    "is_daily_checkin": true,
    "event_date": "2025-08-12",
    "session_id": "morning",
    "timestamp": "2025-08-12T10:30:00Z",
    "notes": "Optional notes"
  }
}
```

#### `GET /api/checkins/daily-status`
Get daily check-in status and progress for a driver's assignment.

**Query Parameters:**
- `assignment_id` (required): Assignment UUID
- `event_date` (optional): Date in YYYY-MM-DD format (defaults to today)

**Response:**
```json
{
  "progress": {
    "daily_checkins": [
      {
        "checkin_type": "hotel_to_events_venue",
        "completed": true,
        "sessions": {
          "morning": {
            "completed": true,
            "timestamp": "2025-08-12T08:30:00Z",
            "notes": "On time departure"
          }
        }
      }
    ],
    "one_time_checkins": {
      "airport_arrival": {
        "completed": true,
        "timestamp": "2025-08-12T06:00:00Z"
      },
      "vip_pickup": {
        "completed": false
      }
    },
    "custom_checkins": [
      {
        "id": "uuid",
        "label": "Fuel stop",
        "timestamp": "2025-08-12T09:15:00Z",
        "notes": "Quick fuel stop"
      }
    ]
  },
  "event_date": "2025-08-12"
}
```

### New Tracking API

#### `GET /api/tracking`
Get real-time tracking data for all active assignments.

**Query Parameters:**
- `driver_id` (optional): Filter by specific driver
- `assignment_status` (optional): Filter by assignment status
- `checkin_type` (optional): Filter by last check-in type
- `start_date` (optional): Date range start
- `end_date` (optional): Date range end

**Response:**
```json
{
  "tracking_info": [
    {
      "driver_id": "uuid",
      "driver_name": "John Doe",
      "driver_phone": "+44 7700 900123",
      "assignment_id": "uuid",
      "vip_name": "Jane Smith",
      "vehicle_info": "BMW X5 (AB12 CDE)",
      "current_status": "At Events Venue",
      "last_checkin": {
        "id": "uuid",
        "checkin_type": "arrived_at_events_venue",
        "session_id": "morning",
        "timestamp": "2025-08-12T10:30:00Z",
        "notes": "Arrived on time"
      },
      "location": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "address": "London, UK"
      },
      "assignment_progress": {
        "daily_checkins": [...],
        "one_time_checkins": {...},
        "custom_checkins": [...]
      }
    }
  ],
  "filters_applied": {...},
  "total_count": 5
}
```

## TypeScript Types

### New Types Added

```typescript
// Daily Check-ins (reset daily, support multiple sessions)
export type DailyCheckinType = 
  | 'hotel_to_events_venue'
  | 'arrived_at_events_venue'
  | 'departing_events_venue'
  | 'arrived_at_hotel'

// One-time Check-ins (per assignment)
export type OneTimeCheckinType = 
  | 'airport_arrival'
  | 'vip_pickup'
  | 'custom'

// Enhanced Checkin interface
export interface Checkin {
  id: string
  driver_id: string
  assignment_id: string
  checkin_type: CheckinType
  latitude?: number
  longitude?: number
  notes?: string
  timestamp: Date
  created_at: Date
  // New fields
  is_daily_checkin?: boolean
  event_date?: string
  session_id?: string
  custom_label?: string
}

// Progress tracking
export interface CheckinProgress {
  daily_checkins: DailyCheckinStatus[]
  one_time_checkins: {
    [key in OneTimeCheckinType]: {
      completed: boolean
      timestamp?: Date
      notes?: string
    }
  }
  custom_checkins: Array<{
    id: string
    label: string
    timestamp: Date
    notes?: string
  }>
}

// Tracking dashboard
export interface DriverTrackingInfo {
  driver_id: string
  driver_name: string
  driver_phone: string
  assignment_id?: string
  vip_name?: string
  vehicle_info?: string
  current_status: string
  last_checkin?: Checkin
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  assignment_progress: CheckinProgress
}
```

## UI Components

### Enhanced Driver Dashboard (`/dashboard/driver`)

**New Sections:**
1. **Event Date Selector**: Allows drivers to select the event date for daily check-ins
2. **Daily Check-ins**: Separate section for daily check-ins with session support
3. **One-time Check-ins**: Section for assignment-specific check-ins
4. **Enhanced Check-in Form**: 
   - Session selection for daily check-ins
   - Custom label input for custom check-ins
   - Notes field for all check-ins

**Features:**
- Real-time progress tracking
- Visual indicators for completed check-ins
- Session badges and labels
- Custom check-in history

### New Tracking Dashboard (`/dashboard/tracking`)

**Components:**
1. **Search and Filter Bar**: Real-time search and advanced filtering
2. **Driver Status Cards**: Individual cards showing:
   - Driver information and contact
   - VIP assignment details
   - Vehicle information
   - Current status with color coding
   - Last check-in details
   - Location information
   - Assignment progress summary

**Features:**
- Real-time status updates
- Department-based access control
- Advanced filtering by status, check-in type, date range
- Search by driver name, VIP name, or vehicle
- Responsive grid layout
- Auto-refresh functionality

### Navigation Updates

**New Navigation Item:**
- **Tracking**: Available to Admins, Hospitality, Lounge, and Transport departments
- Icon: Navigation compass
- Access control based on user role and department

## Access Control

### Department-Based Access

**Tracking Dashboard Access:**
- **Admin**: Full access to all features
- **Hospitality Department**: Read-only access to tracking data
- **Lounge Department**: Read-only access to tracking data
- **Transport Department**: Read-only access to tracking data
- **Drivers**: No access (use their own dashboard)

**Check-in System:**
- **Drivers**: Can create check-ins for their own assignments
- **All other roles**: Read-only access through tracking dashboard

## Session Management

### Daily Check-in Sessions

**Supported Session Types:**
- `morning`: Morning session
- `evening`: Evening session
- `session_1`: Generic session 1
- `session_2`: Generic session 2

**Session Logic:**
- Each daily check-in type can have multiple sessions per day
- Sessions are identified by `session_id`
- Prevents duplicate check-ins for same type/date/session
- Allows multiple check-ins of same type on different sessions

## Status Mapping

### Driver Status Determination

**Status Priority (based on last check-in):**
1. `airport_arrival` → "At Airport"
2. `vip_pickup` → "With VIP"
3. `hotel_to_events_venue` → "En Route to Events Venue"
4. `arrived_at_events_venue` → "At Events Venue"
5. `departing_events_venue` → "Departing Events Venue"
6. `arrived_at_hotel` → "At Hotel"
7. `custom` → "Custom Location"
8. No check-ins → "Available" or "Scheduled"

## Future Enhancements

### Planned Features
1. **Google Maps Integration**: Live location tracking with map visualization
2. **WebSocket Support**: Real-time updates without page refresh
3. **Push Notifications**: Alerts for important check-ins
4. **Geofencing**: Automatic check-ins based on location
5. **Analytics Dashboard**: Check-in patterns and performance metrics
6. **Mobile App**: Native mobile application for drivers

### Technical Improvements
1. **Caching Layer**: Redis caching for frequently accessed data
2. **Background Jobs**: Automated daily reset and cleanup tasks
3. **API Rate Limiting**: Prevent abuse of tracking endpoints
4. **Data Export**: CSV/Excel export for tracking data
5. **Audit Logging**: Comprehensive audit trail for all actions

## Testing

### Manual Testing Checklist

**Driver Dashboard:**
- [ ] Event date selection updates check-in progress
- [ ] Daily check-ins show session options
- [ ] One-time check-ins prevent duplicates (except custom)
- [ ] Custom check-ins require labels
- [ ] Check-in history shows sessions and labels
- [ ] Progress indicators update correctly

**Tracking Dashboard:**
- [ ] Access control works for different departments
- [ ] Search functionality works across all fields
- [ ] Filters apply correctly
- [ ] Status colors and badges display properly
- [ ] Real-time updates work (manual refresh)
- [ ] Driver cards show all relevant information

**API Endpoints:**
- [ ] Check-in creation with all new fields
- [ ] Daily status endpoint returns correct progress
- [ ] Tracking endpoint filters work correctly
- [ ] Error handling for invalid requests
- [ ] Authentication and authorization

## Deployment Notes

### Database Migration
1. Run the new migration: `009_update_checkin_types_events_venue.sql`
2. Verify new columns and indexes are created
3. Test the new tracking view

### Environment Variables
No new environment variables required.

### Dependencies
No new dependencies added - uses existing tech stack.

### Monitoring
- Monitor API response times for tracking endpoints
- Watch for database performance with new indexes
- Track user adoption of new features

## Tracking Widget Integration

### Main Dashboard Integration

The tracking widget has been integrated into the main dashboard (`/dashboard/page.tsx`) for users with appropriate access:

**Widget Features:**
- **Automatic Access Control**: Only shows for users with tracking permissions
- **Compact View**: Shows up to 4 drivers in a scrollable compact format
- **Real-time Data**: Displays current driver status and progress
- **Quick Actions**: Refresh button and "View All" link to full tracking dashboard

**Widget Props:**
```typescript
<TrackingWidget
  currentUser={currentUser}
  maxItems={4}           // Limit number of drivers shown
  showHeader={true}      // Show widget header with title and actions
  compact={true}         // Enable compact scrollable view
/>
```

**Access Control:**
- **Admin**: Full widget access on main dashboard
- **Hospitality Department**: Widget shows on main dashboard
- **Lounge Department**: Widget shows on main dashboard
- **Transport Department**: Widget shows on main dashboard
- **Drivers**: Widget hidden (they use their own dashboard)

### Widget Components

**New Component:** [`components/ui/tracking-widget.tsx`](components/ui/tracking-widget.tsx)

**Features:**
- Responsive design with driver status cards
- Progress indicators for daily, one-time, and custom check-ins
- Last check-in information with timestamps
- VIP and vehicle assignment details
- Direct link to full tracking dashboard
- Auto-refresh functionality
- Error handling and loading states

## Support and Maintenance

### Common Issues
1. **Check-in Conflicts**: Users trying to check-in multiple times for same type/session
2. **Access Denied**: Users without proper department access trying to access tracking
3. **Missing Progress**: Check-in progress not loading due to API errors
4. **Widget Not Showing**: User doesn't have tracking access permissions

### Troubleshooting
1. Check user role and department assignments
2. Verify database migration completed successfully
3. Monitor API logs for error patterns
4. Ensure session storage is working for authentication
5. Verify tracking widget access control logic

### Maintenance Tasks
1. **Daily**: Monitor check-in patterns and API performance
2. **Weekly**: Review tracking dashboard usage analytics
3. **Monthly**: Clean up old check-in data if needed
4. **Quarterly**: Review and optimize database indexes
5. **As Needed**: Update widget display limits based on usage patterns