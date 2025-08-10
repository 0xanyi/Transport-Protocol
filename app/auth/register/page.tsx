'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

export default function DriverRegistrationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    kingschat_handle: '',
    home_address: '',
    home_post_code: '',
    church: '',
    zone: '',
    group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    years_driving_experience: '',
    license_duration_years: '',
    availability_start: '',
    availability_end: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Calculate number of days between availability dates
  const calculateAvailabilityDays = () => {
    if (!formData.availability_start || !formData.availability_end) {
      return null
    }
    
    try {
      const startDate = parseISO(formData.availability_start)
      const endDate = parseISO(formData.availability_end)
      const days = differenceInDays(endDate, startDate) + 1 // +1 to include both start and end dates
      return days > 0 ? days : 0
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Convert numeric fields to numbers
      const submissionData = {
        ...formData,
        years_driving_experience: parseInt(formData.years_driving_experience),
        license_duration_years: parseInt(formData.license_duration_years),
      }
      
      const { data, error } = await supabase
        .from('drivers')
        .insert([submissionData])
        .select()

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
              <p className="text-gray-600">
                Your registration has been submitted and is pending approval.
                You will be contacted once approved.
              </p>
              <p className="text-sm text-gray-500">Redirecting to home page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Driver Registration</CardTitle>
          <CardDescription>
            Register as a driver for STPPL UK 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-600">Your basic contact details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kingschat_handle">KingsChat Handle</Label>
                  <Input
                    id="kingschat_handle"
                    name="kingschat_handle"
                    type="text"
                    value={formData.kingschat_handle}
                    onChange={handleChange}
                    placeholder="@johndoe"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="home_address">Home Address</Label>
                  <Input
                    id="home_address"
                    name="home_address"
                    type="text"
                    value={formData.home_address}
                    onChange={handleChange}
                    placeholder="123 Main Street, London"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="home_post_code">Postcode</Label>
                  <Input
                    id="home_post_code"
                    name="home_post_code"
                    type="text"
                    value={formData.home_post_code}
                    onChange={handleChange}
                    placeholder="SW1A 1AA"
                  />
                </div>
              </div>
            </div>

            {/* Church Information Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Church Information</h3>
                <p className="text-sm text-gray-600">Your church and ministry details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="church">Church *</Label>
                  <Input
                    id="church"
                    name="church"
                    type="text"
                    required
                    value={formData.church}
                    onChange={handleChange}
                    placeholder="Christ Embassy London"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zone *</Label>
                  <Input
                    id="zone"
                    name="zone"
                    type="text"
                    required
                    value={formData.zone}
                    onChange={handleChange}
                    placeholder="Zone 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Group *</Label>
                  <Input
                    id="group"
                    name="group"
                    type="text"
                    required
                    value={formData.group}
                    onChange={handleChange}
                    placeholder="Group A"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                <p className="text-sm text-gray-600">Person to contact in case of emergency</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    type="text"
                    required
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    type="tel"
                    required
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900001"
                  />
                </div>
              </div>
            </div>

            {/* Driving Experience Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Driving Experience</h3>
                <p className="text-sm text-gray-600">Your driving qualifications and experience</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_driving_experience">Years of Driving Experience *</Label>
                  <Input
                    id="years_driving_experience"
                    name="years_driving_experience"
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={formData.years_driving_experience}
                    onChange={handleChange}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_duration_years">Years Holding License *</Label>
                  <Input
                    id="license_duration_years"
                    name="license_duration_years"
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={formData.license_duration_years}
                    onChange={handleChange}
                    placeholder="7"
                  />
                </div>
              </div>
            </div>

            {/* Availability Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Event Availability</h3>
                <p className="text-sm text-gray-600">When are you available during August 2025?</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availability_start">Availability Start Date *</Label>
                    <Input
                      id="availability_start"
                      name="availability_start"
                      type="date"
                      required
                      min="2025-08-01"
                      max="2025-08-31"
                      value={formData.availability_start}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability_end">Availability End Date *</Label>
                    <Input
                      id="availability_end"
                      name="availability_end"
                      type="date"
                      required
                      min="2025-08-01"
                      max="2025-08-31"
                      value={formData.availability_end}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Availability Days Display */}
                {(() => {
                  const days = calculateAvailabilityDays()
                  if (days !== null) {
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Total Availability Period
                            </p>
                            <p className="text-lg font-bold text-blue-900">
                              {days} {days === 1 ? 'day' : 'days'}
                            </p>
                            {days > 0 && (
                              <p className="text-xs text-blue-700">
                                You are available from {formData.availability_start && new Date(formData.availability_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {formData.availability_end && new Date(formData.availability_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                        {days === 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            ⚠️ End date should be on or after the start date
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}