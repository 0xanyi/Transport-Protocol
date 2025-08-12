'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { AssignmentWithDetails, AuthUser, Checkin, VehicleObservation, CheckinType, DailyCheckinType, OneTimeCheckinType, CheckinProgress } from '@/types'
import { 
  Car, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Plane,
  Hotel,
  Navigation,
  CheckCircle,
  AlertCircle,
  Fuel,
  Gauge
} from 'lucide-react'
import { format } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DriverDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [selectedCheckinType, setSelectedCheckinType] = useState<CheckinType | null>(null)
  const [checkinNotes, setCheckinNotes] = useState('')
  const [checkinProgress, setCheckinProgress] = useState<CheckinProgress | null>(null)
  const [selectedSession, setSelectedSession] = useState<string>('morning')
  const [customLabel, setCustomLabel] = useState('')
  const [currentEventDate, setCurrentEventDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Vehicle observation states
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [vehicleObservation, setVehicleObservation] = useState({
    mileage: '',
    fuel_level: '',
    damage_notes: '',
    observation_type: 'pickup' as 'pickup' | 'dropoff' | 'maintenance_issue'
  })

  useEffect(() => {
    // Get current user from session storage
    const userDataString = sessionStorage.getItem('currentUser')
    console.log('🔍 Driver Dashboard - Loading user data')
    
    if (userDataString) {
      const userData = JSON.parse(userDataString) as AuthUser
      setCurrentUser(userData)
      fetchDriverAssignment(userData.id)
    } else {
      console.log('❌ No user data in session storage')
      setLoading(false)
    }
  }, [])

  const fetchDriverAssignment = async (userId: string) => {
    try {
      const supabase = createClient()
      
      console.log('🔍 Fetching driver record for user ID:', userId)
      
      // First get the driver record for this user
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (driverError || !driverData) {
        console.error('❌ Error fetching driver or no driver found:', driverError)
        setError('No driver profile found for your account. Please contact your coordinator.')
        setLoading(false)
        return
      }

      console.log('✅ Driver found, fetching assignments')

      // Get current assignment for this driver (simplified query first)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('driver_id', driverData.id)
        .in('status', ['scheduled', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (assignmentError) {
        console.error('❌ Assignment query error:', assignmentError)
        setError('Error loading assignment data. Please refresh the page.')
        setLoading(false)
        return
      }

      if (assignmentData && assignmentData.length > 0) {
        const assignment = assignmentData[0]
        console.log('✅ Assignment found:', assignment)

        // Fetch related data separately to avoid complex join issues
        const [driverResult, vehicleResult, vipResult] = await Promise.all([
          supabase.from('drivers').select('id, name, phone, email').eq('id', assignment.driver_id).single(),
          supabase.from('vehicles').select('id, make, model, registration, pickup_location, pickup_mileage, pickup_fuel_gauge').eq('id', assignment.vehicle_id).single(),
          assignment.vip_id ? supabase.from('vips').select('id, name, arrival_date, arrival_time, arrival_airport, arrival_terminal, departure_date, departure_time, departure_airport, departure_terminal, remarks').eq('id', assignment.vip_id).single() : Promise.resolve({ data: null, error: null })
        ])

        // Construct the assignment with details
        const assignmentWithDetails: AssignmentWithDetails = {
          ...assignment,
          driver: driverResult.data,
          vehicle: vehicleResult.data,
          vip: vipResult.data
        }

        console.log('✅ Assignment loaded successfully')
        setAssignment(assignmentWithDetails)
        
        // Fetch check-ins for this assignment
        const { data: checkinsData } = await supabase
          .from('checkins')
          .select('*')
          .eq('assignment_id', assignment.id)
          .order('timestamp', { ascending: false })

        setCheckins(checkinsData || [])
        
        // Fetch check-in progress
        await fetchCheckinProgress(assignment.id)
      } else {
        console.log('ℹ️ No active assignments found for this driver')
      }

    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError('Unexpected error loading dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckinProgress = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/checkins/daily-status?assignment_id=${assignmentId}&event_date=${currentEventDate}`)
      if (response.ok) {
        const data = await response.json()
        setCheckinProgress(data.progress)
      }
    } catch (error) {
      console.error('Error fetching check-in progress:', error)
    }
  }

  const handleCheckin = async () => {
    if (!selectedCheckinType || !assignment || !currentUser) return

    setCheckingIn(true)
    try {
      // Determine if this is a daily check-in
      const dailyCheckinTypes: DailyCheckinType[] = [
        'hotel_to_events_venue',
        'arrived_at_events_venue',
        'departing_events_venue',
        'arrived_at_hotel'
      ]
      
      const isDailyCheckin = dailyCheckinTypes.includes(selectedCheckinType as DailyCheckinType)
      
      const checkinData = {
        assignment_id: assignment.id,
        checkin_type: selectedCheckinType,
        notes: checkinNotes.trim() || null,
        event_date: isDailyCheckin ? currentEventDate : undefined,
        session_id: isDailyCheckin ? selectedSession : undefined,
        custom_label: selectedCheckinType === 'custom' ? customLabel.trim() : undefined
      }

      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkinData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create check-in')
      }

      // Refresh data
      await Promise.all([
        fetchDriverAssignment(currentUser.id),
        fetchCheckinProgress(assignment.id)
      ])
      
      // Reset form
      setSelectedCheckinType(null)
      setCheckinNotes('')
      setCustomLabel('')

    } catch (error) {
      console.error('Error creating check-in:', error)
      alert(error instanceof Error ? error.message : 'Failed to create check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleVehicleObservation = async () => {
    if (!assignment || !currentUser) return

    try {
      const supabase = createClient()
      
      const observationData = {
        driver_id: assignment.driver_id,
        vehicle_id: assignment.vehicle_id,
        assignment_id: assignment.id,
        observation_type: vehicleObservation.observation_type,
        mileage: vehicleObservation.mileage ? parseInt(vehicleObservation.mileage) : null,
        fuel_level: vehicleObservation.fuel_level ? parseInt(vehicleObservation.fuel_level) : null,
        damage_notes: vehicleObservation.damage_notes.trim() || null,
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('vehicle_observations')
        .insert([observationData])

      if (error) throw error

      // Reset form
      setVehicleObservation({
        mileage: '',
        fuel_level: '',
        damage_notes: '',
        observation_type: 'pickup'
      })
      setShowVehicleForm(false)

    } catch (error) {
      console.error('Error creating vehicle observation:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assignment...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-600 mt-1">Authentication Error</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">
              Unable to load user data. Please log in again.
            </p>
            <Button onClick={() => window.location.href = '/'} className="bg-blue-600 hover:bg-blue-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {currentUser?.name}</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {currentUser?.name}</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Assignment</h3>
            <p className="text-gray-600">
              You don't have any active assignments at the moment. Please check back later or contact your coordinator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getCheckinTypeLabel = (type: CheckinType) => {
    const labels: Record<CheckinType, string> = {
      // Daily Check-ins
      hotel_to_events_venue: 'Hotel → Events Venue',
      arrived_at_events_venue: 'Arrived at Events Venue',
      departing_events_venue: 'Departing Events Venue',
      arrived_at_hotel: 'Arrived at Hotel',
      // One-time Check-ins
      airport_arrival: 'Airport Arrival',
      vip_pickup: 'VIP Pickup',
      custom: 'Custom Check-in',
      // Legacy Check-ins (for backward compatibility)
      enroute_hotel: 'En Route to Hotel',
      hotel_arrival: 'Hotel Arrival',
      event_departure: 'Event Departure'
    }
    return labels[type] || type
  }

  const isDailyCheckinComplete = (type: DailyCheckinType, session?: string) => {
    if (!checkinProgress) return false
    const dailyCheckin = checkinProgress.daily_checkins.find(c => c.checkin_type === type)
    if (!dailyCheckin) return false
    
    if (session) {
      return dailyCheckin.sessions[session]?.completed || false
    }
    return dailyCheckin.completed
  }

  const isOneTimeCheckinComplete = (type: OneTimeCheckinType) => {
    if (!checkinProgress) return false
    if (type === 'custom') return false // Custom check-ins are unlimited
    return checkinProgress.one_time_checkins[type]?.completed || false
  }

  const dailyCheckinTypes: DailyCheckinType[] = [
    'hotel_to_events_venue',
    'arrived_at_events_venue',
    'departing_events_venue',
    'arrived_at_hotel'
  ]

  const oneTimeCheckinTypes: OneTimeCheckinType[] = [
    'airport_arrival',
    'vip_pickup',
    'custom'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {currentUser?.name}</p>
      </div>

      {/* Assignment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Current Assignment</span>
          </CardTitle>
          <CardDescription>Your active transportation assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* VIP Details */}
            {assignment.vip && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">VIP Details</h3>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium text-lg">{assignment.vip.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Plane className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-gray-600">Arrival</p>
                        <p className="font-medium">{format(new Date(assignment.vip.arrival_date), 'dd MMM yyyy')}</p>
                        <p>{assignment.vip.arrival_time}</p>
                        <p className="text-xs text-gray-500">{assignment.vip.arrival_airport} - {assignment.vip.arrival_terminal}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Plane className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-gray-600">Departure</p>
                        <p className="font-medium">{format(new Date(assignment.vip.departure_date), 'dd MMM yyyy')}</p>
                        <p>{assignment.vip.departure_time}</p>
                        <p className="text-xs text-gray-500">{assignment.vip.departure_airport} - {assignment.vip.departure_terminal}</p>
                      </div>
                    </div>
                  </div>
                  
                  {assignment.vip.remarks && (
                    <div>
                      <p className="text-gray-600 text-sm">Remarks:</p>
                      <p className="text-sm">{assignment.vip.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Details */}
            {assignment.vehicle && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Car className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Vehicle Details</h3>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium text-lg">{assignment.vehicle.make} {assignment.vehicle.model}</p>
                    <p className="text-gray-600">Registration: {assignment.vehicle.registration}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Pickup: {assignment.vehicle.pickup_location}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-4 h-4 text-gray-600" />
                        <span>Mileage: {assignment.vehicle.pickup_mileage}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Fuel className="w-4 h-4 text-gray-600" />
                        <span>Fuel: {assignment.vehicle.pickup_fuel_gauge}/8</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowVehicleForm(!showVehicleForm)}
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    {showVehicleForm ? 'Hide' : 'Record'} Vehicle Observations
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Observation Form */}
      {showVehicleForm && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Observation</CardTitle>
            <CardDescription>Record current vehicle condition and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="observation_type">Observation Type</Label>
                <select
                  id="observation_type"
                  value={vehicleObservation.observation_type}
                  onChange={(e) => setVehicleObservation(prev => ({
                    ...prev, 
                    observation_type: e.target.value as 'pickup' | 'dropoff' | 'maintenance_issue'
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="pickup">Vehicle Pickup</option>
                  <option value="dropoff">Vehicle Dropoff</option>
                  <option value="maintenance_issue">Maintenance Issue</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="mileage">Current Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="Current mileage"
                  value={vehicleObservation.mileage}
                  onChange={(e) => setVehicleObservation(prev => ({...prev, mileage: e.target.value}))}
                />
              </div>
              
              <div>
                <Label htmlFor="fuel_level">Fuel Level (1-8)</Label>
                <Input
                  id="fuel_level"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Fuel gauge reading"
                  value={vehicleObservation.fuel_level}
                  onChange={(e) => setVehicleObservation(prev => ({...prev, fuel_level: e.target.value}))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="damage_notes">Observations & Notes</Label>
              <Textarea
                id="damage_notes"
                placeholder="Record any damage, issues, or general observations about the vehicle..."
                value={vehicleObservation.damage_notes}
                onChange={(e) => setVehicleObservation(prev => ({...prev, damage_notes: e.target.value}))}
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleVehicleObservation} className="bg-green-600 hover:bg-green-700">
                Save Observation
              </Button>
              <Button onClick={() => setShowVehicleForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Check-in System */}
      <div className="space-y-6">
        {/* Event Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Event Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Label htmlFor="event_date">Select Event Date:</Label>
              <Input
                id="event_date"
                type="date"
                value={currentEventDate}
                onChange={(e) => {
                  setCurrentEventDate(e.target.value)
                  if (assignment) {
                    fetchCheckinProgress(assignment.id)
                  }
                }}
                className="w-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Daily Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-green-600" />
              <span>Daily Check-ins</span>
            </CardTitle>
            <CardDescription>These check-ins reset daily and support multiple sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                {dailyCheckinTypes.map((type) => {
                  const completed = isDailyCheckinComplete(type)
                  return (
                    <Button
                      key={type}
                      onClick={() => setSelectedCheckinType(type)}
                      variant={completed ? "secondary" : selectedCheckinType === type ? "default" : "outline"}
                      className={`h-auto p-4 ${completed ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        {completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{getCheckinTypeLabel(type)}</span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* One-time Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>One-time Check-ins</span>
            </CardTitle>
            <CardDescription>These check-ins are completed once per assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                {oneTimeCheckinTypes.map((type) => {
                  const completed = isOneTimeCheckinComplete(type)
                  return (
                    <Button
                      key={type}
                      onClick={() => setSelectedCheckinType(type)}
                      variant={completed && type !== 'custom' ? "secondary" : selectedCheckinType === type ? "default" : "outline"}
                      disabled={completed && type !== 'custom'}
                      className={`h-auto p-4 ${completed && type !== 'custom' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        {completed && type !== 'custom' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{getCheckinTypeLabel(type)}</span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Form */}
        {selectedCheckinType && (
          <Card>
            <CardHeader>
              <CardTitle>Check-in: {getCheckinTypeLabel(selectedCheckinType)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Selection for Daily Check-ins */}
              {dailyCheckinTypes.includes(selectedCheckinType as DailyCheckinType) && (
                <div>
                  <Label htmlFor="session">Session</Label>
                  <select
                    id="session"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="morning">Morning Session</option>
                    <option value="evening">Evening Session</option>
                    <option value="session_1">Session 1</option>
                    <option value="session_2">Session 2</option>
                  </select>
                </div>
              )}

              {/* Custom Label for Custom Check-ins */}
              {selectedCheckinType === 'custom' && (
                <div>
                  <Label htmlFor="custom_label">Custom Check-in Label</Label>
                  <Input
                    id="custom_label"
                    placeholder="Enter a description for this check-in..."
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="checkin_notes">Notes (Optional)</Label>
                <Textarea
                  id="checkin_notes"
                  placeholder={`Add any notes about ${getCheckinTypeLabel(selectedCheckinType).toLowerCase()}...`}
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleCheckin}
                  disabled={checkingIn || (selectedCheckinType === 'custom' && !customLabel.trim())}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {checkingIn ? 'Checking in...' : 'Check In'}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedCheckinType(null)
                    setCheckinNotes('')
                    setCustomLabel('')
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Check-ins */}
      {checkins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Your check-in history for this assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkins.map((checkin) => (
                <div key={checkin.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {checkin.checkin_type === 'custom' && checkin.custom_label
                              ? checkin.custom_label
                              : getCheckinTypeLabel(checkin.checkin_type)
                            }
                          </p>
                          {checkin.is_daily_checkin && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Daily
                            </span>
                          )}
                          {checkin.session_id && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {checkin.session_id}
                            </span>
                          )}
                        </div>
                        {checkin.event_date && (
                          <p className="text-xs text-gray-500">Event Date: {checkin.event_date}</p>
                        )}
                        {checkin.notes && (
                          <p className="text-sm text-gray-600 mt-1">{checkin.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(checkin.timestamp), 'dd MMM HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Check-ins History */}
      {checkinProgress?.custom_checkins && checkinProgress.custom_checkins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Check-ins</CardTitle>
            <CardDescription>Your custom check-ins for this assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkinProgress.custom_checkins.map((customCheckin) => (
                <div key={customCheckin.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-medium">{customCheckin.label}</p>
                        {customCheckin.notes && (
                          <p className="text-sm text-gray-600">{customCheckin.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(customCheckin.timestamp), 'dd MMM HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}