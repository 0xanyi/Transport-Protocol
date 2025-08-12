'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Car, 
  Calendar, 
  UserCheck, 
  LogOut, 
  Home, 
  User, 
  Shield, 
  Navigation,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthUser } from '@/types'
import { canAccessDepartment, canViewResource, hasTrackingOnlyAccess } from '@/lib/permissions'

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
    title: 'Tracking',
    href: '/dashboard/tracking',
    icon: Navigation,
    trackingAccess: true,
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

interface MobileNavProps {
  currentUser: AuthUser | null
}

export function MobileNav({ currentUser }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const currentXRef = useRef<number>(0)

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Handle touch gestures for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    currentXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOpen) return
    
    currentXRef.current = e.touches[0].clientX
    const deltaX = currentXRef.current - startXRef.current
    
    // Only allow swiping right (positive deltaX) to close
    if (deltaX > 0 && menuRef.current) {
      const translateX = Math.min(deltaX, 256) // Max translate is menu width
      menuRef.current.style.transform = `translateX(${translateX}px)`
      menuRef.current.style.opacity = `${1 - (translateX / 256) * 0.5}`
    }
  }

  const handleTouchEnd = () => {
    if (!isOpen || !menuRef.current) return
    
    const deltaX = currentXRef.current - startXRef.current
    
    // If swiped more than 50px to the right, close the menu
    if (deltaX > 50) {
      closeMenu()
    } else {
      // Reset position
      menuRef.current.style.transform = 'translateX(0)'
      menuRef.current.style.opacity = '1'
    }
  }

  const openMenu = () => {
    setIsAnimating(true)
    setIsOpen(true)
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden'
    setTimeout(() => setIsAnimating(false), 300)
  }

  const closeMenu = () => {
    setIsAnimating(true)
    setIsOpen(false)
    // Restore body scroll
    document.body.style.overflow = 'unset'
    if (menuRef.current) {
      menuRef.current.style.transform = 'translateX(0)'
      menuRef.current.style.opacity = '1'
    }
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      sessionStorage.removeItem('isAuthenticated')
      sessionStorage.removeItem('currentUser')
      router.push('/')
    }
  }

  const getVisibleNavItems = () => {
    if (!currentUser) return []
    
    const isTrackingOnly = hasTrackingOnlyAccess(currentUser)
    
    const filteredItems = navItems.filter((item: any) => {
      if (item.adminOnly && currentUser.role !== 'admin') {
        return false
      }
      if (item.driverOnly && currentUser.role !== 'driver') {
        return false
      }
      return true
    })
    
    if (isTrackingOnly) {
      return filteredItems.filter(item => item.title === 'Tracking')
    }
    
    switch (currentUser.role) {
      case 'admin':
        return filteredItems.filter(item => !item.driverOnly)
      case 'coordinator':
        if (currentUser.department === 'transport') {
          return filteredItems.filter(item => ['VIPs', 'Assignments', 'Drivers', 'Vehicles', 'Tracking'].includes(item.title))
        } else {
          return filteredItems.filter(item => item.title === 'Tracking')
        }
      case 'team_head':
        if (currentUser.department === 'transport') {
          return filteredItems.filter(item => ['VIPs', 'Assignments', 'Drivers', 'Vehicles', 'Tracking'].includes(item.title))
        } else {
          return filteredItems.filter(item => item.title === 'Tracking')
        }
      case 'driver':
        return filteredItems.filter(item => ['My Dashboard'].includes(item.title))
      default:
        return []
    }
  }

  const visibleNavItems = getVisibleNavItems()

  return (
    <>
      {/* Mobile Navigation Header */}
      <nav className="bg-white shadow-sm border-b lg:hidden">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Home className="w-5 h-5" />
              <span className="font-semibold text-lg">STPPL</span>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isOpen ? closeMenu() : openMenu()}
              className="touch-target"
              disabled={isAnimating}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={closeMenu} />
          <div
            ref={menuRef}
            className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl transition-transform duration-300 ease-out"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold text-lg">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="touch-target"
                  disabled={isAnimating}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Info */}
              {currentUser && (
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{currentUser.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs capitalize">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                        {currentUser.department && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs capitalize">
                            {currentUser.department === 'all' ? 'All Depts' : currentUser.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto mobile-scroll">
                <div className="p-2">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          'mobile-nav-item',
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start mobile-nav-item text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}