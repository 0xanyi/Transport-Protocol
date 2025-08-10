import jwt from 'jsonwebtoken'
import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { AuthUser, UserRole, Permission, ROLE_PERMISSIONS } from '@/types'

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
}

export function verifyToken(token: string): AuthUser | null {
  try {
    console.log('🔍 Verifying token with secret:', process.env.JWT_SECRET ? 'SET' : 'NOT SET')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any
    console.log('✅ Token decoded successfully:', { userId: decoded.userId, email: decoded.email })
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || '',
      role: decoded.role,
      department: decoded.department
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log('❌ Token verification failed:', message)
    return null
  }
}

// Edge Runtime compatible token verification for middleware
export async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(token, secret)
    
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string || '',
      role: payload.role as UserRole,
      department: payload.department as any
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log('❌ Edge token verification failed:', message)
    return null
  }
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const token = request.cookies.get('auth-token')?.value
  console.log('🍪 Cookie check:', { hasToken: !!token, tokenLength: token?.length })
  
  if (!token) {
    console.log('❌ No auth token found in cookies')
    return { user: null, isAuthenticated: false }
  }

  const user = await verifyTokenEdge(token)
  console.log('🔐 Token verification result:', { isValid: !!user, userEmail: user?.email })
  return {
    user,
    isAuthenticated: !!user
  }
}

export function hasPermission(
  userRole: UserRole, 
  resource: string, 
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  
  // Check for wildcard permission (admin)
  const hasWildcard = permissions.some(
    p => p.resource === '*' && (p.action === 'manage' || p.action === action)
  )
  
  if (hasWildcard) return true
  
  // Check for specific resource permission
  const hasResourcePermission = permissions.some(
    p => p.resource === resource && (p.action === 'manage' || p.action === action)
  )
  
  return hasResourcePermission
}

export function requireAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const authContext = await getAuthContext(request)
    
    if (!authContext.isAuthenticated || !authContext.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return handler(request, authContext)
  }
}

export function requirePermission(
  resource: string,
  action: string,
  handler: (request: NextRequest, context: AuthContext, routeContext?: any) => Promise<Response>
) {
  return async (request: NextRequest, routeContext?: any) => {
    const authContext = await getAuthContext(request)
    
    console.log('🔒 Permission check:', { 
      resource, 
      action, 
      isAuthenticated: authContext.isAuthenticated,
      userRole: authContext.user?.role 
    })
    
    if (!authContext.isAuthenticated || !authContext.user) {
      console.log('❌ Not authenticated for API')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!hasPermission(authContext.user.role, resource, action)) {
      console.log('❌ Insufficient permissions:', { userRole: authContext.user.role, resource, action })
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Permission granted')
    return handler(request, authContext, routeContext)
  }
}

export function requireRole(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return requireAuth(async (request: NextRequest, context: AuthContext) => {
    if (!context.user || !allowedRoles.includes(context.user.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient role permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, context)
  })
}

export function requireAdmin(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return requireRole(['admin'], handler)
}