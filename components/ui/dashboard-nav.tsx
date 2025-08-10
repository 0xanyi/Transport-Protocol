'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Car, Calendar, UserCheck, LogOut, Home, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthUser } from '@/types'

const navItems = [
  {
    title: 'Drivers',
    href: '/dashboard/drivers',
    icon: Users,
  },
  {
    title: 'Vehicles',
    href: '/dashboard/vehicles',
    icon: Car,
  },
  {
    title: 'VIPs',
    href: '/dashboard/vips',
    icon: UserCheck,
  },
  {
    title: 'Assignments',
    href: '/dashboard/assignments',
    icon: Calendar,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Shield,
    adminOnly: true,
  },
  {
    title: 'My Dashboard',
    href: '/dashboard/driver',
    icon: Home,
    driverOnly: true,
  },
]

interface DashboardNavProps {
  currentUser: AuthUser | null
}

export function DashboardNav({ currentUser }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local storage and redirect
      sessionStorage.removeItem('isAuthenticated')
      sessionStorage.removeItem('currentUser')
      router.push('/')
    }
  }

  // Filter nav items based on user role
  const getVisibleNavItems = () => {
    if (!currentUser) return []
    
    // Filter out admin-only and driver-only items based on user role
    const filteredItems = navItems.filter((item: any) => {
      if (item.adminOnly && currentUser.role !== 'admin') {
        return false
      }
      if (item.driverOnly && currentUser.role !== 'driver') {
        return false
      }
      return true
    })
    
    switch (currentUser.role) {
      case 'admin':
        return filteredItems.filter(item => !item.driverOnly) // Admins see everything except driver-specific
      case 'coordinator':
        return filteredItems.filter(item => ['VIPs', 'Assignments', 'Drivers'].includes(item.title))
      case 'team_head':
        return filteredItems.filter(item => ['VIPs', 'Assignments', 'Drivers'].includes(item.title))
      case 'driver':
        return filteredItems.filter(item => ['My Dashboard'].includes(item.title))
      default:
        return []
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-5 h-5" />
              <span className="font-semibold text-lg">STPPL Transport</span>
            </Link>
            
            <div className="flex space-x-4">
              {getVisibleNavItems().map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{currentUser.name}</span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                    {currentUser.department && (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded capitalize">
                        {currentUser.department === 'all' ? 'All Depts' : currentUser.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}