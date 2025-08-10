import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🛡️ Middleware checking:', pathname)

  // Public routes that don't require authentication
  const publicPaths = [
    '/',
    '/auth/register',
    '/api/auth/login',
    '/api/drivers', // Allow driver registration
    '/api/debug' // Debug endpoints
  ]

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  })

  // Skip middleware for public paths and static files
  if (isPublicPath || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname.includes('.')) {
    console.log('✅ Public path, allowing access')
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const authContext = await getAuthContext(request)
  console.log('🔍 Auth context:', { isAuthenticated: authContext.isAuthenticated, user: authContext.user?.email })

  // Redirect to home if not authenticated
  if (!authContext.isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based access control for specific routes
  if (pathname.startsWith('/dashboard/users')) {
    // Only admins can access user management
    if (authContext.user?.role !== 'admin') {
      console.log('❌ Not admin, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  console.log('✅ Access granted to:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}