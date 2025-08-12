'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav } from '@/components/ui/dashboard-nav'
import { AuthUser } from '@/types'
import { hasTrackingOnlyAccess } from '@/lib/permissions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('isAuthenticated')
    const userDataString = sessionStorage.getItem('currentUser')
    
    console.log('🔍 Dashboard auth check:', { isAuthenticated, hasUserData: !!userDataString })
    
    if (!isAuthenticated || !userDataString) {
      console.log('❌ No auth data, redirecting to home')
      router.push('/')
      return
    }

    try {
      const userData = JSON.parse(userDataString) as AuthUser
      console.log('✅ Dashboard auth successful for:', userData.name)
      setCurrentUser(userData)
      
      // Redirect drivers to their specific dashboard
      if (userData.role === 'driver' && window.location.pathname === '/dashboard') {
        router.push('/dashboard/driver')
        return
      }
      
      // Check if user is trying to access restricted pages
      const currentPath = window.location.pathname
      const isRestrictedUser = hasTrackingOnlyAccess(userData)
      
      if (isRestrictedUser) {
        // Restricted users can only access dashboard and tracking
        const allowedPaths = ['/dashboard', '/dashboard/tracking']
        const isAllowedPath = allowedPaths.some(path => currentPath === path || currentPath.startsWith(path))
        
        if (!isAllowedPath) {
          console.log('🚫 Restricted user trying to access unauthorized page, redirecting to dashboard')
          router.push('/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('❌ Error parsing user data:', error)
      router.push('/')
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav currentUser={currentUser} />
      <main className="container mx-auto mobile-padding py-4 sm:py-6 lg:py-8 safe-bottom">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}