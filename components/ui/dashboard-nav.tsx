'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Users, Car, Calendar, UserCheck, LogOut, Home, User } from 'lucide-react'
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
]

interface DashboardNavProps {
  currentUser: AuthUser | null
}

export function DashboardNav({ currentUser }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated')
    sessionStorage.removeItem('currentUser')
    router.push('/')
  }

  // Filter nav items based on user role
  const getVisibleNavItems = () => {
    if (!currentUser) return []
    
    switch (currentUser.role) {
      case 'admin':
        return navItems // Admins see everything
      case 'coordinator':
        return navItems.filter(item => ['VIPs', 'Assignments', 'Drivers'].includes(item.title))
      case 'driver':
        return navItems.filter(item => ['Assignments'].includes(item.title))
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
                <span>{currentUser.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                  {currentUser.role}
                </span>
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