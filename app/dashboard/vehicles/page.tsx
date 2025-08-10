'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/types'
import { Car, Fuel, MapPin, Calendar, Plus, X, Camera } from 'lucide-react'
import { format } from 'date-fns'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    registration: '',
    is_hired: true,
    pickup_location: '',
    pickup_mileage: '',
    pickup_fuel_gauge: '',
    pickup_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          ...formData,
          pickup_mileage: parseInt(formData.pickup_mileage),
          pickup_fuel_gauge: parseInt(formData.pickup_fuel_gauge),
          pickup_photos: [],
        }])

      if (error) throw error
      
      // Reset form and refresh list
      setFormData({
        make: '',
        model: '',
        registration: '',
        is_hired: true,
        pickup_location: '',
        pickup_mileage: '',
        pickup_fuel_gauge: '',
        pickup_date: new Date().toISOString().split('T')[0],
      })
      setShowAddForm(false)
      fetchVehicles()
    } catch (error) {
      console.error('Error adding vehicle:', error)
    }
  }

  const getFuelGaugeColor = (gauge: number) => {
    if (gauge >= 75) return 'text-green-600'
    if (gauge >= 50) return 'text-yellow-600'
    if (gauge >= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-1">Manage rental vehicles for the event</p>
        </div>
        
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Vehicle</CardTitle>
            <CardDescription>Enter vehicle pickup details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    name="make"
                    required
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Toyota"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Camry"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registration">Registration *</Label>
                  <Input
                    id="registration"
                    name="registration"
                    required
                    value={formData.registration}
                    onChange={handleChange}
                    placeholder="AB12 CDE"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location *</Label>
                  <Input
                    id="pickup_location"
                    name="pickup_location"
                    required
                    value={formData.pickup_location}
                    onChange={handleChange}
                    placeholder="Heathrow Airport"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pickup_date">Pickup Date *</Label>
                  <Input
                    id="pickup_date"
                    name="pickup_date"
                    type="date"
                    required
                    value={formData.pickup_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_mileage">Pickup Mileage *</Label>
                  <Input
                    id="pickup_mileage"
                    name="pickup_mileage"
                    type="number"
                    required
                    value={formData.pickup_mileage}
                    onChange={handleChange}
                    placeholder="25000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pickup_fuel_gauge">Fuel Gauge (%) *</Label>
                  <Input
                    id="pickup_fuel_gauge"
                    name="pickup_fuel_gauge"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.pickup_fuel_gauge}
                    onChange={handleChange}
                    placeholder="75"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_hired"
                  name="is_hired"
                  checked={formData.is_hired}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_hired">This is a hired/rental vehicle</Label>
              </div>

              <Button type="submit" className="w-full">Add Vehicle</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vehicles added yet</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add Vehicle" to get started</p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-gray-600">{vehicle.registration}</p>
                    </div>
                  </div>
                  {vehicle.is_hired && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      HIRED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location
                    </span>
                    <span className="font-medium">{vehicle.pickup_location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Pickup
                    </span>
                    <span className="font-medium">
                      {format(new Date(vehicle.pickup_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mileage</span>
                    <span className="font-medium">{vehicle.pickup_mileage.toLocaleString()} mi</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <Fuel className="w-3 h-3 mr-1" />
                      Fuel
                    </span>
                    <span className={`font-medium ${getFuelGaugeColor(vehicle.pickup_fuel_gauge)}`}>
                      {vehicle.pickup_fuel_gauge}%
                    </span>
                  </div>
                </div>

                {vehicle.current_driver_id ? (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-green-600 font-medium">ASSIGNED</p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-400">Available for assignment</p>
                  </div>
                )}

                <div className="mt-4 flex justify-between text-xs text-gray-500">
                  <span>Added {format(new Date(vehicle.created_at), 'dd MMM')}</span>
                  {vehicle.pickup_photos?.length > 0 && (
                    <span className="flex items-center">
                      <Camera className="w-3 h-3 mr-1" />
                      {vehicle.pickup_photos.length} photos
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}