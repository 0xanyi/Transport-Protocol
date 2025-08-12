'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function TrackingDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [trackingData, setTrackingData] = useState<DriverTrackingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<TrackingDashboardFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms debounce

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

  const fetchTrackingData = useCallback(async () => {
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
  }, [filters])

  const handleRefresh = useCallback(() => {
    fetchTrackingData()
  }, [fetchTrackingData])

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

  const filteredData = useMemo(() => {
    return trackingData.filter(driver => {
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        return (
          driver.driver_name.toLowerCase().includes(searchLower) ||
          driver.vip_name?.toLowerCase().includes(searchLower) ||
          driver.vehicle_info?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [trackingData, debouncedSearchTerm])

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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tracking Dashboard</h1>
        <p className="text-gray-600 mt-1 mobile-text">Real-time driver and VIP movement tracking</p>
      </div>
      
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2 order-2 sm:order-1">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {filteredData.length} of {trackingData.length} drivers
          </div>
        </div>
        
        <div className="flex items-center space-x-2 order-1 sm:order-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="mobile"
            className="flex-1 sm:flex-none touch-target"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="mobile"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 touch-target"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="mobile-padding">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search drivers, VIPs, vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-input pl-12"
              />
            </div>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                  <div className="space-y-2">
                    <Label htmlFor="status_filter" className="mobile-text">Assignment Status</Label>
                    <select
                      id="status_filter"
                      value={filters.assignment_status || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        assignment_status: e.target.value as any || undefined
                      }))}
                      className="mobile-input w-full"
                    >
                      <option value="">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkin_filter" className="mobile-text">Last Check-in Type</Label>
                    <select
                      id="checkin_filter"
                      value={filters.checkin_type || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        checkin_type: e.target.value as any || undefined
                      }))}
                      className="mobile-input w-full"
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
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Button
                    onClick={fetchTrackingData}
                    size="mobile"
                    fullWidth
                    className="bg-green-600 hover:bg-green-700 touch-target"
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
                    size="mobile"
                    fullWidth
                    className="touch-target"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Cards */}
      <div className="mobile-grid">
        {filteredData.map((driver) => {
          const isRestrictedUser = currentUser ? hasTrackingOnlyAccess(currentUser) : false
          
          return (
            <Card key={driver.driver_id} className="mobile-card hover:shadow-lg transition-shadow">
              <CardHeader className="mobile-padding pb-3">
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <User className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">{driver.driver_name}</CardTitle>
                      {!isRestrictedUser && (
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{driver.driver_phone}</span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(driver.current_status)} flex-shrink-0 text-xs`}>
                    {driver.current_status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="mobile-padding space-y-4">
                {/* VIP Information - Always show for restricted users as requested */}
                {driver.vip_name && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="font-medium text-purple-900 mobile-text">VIP Assignment</span>
                    </div>
                    <p className="text-purple-800 font-medium truncate">{driver.vip_name}</p>
                  </div>
                )}

                {/* Vehicle Information - Hide for restricted users */}
                {driver.vehicle_info && !isRestrictedUser && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Car className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-green-900 mobile-text">Vehicle</span>
                    </div>
                    <p className="text-green-800 text-sm truncate">{driver.vehicle_info}</p>
                  </div>
                )}

                {/* Last Check-in */}
                {driver.last_checkin && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-blue-900 mobile-text">Last Check-in</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-700 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(driver.last_checkin.timestamp), 'HH:mm')}</span>
                      </div>
                    </div>
                    <p className="text-blue-800 text-sm font-medium mb-2">
                      {driver.last_checkin.checkin_type === 'custom' && driver.last_checkin.custom_label
                        ? driver.last_checkin.custom_label
                        : driver.last_checkin.checkin_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {driver.last_checkin.session_id && !isRestrictedUser && (
                        <Badge variant="outline" className="text-xs">
                          {driver.last_checkin.session_id}
                        </Badge>
                      )}
                    </div>
                    {driver.last_checkin.notes && !isRestrictedUser && (
                      <p className="text-blue-700 text-xs mt-2 line-clamp-2">{driver.last_checkin.notes}</p>
                    )}
                  </div>
                )}

                {/* Location - Show general location for restricted users */}
                {driver.location && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 mobile-text">Location</span>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2">
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