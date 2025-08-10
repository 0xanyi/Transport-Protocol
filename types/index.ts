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
    { resource: 'drivers', action: 'read' },
    { resource: 'vehicles', action: 'read' },
    { resource: 'vips', action: 'read' },
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
    { resource: 'profile', action: 'read' }
  ]
}