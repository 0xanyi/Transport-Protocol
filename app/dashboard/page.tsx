'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrackingWidget } from '@/components/ui/tracking-widget'
import { createClient } from '@/lib/supabase/client'
import { AuthUser } from '@/types'
import { hasTrackingOnlyAccess } from '@/lib/permissions'
import { Users, Car, Crown, Route, ArrowRight, Navigation, MapPin, Clock, Activity } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    vips: 0,
    assignments: 0,
    loading: true
  })

  useEffect(() => {
    // Get current user from session storage
    const userDataString = sessionStorage.getItem('currentUser')
    if (userDataString) {
      const userData = JSON.parse(userDataString) as AuthUser
      setCurrentUser(userData)
    }
    
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      
      const [driversResult, vehiclesResult, vipsResult, assignmentsResult] = await Promise.all([
        supabase.from('drivers').select('id', { count: 'exact' }),
        supabase.from('vehicles').select('id', { count: 'exact' }),
        supabase.from('vips').select('id', { count: 'exact' }),
        supabase.from('assignments').select('id', { count: 'exact' })
      ])

      setStats({
        drivers: driversResult.count || 0,
        vehicles: vehiclesResult.count || 0,
        vips: vipsResult.count || 0,
        assignments: assignmentsResult.count || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const dashboardItems = [
    {
      title: 'Drivers',
      description: 'Manage driver registrations and approvals',
      count: stats.drivers,
      icon: Users,
      href: '/dashboard/drivers',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Vehicles',
      description: 'Track vehicle assignments and availability',
      count: stats.vehicles,
      icon: Car,
      href: '/dashboard/vehicles',
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'VIPs',
      description: 'Manage VIP itineraries and travel schedules',
      count: stats.vips,
      icon: Crown,
      href: '/dashboard/vips',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Assignments',
      description: 'Coordinate driver and vehicle assignments',
      count: stats.assignments,
      icon: Route,
      href: '/dashboard/assignments',
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  // Check if user has tracking-only access
  const isTrackingOnly = currentUser ? hasTrackingOnlyAccess(currentUser) : false

  // Render streamlined dashboard for restricted departments
  if (isTrackingOnly) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to STPPL Transport</h1>
          <p className="text-gray-600 mt-2">
            {currentUser?.department === 'hospitality' && 'Hospitality Team Dashboard'}
            {currentUser?.department === 'lounge' && 'Lounge Services Dashboard'}
            {currentUser?.department === 'operations' && 'Operations Team Dashboard'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Real-time tracking and coordination</p>
        </div>

        {/* Welcome Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-blue-900">Live Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-blue-800 text-sm">
                Monitor real-time driver locations and status updates for seamless coordination
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-green-900">Location Updates</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-green-800 text-sm">
                Stay informed with automatic location updates and check-in notifications
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-purple-900">Status Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-purple-800 text-sm">
                Track driver and guest movement status for optimal service coordination
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access to Tracking */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span>Access Tracking Dashboard</span>
            </CardTitle>
            <CardDescription>
              View real-time driver locations and status updates
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push('/dashboard/tracking')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Open Tracking Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Tracking Widget - Compact view */}
        <TrackingWidget
          currentUser={currentUser}
          maxItems={6}
          showHeader={true}
          compact={true}
        />

      </div>
    )
  }

  // Regular dashboard for transport department and admins
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">STPPL Transport Protocol Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(item.href)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className={`p-2 rounded-md ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.loading ? '...' : item.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard/drivers')}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Review Driver Applications</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => router.push('/dashboard/assignments')}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Create New Assignment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => router.push('/dashboard/vehicles')}
              className="w-full justify-between"
              variant="outline"
            >
              <span>Check Vehicle Availability</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Connection</span>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Authentication</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Environment</span>
              <span className="text-sm text-blue-600 font-medium">Development</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Widget - Only show for users with tracking access */}
      <TrackingWidget
        currentUser={currentUser}
        maxItems={4}
        showHeader={true}
        compact={true}
      />
    </div>
  )
}