'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Driver, Vehicle, VIP, AssignmentWithDetails } from '@/types'
import { Calendar, User, Car, UserCheck, Plus, ArrowRight, Search, Filter, Zap, Trash2, AlertTriangle, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default function AssignmentsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vips, setVips] = useState<VIP[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch all data in parallel
      const [driversResult, vehiclesResult, vipsResult, assignmentsResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'approved'),
        supabase.from('vehicles').select('*'),
        supabase.from('vips').select('*'),
        supabase.from('assignments').select(`
          *,
          driver:driver_id(id, name, phone, email),
          vehicle:vehicle_id(id, make, model, registration),
          vip:vip_id(id, name, arrival_date, departure_date)
        `).order('created_at', { ascending: false })
      ])

      if (driversResult.error) {
        console.error('Drivers fetch error:', driversResult.error)
        throw driversResult.error
      }
      if (vehiclesResult.error) {
        console.error('Vehicles fetch error:', vehiclesResult.error)
        throw vehiclesResult.error
      }
      if (vipsResult.error) {
        console.error('VIPs fetch error:', vipsResult.error)
        throw vipsResult.error
      }
      if (assignmentsResult.error) {
        console.error('Assignments fetch error:', assignmentsResult.error)
        
        // Check if it's a table not found error
        if (assignmentsResult.error.message?.includes('relation "assignments" does not exist')) {
          console.warn('Database schema not set up yet. Some features may not work.')
          // Don't throw error, just set empty assignments
          setAssignments([])
        } else {
          throw assignmentsResult.error
        }
      } else {
        setAssignments(assignmentsResult.data || [])
      }

      console.log('Fetched data:', {
        drivers: driversResult.data?.length,
        vehicles: vehiclesResult.data?.length,
        vips: vipsResult.data?.length,
        assignments: assignmentsResult.data?.length
      })

      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
      setVips(vipsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (driverId: string, vehicleId: string, vipId?: string) => {
    try {
      console.log('Creating assignment with:', { driverId, vehicleId, vipId })
      
      const assignmentData = {
        driver_id: driverId,
        vehicle_id: vehicleId,
        vip_id: vipId || null,
        start_time: new Date().toISOString(),
        status: 'scheduled' as const
      }

      // Use API route to handle assignment creation with proper permissions
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      const data = await response.json()

      console.log('Assignment created:', data)

      // Refresh data to show the new assignment
      fetchData()
    } catch (error) {
      console.error('Error creating assignment:', error)
      // Show user-friendly error message
      alert('Failed to create assignment. Please check the console for details.')
    }
  }

  const updateAssignment = async (assignmentId: string, updateData: { vip_id?: string | null, vehicle_id?: string, start_time?: string, end_time?: string }) => {
    try {
      console.log('Updating assignment:', assignmentId, updateData)
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update assignment')
      }

      const data = await response.json()
      console.log('Assignment updated successfully:', data)

      // Refresh data to show the updated assignments
      fetchData()
      setShowEditModal(false)
      setEditingAssignment(null)
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment. Please check the console for details.')
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    try {
      console.log('Deleting assignment:', assignmentId)
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }

      const data = await response.json()
      console.log('Assignment deleted successfully:', data)

      // Refresh data to show the updated assignments
      fetchData()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment. Please check the console for details.')
    }
  }

  const assignVipToExistingAssignment = async (vipId: string, driverId: string) => {
    try {
      console.log('Assigning VIP to existing assignment:', { vipId, driverId })
      
      // Use API route to handle VIP assignment with proper permissions
      const response = await fetch('/api/assignments/assign-vip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vipId, driverId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign VIP')
      }

      console.log('VIP assigned successfully')
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error assigning VIP to existing assignment:', error)
      alert('Failed to assign VIP. Please check the console for details.')
    }
  }

  const getAvailableDrivers = () => {
    const assignedDriverIds = assignments
      .filter(a => a.status === 'scheduled' || a.status === 'active')
      .map(a => a.driver_id)
    
    return drivers.filter(d => !assignedDriverIds.includes(d.id))
  }

  const getAvailableVehicles = () => {
    return vehicles.filter(v => !v.current_driver_id)
  }

  const getUnassignedVips = () => {
    return vips.filter(v => !v.assigned_driver_id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  const availableDrivers = getAvailableDrivers()
  const availableVehicles = getAvailableVehicles()
  const unassignedVips = getUnassignedVips()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600 mt-1">Manage driver and vehicle assignments</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Available Drivers</p>
                <p className="text-2xl font-bold">{availableDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Available Vehicles</p>
                <p className="text-2xl font-bold">{availableVehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Unassigned VIPs</p>
                <p className="text-2xl font-bold">{unassignedVips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Assignment Section */}
      {availableDrivers.length > 0 && availableVehicles.length > 0 && (
        <SmartAssignmentSection 
          drivers={availableDrivers}
          vehicles={availableVehicles}
          vips={unassignedVips}
          assignments={assignments}
          onAssign={createAssignment}
          onAssignVip={assignVipToExistingAssignment}
        />
      )}

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>
            Active and scheduled driver assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assignments created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{assignment.driver?.name}</span>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-green-600" />
                        <span>{assignment.vehicle?.make} {assignment.vehicle?.model}</span>
                        <span className="text-gray-500">({assignment.vehicle?.registration})</span>
                      </div>

                      {assignment.vip && (
                        <>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                            <span>{assignment.vip.name}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : assignment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(assignment.created_at), 'dd MMM HH:mm')}
                      </span>
                      
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAssignment(assignment)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit assignment (VIP, vehicle, times)"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Delete Button with Confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              Delete Assignment
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this assignment?
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.driver?.name} → {assignment.vehicle?.make} {assignment.vehicle?.model}
                                  {assignment.vip && ` → ${assignment.vip.name}`}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Status: {assignment.status} • Created: {format(new Date(assignment.created_at), 'dd MMM HH:mm')}
                                </div>
                              </div>
                              <div className="mt-3 text-sm text-red-600">
                                <strong>Warning:</strong> This will also delete all related check-ins and vehicle observations. This action cannot be undone.
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAssignment(assignment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Assignment
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Assignment Modal */}
      {showEditModal && editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          vips={vips}
          vehicles={vehicles}
          onUpdate={updateAssignment}
          onClose={() => {
            setShowEditModal(false)
            setEditingAssignment(null)
          }}
        />
      )}
    </div>
  )
}

// Smart Assignment Component
function SmartAssignmentSection({ 
  drivers, 
  vehicles, 
  vips, 
  assignments,
  onAssign,
  onAssignVip
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  vips: VIP[]
  assignments: AssignmentWithDetails[]
  onAssign: (driverId: string, vehicleId: string, vipId?: string) => void
  onAssignVip: (vipId: string, driverId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'driver-vehicle' | 'vip-assignment' | 'complete'>('driver-vehicle')

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.church.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Assignment Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Smart Assignment System
          </CardTitle>
          <CardDescription>
            Choose your assignment workflow based on what information you have
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={activeTab === 'driver-vehicle' ? 'default' : 'outline'}
              onClick={() => setActiveTab('driver-vehicle')}
              className="flex items-center gap-2"
            >
              <Car className="w-4 h-4" />
              Driver → Vehicle
            </Button>
            <Button
              variant={activeTab === 'vip-assignment' ? 'default' : 'outline'}
              onClick={() => setActiveTab('vip-assignment')}
              className="flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              VIP → Assigned Driver
            </Button>
            <Button
              variant={activeTab === 'complete' ? 'default' : 'outline'}
              onClick={() => setActiveTab('complete')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Complete Assignment
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search drivers by name or church..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'driver-vehicle' && (
            <DriverVehicleAssignment 
              drivers={filteredDrivers}
              vehicles={vehicles}
              onAssign={onAssign}
            />
          )}

          {activeTab === 'vip-assignment' && (
            <VipAssignment 
              vips={vips}
              drivers={drivers}
              assignments={assignments}
              onAssignVip={onAssignVip}
            />
          )}

          {activeTab === 'complete' && (
            <CompleteAssignment 
              drivers={filteredDrivers}
              vehicles={vehicles}
              vips={vips}
              onAssign={onAssign}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Driver → Vehicle Assignment
function DriverVehicleAssignment({ 
  drivers, 
  vehicles, 
  onAssign 
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  onAssign: (driverId: string, vehicleId: string) => void
}) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Step 1:</strong> Assign drivers to vehicles. You can assign VIPs later.
        </p>
      </div>

      {/* Driver Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
        {drivers.map((driver) => (
          <div 
            key={driver.id} 
            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedDriver?.id === driver.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">{driver.name}</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{driver.church}</p>
            <Badge variant="secondary" className="text-xs">Available</Badge>
          </div>
        ))}
      </div>

      {/* Vehicle Selection */}
      {selectedDriver && (
        <div className="border-t pt-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Selected: {selectedDriver.name}</span>
              <Badge variant="outline">{selectedDriver.church}</Badge>
            </div>
            <p className="text-sm font-medium mb-3">Choose Vehicle:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {vehicles.map((vehicle) => (
                <Button
                  key={vehicle.id}
                  variant="outline"
                  onClick={() => {
                    onAssign(selectedDriver.id, vehicle.id)
                    setSelectedDriver(null)
                  }}
                  className="justify-start h-auto p-3"
                >
                  <Car className="w-4 h-4 mr-2 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-gray-500">{vehicle.registration}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// VIP → Assigned Driver
function VipAssignment({ 
  vips, 
  drivers, 
  assignments,
  onAssignVip 
}: {
  vips: VIP[]
  drivers: Driver[]
  assignments: AssignmentWithDetails[]
  onAssignVip: (vipId: string, driverId: string) => void
}) {
  const [selectedVip, setSelectedVip] = useState<VIP | null>(null)

  // Get drivers who already have vehicle assignments but no VIP
  const assignedDrivers = assignments
    .filter(a => (a.status === 'scheduled' || a.status === 'active') && !a.vip_id)
    .map(a => ({
      ...a.driver,
      assignmentId: a.id,
      vehicle: a.vehicle
    }))
    .filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-lg p-3">
        <p className="text-sm text-purple-800">
          <strong>Step 2:</strong> Assign VIPs to drivers who already have vehicles assigned.
        </p>
      </div>

      {/* VIP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
        {vips.map((vip) => (
          <div 
            key={vip.id} 
            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedVip?.id === vip.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedVip(selectedVip?.id === vip.id ? null : vip)}
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-sm">{vip.name}</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {vip.arrival_date && format(new Date(vip.arrival_date), 'MMM dd')} - 
              {vip.departure_date && format(new Date(vip.departure_date), 'MMM dd')}
            </p>
            <Badge variant="secondary" className="text-xs">Unassigned</Badge>
          </div>
        ))}
      </div>

      {/* Driver Selection */}
      {selectedVip && (
        <div className="border-t pt-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Selected VIP: {selectedVip.name}</span>
            </div>
            <p className="text-sm font-medium mb-3">Assign to Driver with Vehicle:</p>
            {assignedDrivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {assignedDrivers.map((driverAssignment) => (
                  <Button
                    key={driverAssignment.id}
                    variant="outline"
                    onClick={() => {
                      if (selectedVip?.id && driverAssignment?.id) {
                        onAssignVip(selectedVip.id as string, driverAssignment.id as string)
                        setSelectedVip(null)
                      }
                    }}
                    className="justify-start h-auto p-3"
                  >
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{driverAssignment.name}</div>
                      <div className="text-xs text-gray-500">{driverAssignment.church}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {driverAssignment.vehicle?.make} {driverAssignment.vehicle?.model}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No drivers with vehicles available</p>
                <p className="text-xs">Assign drivers to vehicles first</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Complete Assignment (Driver + Vehicle + VIP)
function CompleteAssignment({ 
  drivers, 
  vehicles, 
  vips, 
  onAssign 
}: {
  drivers: Driver[]
  vehicles: Vehicle[]
  vips: VIP[]
  onAssign: (driverId: string, vehicleId: string, vipId: string) => void
}) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedVip, setSelectedVip] = useState<VIP | null>(null)

  const handleCompleteAssignment = () => {
    if (selectedDriver && selectedVehicle && selectedVip) {
      onAssign(selectedDriver.id, selectedVehicle.id, selectedVip.id)
      setSelectedDriver(null)
      setSelectedVehicle(null)
      setSelectedVip(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 rounded-lg p-3">
        <p className="text-sm text-green-800">
          <strong>Complete Assignment:</strong> When you know the driver, vehicle, and VIP upfront.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Driver Selection */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Select Driver
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={`border rounded p-2 cursor-pointer text-sm ${
                  selectedDriver?.id === driver.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDriver(driver)}
              >
                <div className="font-medium">{driver.name}</div>
                <div className="text-xs text-gray-600">{driver.church}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Selection */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-green-600" />
            Select Vehicle
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`border rounded p-2 cursor-pointer text-sm ${
                  selectedVehicle?.id === vehicle.id ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                <div className="text-xs text-gray-600">{vehicle.registration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Selection */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            Select VIP
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {vips.map((vip) => (
              <div
                key={vip.id}
                className={`border rounded p-2 cursor-pointer text-sm ${
                  selectedVip?.id === vip.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedVip(vip)}
              >
                <div className="font-medium">{vip.name}</div>
                <div className="text-xs text-gray-600">
                  {vip.arrival_date && format(new Date(vip.arrival_date), 'MMM dd')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Summary */}
      {(selectedDriver || selectedVehicle || selectedVip) && (
        <div className="border-t pt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Assignment Summary:</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 ${selectedDriver ? 'text-blue-600' : 'text-gray-400'}`}>
                <User className="w-4 h-4" />
                <span className="text-sm">{selectedDriver?.name || 'No driver selected'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${selectedVehicle ? 'text-green-600' : 'text-gray-400'}`}>
                <Car className="w-4 h-4" />
                <span className="text-sm">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'No vehicle selected'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${selectedVip ? 'text-purple-600' : 'text-gray-400'}`}>
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">{selectedVip?.name || 'No VIP selected'}</span>
              </div>
            </div>
            <Button 
              onClick={handleCompleteAssignment}
              disabled={!selectedDriver || !selectedVehicle || !selectedVip}
              className="w-full"
            >
              Create Complete Assignment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
// Edit Assignment Modal Component
function EditAssignmentModal({ 
  assignment, 
  vips,
  vehicles, 
  onUpdate, 
  onClose 
}: {
  assignment: AssignmentWithDetails
  vips: VIP[]
  vehicles: Vehicle[]
  onUpdate: (assignmentId: string, updateData: { vip_id?: string | null, vehicle_id?: string, start_time?: string, end_time?: string }) => void
  onClose: () => void
}) {
  const [selectedVipId, setSelectedVipId] = useState<string>(assignment.vip_id || '')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(assignment.vehicle_id || '')
  const [startTime, setStartTime] = useState(
    assignment.start_time ? format(new Date(assignment.start_time), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [endTime, setEndTime] = useState(
    assignment.end_time ? format(new Date(assignment.end_time), "yyyy-MM-dd'T'HH:mm") : ''
  )

  const handleSave = () => {
    const updateData: { vip_id?: string | null, vehicle_id?: string, start_time?: string, end_time?: string } = {}
    
    // Only include fields that have changed
    if (selectedVipId !== (assignment.vip_id || '')) {
      updateData.vip_id = selectedVipId || null
    }
    
    if (selectedVehicleId !== assignment.vehicle_id) {
      updateData.vehicle_id = selectedVehicleId
    }
    
    if (startTime && startTime !== format(new Date(assignment.start_time), "yyyy-MM-dd'T'HH:mm")) {
      updateData.start_time = new Date(startTime).toISOString()
    }
    
    if (endTime && endTime !== (assignment.end_time ? format(new Date(assignment.end_time), "yyyy-MM-dd'T'HH:mm") : '')) {
      updateData.end_time = new Date(endTime).toISOString()
    }

    onUpdate(assignment.id, updateData)
  }

  // Get available VIPs (unassigned + currently assigned to this assignment)
  const availableVips = vips.filter(vip => 
    !vip.assigned_driver_id || vip.id === assignment.vip_id
  )

  // Get available vehicles (unassigned + currently assigned to this assignment)
  const availableVehicles = vehicles.filter(vehicle => 
    !vehicle.current_driver_id || vehicle.id === assignment.vehicle_id
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Assignment</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          {/* Assignment Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{assignment.driver?.name}</span>
            </div>
            <div className="text-xs text-gray-600">
              Driver assignment cannot be changed
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Assignment
            </label>
            <div className="relative">
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.registration})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Car className="w-4 h-4 text-green-600" />
              </div>
            </div>
            {selectedVehicleId !== assignment.vehicle_id && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Changing vehicle will reassign it from current driver
              </p>
            )}
          </div>

          {/* VIP Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIP Assignment
            </label>
            <div className="relative">
              <select
                value={selectedVipId}
                onChange={(e) => setSelectedVipId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">No VIP</option>
                {availableVips.map((vip) => (
                  <option key={vip.id} value={vip.id}>
                    {vip.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <UserCheck className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time (optional)
            </label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}