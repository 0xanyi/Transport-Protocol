'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/ui/image-upload'
import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/types'
import { Car, ArrowLeft, Calendar, MapPin, Fuel, Camera } from 'lucide-react'
import { format } from 'date-fns'

interface UploadedImage {
  key: string
  publicUrl: string
  file?: File
}

export default function VehicleReturnPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.id as string
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dropoffPhotos, setDropoffPhotos] = useState<UploadedImage[]>([])
  const [formData, setFormData] = useState({
    dropoff_mileage: '',
    dropoff_fuel_gauge: '',
    dropoff_location: '',
    dropoff_notes: '',
  })

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle()
    }
  }, [vehicleId])

  const fetchVehicle = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (error) throw error
      setVehicle(data)
      
      // Pre-populate dropoff location with pickup location
      setFormData(prev => ({
        ...prev,
        dropoff_location: data.pickup_location
      }))
    } catch (error) {
      console.error('Error fetching vehicle:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle) return

    setSubmitting(true)
    
    try {
      const supabase = createClient()
      
      // Prepare update data
      const updateData = {
        dropoff_mileage: parseInt(formData.dropoff_mileage),
        dropoff_fuel_gauge: parseInt(formData.dropoff_fuel_gauge),
        dropoff_date: new Date().toISOString(),
        dropoff_photos: dropoffPhotos.map(photo => photo.publicUrl),
        current_driver_id: null, // Clear current driver assignment
      }
      
      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)

      if (error) throw error

      // If there are notes, create a vehicle observation record
      if (formData.dropoff_notes.trim()) {
        await supabase
          .from('vehicle_observations')
          .insert({
            vehicle_id: vehicleId,
            driver_id: vehicle.current_driver_id, // If available
            observation_type: 'dropoff',
            damage_notes: formData.dropoff_notes,
            photos: dropoffPhotos.map(photo => photo.publicUrl),
            mileage: parseInt(formData.dropoff_mileage),
            fuel_level: parseInt(formData.dropoff_fuel_gauge),
          })
      }
      
      // Redirect back to vehicles page
      router.push('/dashboard/vehicles?returned=true')
    } catch (error) {
      console.error('Error processing vehicle return:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vehicle not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/vehicles')}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vehicles
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/vehicles')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Return</h1>
          <p className="text-gray-600 mt-1">Process the return of {vehicle.make} {vehicle.model}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Make & Model</p>
                <p>{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Registration</p>
                <p>{vehicle.registration}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Pickup Location</p>
                <p className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {vehicle.pickup_location}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Pickup Date</p>
                <p className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(vehicle.pickup_date), 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Pickup Mileage</p>
                <p>{vehicle.pickup_mileage.toLocaleString()} mi</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Pickup Fuel</p>
                <p className="flex items-center">
                  <Fuel className="w-3 h-3 mr-1" />
                  {vehicle.pickup_fuel_gauge}%
                </p>
              </div>
            </div>

            {vehicle.pickup_photos && vehicle.pickup_photos.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Pickup Photos ({vehicle.pickup_photos.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {vehicle.pickup_photos.slice(0, 6).map((photo, index) => (
                    <div key={index} className="aspect-square rounded overflow-hidden border">
                      <img
                        src={photo}
                        alt={`Pickup photo ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </div>
                  ))}
                </div>
                {vehicle.pickup_photos.length > 6 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{vehicle.pickup_photos.length - 6} more photos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Form */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Return Details</CardTitle>
            <CardDescription>
              Record the vehicle condition and mileage at return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dropoff_mileage">Return Mileage *</Label>
                  <Input
                    id="dropoff_mileage"
                    name="dropoff_mileage"
                    type="number"
                    required
                    value={formData.dropoff_mileage}
                    onChange={handleChange}
                    placeholder="28500"
                    min={vehicle.pickup_mileage}
                  />
                  <p className="text-xs text-gray-500">
                    Must be ≥ {vehicle.pickup_mileage.toLocaleString()} mi
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dropoff_fuel_gauge">Fuel Gauge (%) *</Label>
                  <Input
                    id="dropoff_fuel_gauge"
                    name="dropoff_fuel_gauge"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.dropoff_fuel_gauge}
                    onChange={handleChange}
                    placeholder="85"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Return Location</Label>
                <Input
                  id="dropoff_location"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  placeholder="Same as pickup location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff_notes">Notes & Observations</Label>
                <Textarea
                  id="dropoff_notes"
                  name="dropoff_notes"
                  value={formData.dropoff_notes}
                  onChange={handleChange}
                  placeholder="Any damage, issues, or observations about the vehicle condition..."
                  rows={3}
                />
              </div>

              {/* Return Photos Section */}
              <div className="space-y-2">
                <Label>Return Photos</Label>
                <p className="text-sm text-gray-600">
                  Take photos of the vehicle condition at return. These will be compared with pickup photos.
                </p>
                <ImageUpload
                  onImagesChange={setDropoffPhotos}
                  maxImages={8}
                  vehicleId={vehicleId}
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Processing Return...' : 'Process Vehicle Return'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
