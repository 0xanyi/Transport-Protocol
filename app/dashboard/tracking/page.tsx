'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthUser, DriverTrackingInfo, TrackingDashboardFilters } from '@/types'
import { canAccessDepartment, hasTrackingOnlyAccess } from '@/lib/permissions'
import { 
  MapPin, 
  Clock, 
  Phone, 
  Car,
  User,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Navigation,
  Calendar,
  Search
} from 'lucide-react'
import { format } from 'date-fns'

export default function TrackingDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [trackingData, setTrackingData] = useState<DriverTrackingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<TrackingDashboardFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Get current user from session storage
    const userDataString = sessionStorage.getItem('currentUser')
    
    if (userDataString) {
      const userData = JSON.parse(userDataString) as AuthUser
      setCurrentUser(userData)
      
      // Check if user has access to tracking dashboard
      const hasAccess = userData.role === 'admin' || 
                       canAccessDepartment(userData, 'hospitality') ||
                       canAccessDepartment(userData, 'lounge') ||
                       canAccessDepartment(userData, 'transport')

      if (hasAccess) {
        fetchTrackingData()
      } else {
        setError('You do not have permission to access the tracking dashboard.')
        setLoading(false)
      }
    } else {
      setError('Authentication required. Please log in.')
      setLoading(false)
    }
  }, [])

  const fetchTrackingData = async () => {
    try {
      setRefreshing(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.driver_id) params.append('driver_id', filters.driver_id)
      if (filters.assignment_status) params.append('assignment_status', filters.assignment_status)
      if (filters.checkin_type) params.append('checkin_type', filters.checkin_type)
      if (filters.date_range?.start) params.append('start_date', filters.date_range.start.toISOString())
      if (filters.date_range?.end) params.append('end_date', filters.date_range.end.toISOString())

      const response = await fetch(`/api/tracking?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data')
      }

      const data = await response.json()
      setTrackingData(data.tracking_info || [])
      
    } catch (error) {
      console.error('Error fetching tracking data:', error)
      setError('Failed to load tracking data. Please try again.')
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

  const filteredData = trackingData.filter(driver => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        driver.driver_name.toLowerCase().includes(searchLower) ||
        driver.vip_name?.toLowerCase().includes(searchLower) ||
        driver.vehicle_info?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time driver and VIP tracking</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time driver and VIP movement tracking</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by driver name, VIP name, or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {filteredData.length} of {trackingData.length} drivers
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="status_filter">Assignment Status</Label>
                  <select
                    id="status_filter"
                    value={filters.assignment_status || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      assignment_status: e.target.value as any || undefined
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="checkin_filter">Last Check-in Type</Label>
                  <select
                    id="checkin_filter"
                    value={filters.checkin_type || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      checkin_type: e.target.value as any || undefined
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All Check-ins</option>
                    <option value="airport_arrival">Airport Arrival</option>
                    <option value="vip_pickup">VIP Pickup</option>
                    <option value="hotel_to_events_venue">Hotel → Events Venue</option>
                    <option value="arrived_at_events_venue">At Events Venue</option>
                    <option value="departing_events_venue">Departing Events Venue</option>
                    <option value="arrived_at_hotel">At Hotel</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-end space-x-2">
                  <Button
                    onClick={fetchTrackingData}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    onClick={() => {
                      setFilters({})
                      setSearchTerm('')
                      fetchTrackingData()
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Cards */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredData.map((driver) => {
          const isRestrictedUser = currentUser ? hasTrackingOnlyAccess(currentUser) : false
          
          return (
            <Card key={driver.driver_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>{driver.driver_name}</span>
                  </CardTitle>
                  <Badge className={getStatusColor(driver.current_status)}>
                    {driver.current_status}
                  </Badge>
                </div>
                {!isRestrictedUser && (
                  <CardDescription className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{driver.driver_phone}</span>
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* VIP Information - Always show for restricted users as requested */}
                {driver.vip_name && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">VIP Assignment</span>
                    </div>
                    <p className="text-purple-800">{driver.vip_name}</p>
                  </div>
                )}

                {/* Vehicle Information - Hide for restricted users */}
                {driver.vehicle_info && !isRestrictedUser && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Car className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Vehicle</span>
                    </div>
                    <p className="text-green-800">{driver.vehicle_info}</p>
                  </div>
                )}

                {/* Last Check-in */}
                {driver.last_checkin && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Last Check-in</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-700">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(driver.last_checkin.timestamp), 'HH:mm')}</span>
                      </div>
                    </div>
                    <p className="text-blue-800 text-sm">
                      {driver.last_checkin.checkin_type === 'custom' && driver.last_checkin.custom_label
                        ? driver.last_checkin.custom_label
                        : driver.last_checkin.checkin_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </p>
                    {driver.last_checkin.session_id && !isRestrictedUser && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {driver.last_checkin.session_id}
                      </Badge>
                    )}
                    {driver.last_checkin.notes && !isRestrictedUser && (
                      <p className="text-blue-700 text-xs mt-1">{driver.last_checkin.notes}</p>
                    )}
                  </div>
                )}

                {/* Location - Show general location for restricted users */}
                {driver.location && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Location</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {isRestrictedUser
                        ? (driver.location.address ? driver.location.address.split(',')[0] : 'Location available')
                        : (driver.location.address || `${driver.location.latitude}, ${driver.location.longitude}`)
                      }
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracking Data</h3>
            <p className="text-gray-600">
              {searchTerm || Object.keys(filters).length > 0
                ? 'No drivers match your current search or filter criteria.'
                : 'No active assignments found. Drivers will appear here when they have active assignments.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}