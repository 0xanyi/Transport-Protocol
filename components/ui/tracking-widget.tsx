'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthUser, DriverTrackingInfo } from '@/types'
import { canAccessDepartment, hasTrackingOnlyAccess } from '@/lib/permissions'
import { 
  MapPin, 
  Clock, 
  Phone, 
  Car,
  User,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Navigation,
  ExternalLink,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface TrackingWidgetProps {
  currentUser: AuthUser | null
  maxItems?: number
  showHeader?: boolean
  compact?: boolean
}

export function TrackingWidget({ 
  currentUser, 
  maxItems = 6, 
  showHeader = true,
  compact = false 
}: TrackingWidgetProps) {
  const [trackingData, setTrackingData] = useState<DriverTrackingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (currentUser) {
      // Check if user has access to tracking data
      const hasAccess = currentUser.role === 'admin' || 
                       canAccessDepartment(currentUser, 'hospitality') ||
                       canAccessDepartment(currentUser, 'lounge') ||
                       canAccessDepartment(currentUser, 'transport')

      if (hasAccess) {
        fetchTrackingData()
      } else {
        setError('No tracking access')
        setLoading(false)
      }
    } else {
      setError('Authentication required')
      setLoading(false)
    }
  }, [currentUser])

  const fetchTrackingData = async () => {
    try {
      setRefreshing(true)
      
      const response = await fetch('/api/tracking')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data')
      }

      const data = await response.json()
      setTrackingData(data.tracking_info?.slice(0, maxItems) || [])
      setError(null)
      
    } catch (error) {
      console.error('Error fetching tracking data:', error)
      setError('Failed to load tracking data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchTrackingData()
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'At Airport': 'bg-blue-100 text-blue-800',
      'With VIP': 'bg-purple-100 text-purple-800',
      'En Route to Events Venue': 'bg-yellow-100 text-yellow-800',
      'At Events Venue': 'bg-green-100 text-green-800',
      'Departing Events Venue': 'bg-orange-100 text-orange-800',
      'At Hotel': 'bg-indigo-100 text-indigo-800',
      'Available': 'bg-gray-100 text-gray-800',
      'Scheduled': 'bg-gray-100 text-gray-800',
      'Active': 'bg-green-100 text-green-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!currentUser || error === 'No tracking access') {
    return null // Don't show widget if user doesn't have access
  }

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span>Driver Tracking</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading tracking data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && error !== 'No tracking access') {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span>Driver Tracking</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{error}</p>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <span>Driver Tracking</span>
              </CardTitle>
              <CardDescription>Real-time driver and VIP movement</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard/tracking">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        {trackingData.length === 0 ? (
          <div className="text-center py-8">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Drivers</h3>
            <p className="text-gray-600">No drivers with active assignments found.</p>
          </div>
        ) : (
          <div className={`space-y-4 ${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
            {trackingData.map((driver) => {
              const isRestrictedUser = currentUser ? hasTrackingOnlyAccess(currentUser) : false
              
              return (
                <div key={driver.driver_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Driver Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{driver.driver_name}</h4>
                        {!isRestrictedUser && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{driver.driver_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(driver.current_status)}>
                      {driver.current_status}
                    </Badge>
                  </div>

                  {/* Assignment Info */}
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    {/* VIP Information - Always show for restricted users as requested */}
                    {driver.vip_name && (
                      <div className="bg-purple-50 rounded-md p-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="w-3 h-3 text-purple-600" />
                          <span className="text-xs font-medium text-purple-900">VIP</span>
                        </div>
                        <p className="text-sm text-purple-800">{driver.vip_name}</p>
                      </div>
                    )}

                    {/* Vehicle Information - Hide for restricted users */}
                    {driver.vehicle_info && !isRestrictedUser && (
                      <div className="bg-green-50 rounded-md p-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Car className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-900">Vehicle</span>
                        </div>
                        <p className="text-sm text-green-800">{driver.vehicle_info}</p>
                      </div>
                    )}
                  </div>

                  {/* Last Check-in */}
                  {driver.last_checkin && (
                    <div className="bg-blue-50 rounded-md p-2 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900">Last Check-in</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-blue-700">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(driver.last_checkin.timestamp), 'HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-blue-800">
                          {driver.last_checkin.checkin_type === 'custom' && driver.last_checkin.custom_label
                            ? driver.last_checkin.custom_label
                            : driver.last_checkin.checkin_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </p>
                        {driver.last_checkin.session_id && !isRestrictedUser && (
                          <Badge variant="outline" className="text-xs">
                            {driver.last_checkin.session_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

        {/* View All Link */}
        {trackingData.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/dashboard/tracking">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Tracking Dashboard
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}