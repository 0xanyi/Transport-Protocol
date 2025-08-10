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
  // Admins can manage everything
  if (user.role === 'admin') {
    return true
  }

  // Coordinators can manage resources in their department
  if (user.role === 'coordinator' && resourceDepartment) {
    return canAccessDepartment(user, resourceDepartment)
  }

  // Team heads have read-only access in their department
  if (user.role === 'team_head' && resourceDepartment) {
    return canAccessDepartment(user, resourceDepartment)
  }

  // Resource-specific rules
  switch (resource) {
    case 'drivers':
      return user.role === 'admin' || 
             (user.role === 'coordinator' && user.department === 'transport')
    
    case 'vehicles':
      return user.role === 'admin' || 
             (user.role === 'coordinator' && user.department === 'transport')
    
    case 'vips':
      // VIPs can be managed by hospitality and transport coordinators
      return user.role === 'admin' || 
             (user.role === 'coordinator' && 
              (user.department === 'hospitality' || user.department === 'transport'))
    
    case 'assignments':
      return user.role === 'admin' || 
             (user.role === 'coordinator' && user.department === 'transport')
    
    default:
      return false
  }
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