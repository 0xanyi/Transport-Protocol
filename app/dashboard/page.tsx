'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Users, Car, Crown, Route, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    vips: 0,
    assignments: 0,
    loading: true
  })

  useEffect(() => {
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
    </div>
  )
}