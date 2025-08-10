'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Driver, Vehicle, VIP, AssignmentWithDetails } from '@/types'
import { Calendar, User, Car, UserCheck, Plus, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function AssignmentsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vips, setVips] = useState<VIP[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

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

      if (driversResult.error) throw driversResult.error
      if (vehiclesResult.error) throw vehiclesResult.error
      if (vipsResult.error) throw vipsResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
      setVips(vipsResult.data || [])
      setAssignments(assignmentsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (driverId: string, vehicleId: string, vipId?: string) => {
    try {
      const supabase = createClient()
      
      const assignmentData = {
        driver_id: driverId,
        vehicle_id: vehicleId,
        vip_id: vipId || null,
        start_time: new Date().toISOString(),
        status: 'scheduled' as const
      }

      const { error } = await supabase
        .from('assignments')
        .insert([assignmentData])

      if (error) throw error

      // Update vehicle assignment
      await supabase
        .from('vehicles')
        .update({ current_driver_id: driverId })
        .eq('id', vehicleId)

      // Update VIP assignment if provided
      if (vipId) {
        await supabase
          .from('vips')
          .update({ assigned_driver_id: driverId })
          .eq('id', vipId)
      }

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error creating assignment:', error)
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

      {/* Quick Assignment Section */}
      {availableDrivers.length > 0 && availableVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Assignment</CardTitle>
            <CardDescription>
              Assign available drivers to vehicles (and optionally VIPs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {availableDrivers.slice(0, 3).map((driver) => (
                <div key={driver.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{driver.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{driver.church}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Assign to Vehicle:</p>
                    <div className="space-y-1">
                      {availableVehicles.slice(0, 2).map((vehicle) => (
                        <Button
                          key={vehicle.id}
                          size="sm"
                          variant="outline"
                          onClick={() => createAssignment(driver.id, vehicle.id)}
                          className="w-full text-left justify-start"
                        >
                          <Car className="w-3 h-3 mr-2" />
                          {vehicle.make} {vehicle.model} ({vehicle.registration})
                        </Button>
                      ))}
                    </div>

                    {unassignedVips.length > 0 && (
                      <>
                        <p className="text-sm font-medium mt-3">Or assign to VIP + Vehicle:</p>
                        <div className="space-y-1">
                          {unassignedVips.slice(0, 2).map((vip) => (
                            <div key={vip.id} className="space-y-1">
                              <p className="text-xs text-gray-600">{vip.name}</p>
                              {availableVehicles.slice(0, 1).map((vehicle) => (
                                <Button
                                  key={`${vip.id}-${vehicle.id}`}
                                  size="sm"
                                  onClick={() => createAssignment(driver.id, vehicle.id, vip.id)}
                                  className="w-full text-left justify-start bg-purple-600 hover:bg-purple-700"
                                >
                                  <UserCheck className="w-3 h-3 mr-2" />
                                  Assign VIP + Vehicle
                                </Button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

                    <div className="flex items-center space-x-2">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}