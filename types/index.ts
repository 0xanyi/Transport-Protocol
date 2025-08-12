export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  kingschat_handle: string
  home_address: string
  home_post_code: string
  church: string
  zone: string
  group: string
  emergency_contact_name: string
  emergency_contact_phone: string
  years_driving_experience: number
  license_duration_years: number
  availability_start: Date
  availability_end: Date
  status: 'pending' | 'approved' | 'active' | 'inactive'
  user_id?: string
  current_location?: Location
  current_assignment?: string
  created_at: Date
  updated_at: Date
}

export interface Vehicle {
  id: string
  make: string
  model: string
  registration: string
  is_hired: boolean
  pickup_location: string
  pickup_mileage: number
  pickup_fuel_gauge: number
  pickup_photos: string[]
  pickup_date: Date
  dropoff_mileage?: number
  dropoff_fuel_gauge?: number
  dropoff_photos?: string[]
  dropoff_date?: Date
  current_driver_id?: string
  created_at: Date
  updated_at: Date
}

export interface VIP {
  id: string
  name: string
  arrival_date: Date
  arrival_time: string
  arrival_airport: string
  arrival_terminal: string
  departure_date: Date
  departure_time: string
  departure_airport: string
  departure_terminal: string
  remarks?: string
  assigned_driver_id?: string
  created_at: Date
  updated_at: Date
}

export interface Assignment {
  id: string
  driver_id: string
  vip_id?: string
  vehicle_id: string
  start_time: Date
  end_time?: Date
  status: 'scheduled' | 'active' | 'completed'
  activated_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface AssignmentWithDetails extends Assignment {
  driver?: Driver
  vehicle?: Vehicle
  vip?: VIP
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
}

export interface LocationUpdate {
  id: string
  driver_id: string
  latitude: number
  longitude: number
  timestamp: Date
  status: 'enroute' | 'at_airport' | 'at_hotel' | 'at_venue' | 'available'
  created_at: Date
}

// Daily Check-ins (reset daily, support multiple sessions)
export type DailyCheckinType =
  | 'hotel_to_events_venue'    // Hotel → Events Venue
  | 'arrived_at_events_venue'  // Arrived at Events Venue
  | 'departing_events_venue'   // Departing Events Venue
  | 'arrived_at_hotel'         // Arrived at Hotel

// One-time Check-ins (per assignment)
export type OneTimeCheckinType =
  | 'airport_arrival'          // Airport Arrival (for pickup)
  | 'vip_pickup'              // VIP Pickup
  | 'custom'                  // Custom (unlimited)

// Legacy check-in types (for backward compatibility)
export type LegacyCheckinType = 'enroute_hotel' | 'hotel_arrival' | 'event_departure'

export type CheckinType = DailyCheckinType | OneTimeCheckinType | LegacyCheckinType

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
  // New fields for enhanced check-in system
  is_daily_checkin?: boolean
  event_date?: string
  session_id?: string
  custom_label?: string
}

export interface VehicleObservation {
  id: string
  driver_id: string
  vehicle_id: string
  assignment_id: string
  observation_type: 'pickup' | 'dropoff' | 'maintenance_issue'
  mileage?: number
  fuel_level?: number
  damage_notes?: string
  photos?: string[]
  timestamp: Date
  created_at: Date
}

// New types for enhanced check-in system
export interface CheckinSession {
  id: string
  label: string
  description: string
}

export interface DailyCheckinStatus {
  checkin_type: DailyCheckinType
  completed: boolean
  sessions: {
    [session_id: string]: {
      completed: boolean
      timestamp?: Date
      notes?: string
    }
  }
}

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

// Tracking dashboard types
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

export interface TrackingDashboardFilters {
  driver_id?: string
  assignment_status?: 'scheduled' | 'active' | 'completed'
  date_range?: {
    start: Date
    end: Date
  }
  checkin_type?: CheckinType
}

export type UserRole = 'admin' | 'coordinator' | 'team_head' | 'driver'

export type DepartmentType = 'hospitality' | 'lounge' | 'transport' | 'operations' | 'all'

export interface User {
  id: string
  email: string
  password_hash?: string
  name: string
  role: UserRole
  department: DepartmentType
  status: 'active' | 'inactive'
  created_by?: string
  created_at: Date
  updated_at: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  department: DepartmentType
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: UserRole
  department: DepartmentType
}

export interface UpdateUserRequest {
  name?: string
  role?: UserRole
  department?: DepartmentType
  status?: 'active' | 'inactive'
}

export interface UserWithCreator extends User {
  created_by_user?: User
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: '*', action: 'manage' },
    { resource: 'users', action: 'manage' }
  ],
  coordinator: [
    { resource: 'drivers', action: 'manage' },
    { resource: 'vehicles', action: 'manage' },
    { resource: 'vips', action: 'manage' },
    { resource: 'assignments', action: 'manage' },
    { resource: 'location_updates', action: 'read' }
  ],
  team_head: [
    { resource: 'drivers', action: 'read' },
    { resource: 'vehicles', action: 'read' },
    { resource: 'vips', action: 'read' },
    { resource: 'assignments', action: 'read' },
    { resource: 'location_updates', action: 'read' }
  ],
  driver: [
    { resource: 'assignments', action: 'read' },
    { resource: 'location_updates', action: 'create' },
    { resource: 'checkins', action: 'create' },
    { resource: 'vehicle_observations', action: 'create' },
    { resource: 'profile', action: 'read' }
  ]
}