import { AuthUser, DepartmentType, UserRole } from '@/types'

export function canAccessDepartment(
  user: AuthUser,
  requiredDepartment: DepartmentType
): boolean {
  // Admins can access all departments
  if (user.role === 'admin' || user.department === 'all') {
    return true
  }

  // Users can access their own department
  if (user.department === requiredDepartment) {
    return true
  }

  // Transport department can access driver-related features
  if (user.department === 'transport' && requiredDepartment === 'transport') {
    return true
  }

  return false
}

export function getDepartmentLabel(department: DepartmentType): string {
  const labels: Record<DepartmentType, string> = {
    hospitality: 'Hospitality Team',
    lounge: 'Lounge Team',
    transport: 'Transport Team',
    operations: 'Operations Team',
    all: 'All Departments'
  }
  return labels[department] || department
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'System Administrator',
    coordinator: 'Coordinator',
    team_head: 'Team Head',
    driver: 'Driver'
  }
  return labels[role] || role
}

export function canManageResource(
  user: AuthUser,
  resource: string,
  resourceDepartment?: DepartmentType
): boolean {
  // Resource-specific rules - only transport department can manage most resources
  switch (resource) {
    case 'drivers':
      return (user.role === 'admin') || (user.role === 'coordinator' && user.department === 'transport')
    
    case 'vehicles':
      return (user.role === 'admin') || (user.role === 'coordinator' && user.department === 'transport')
    
    case 'vips':
      // Only transport coordinators can manage VIPs now
      return (user.role === 'admin') || (user.role === 'coordinator' && user.department === 'transport')
    
    case 'assignments':
      return (user.role === 'admin') || (user.role === 'coordinator' && user.department === 'transport')
    
    case 'users':
      return user.role === 'admin'
    
    default:
      return user.role === 'admin'
  }
}

// New function to check if user can view resources (read-only)
export function canViewResource(
  user: AuthUser,
  resource: string
): boolean {
  // Admins can view everything
  if (user.role === 'admin') {
    return true
  }

  // Transport department can view everything
  if (user.department === 'transport') {
    return true
  }

  // Restricted departments can only view tracking
  if (['hospitality', 'lounge', 'operations'].includes(user.department)) {
    return resource === 'tracking'
  }

  return false
}

// Check if user has tracking-only access (restricted departments)
export function hasTrackingOnlyAccess(user: AuthUser): boolean {
  return ['hospitality', 'lounge', 'operations'].includes(user.department) &&
         user.role !== 'admin'
}

export const DEPARTMENT_COLORS: Record<DepartmentType, string> = {
  hospitality: 'bg-pink-100 text-pink-800',
  lounge: 'bg-indigo-100 text-indigo-800',
  transport: 'bg-orange-100 text-orange-800',
  operations: 'bg-teal-100 text-teal-800',
  all: 'bg-gray-100 text-gray-800'
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  coordinator: 'bg-blue-100 text-blue-800',
  team_head: 'bg-purple-100 text-purple-800',
  driver: 'bg-green-100 text-green-800'
}