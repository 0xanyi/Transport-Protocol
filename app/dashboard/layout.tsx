'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav } from '@/components/ui/dashboard-nav'
import { AuthUser } from '@/types'

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
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}