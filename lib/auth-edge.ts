import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import type { AuthUser, UserRole } from '@/types'

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
}

async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: payload.role as UserRole,
      department: payload.department as any
    }
  } catch (error: any) {
    console.log('❌ Edge token verification failed:', error?.message)
    return null
  }
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return { user: null, isAuthenticated: false }
  const user = await verifyTokenEdge(token)
  return { user, isAuthenticated: !!user }
}
