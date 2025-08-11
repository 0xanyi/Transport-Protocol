'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { VIP } from '@/types'
import { UserCheck, Plane, Plus, X, Calendar, Clock, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function VIPsPage() {
  const [vips, setVips] = useState<VIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVip, setEditingVip] = useState<VIP | null>(null)
  const [viewingVip, setViewingVip] = useState<VIP | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    arrival_date: '',
    arrival_time: '',
    arrival_airport: '',
    arrival_terminal: '',
    departure_date: '',
    departure_time: '',
    departure_airport: '',
    departure_terminal: '',
    remarks: '',
  })

  useEffect(() => {
    fetchVips()
  }, [])

  const fetchVips = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vips')
        .select('*')
        .order('arrival_date', { ascending: true })

      if (error) throw error
      setVips(data || [])
    } catch (error) {
      console.error('Error fetching VIPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      arrival_date: '',
      arrival_time: '',
      arrival_airport: '',
      arrival_terminal: '',
      departure_date: '',
      departure_time: '',
      departure_airport: '',
      departure_terminal: '',
      remarks: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = createClient()
      
      if (editingVip) {
        // Update existing VIP
        const { error } = await supabase
          .from('vips')
          .update(formData)
          .eq('id', editingVip.id)

        if (error) throw error
      } else {
        // Insert new VIP
        const { error } = await supabase
          .from('vips')
          .insert([formData])

        if (error) throw error
      }
      
      // Reset form and refresh list
      resetForm()
      setShowAddForm(false)
      setEditingVip(null)
      fetchVips()
    } catch (error) {
      console.error('Error saving VIP:', error)
    }
  }

  const handleEdit = (vip: VIP) => {
    setEditingVip(vip)
    setFormData({
      name: vip.name,
      arrival_date: vip.arrival_date.toString().split('T')[0],
      arrival_time: vip.arrival_time,
      arrival_airport: vip.arrival_airport,
      arrival_terminal: vip.arrival_terminal || '',
      departure_date: vip.departure_date.toString().split('T')[0],
      departure_time: vip.departure_time,
      departure_airport: vip.departure_airport,
      departure_terminal: vip.departure_terminal || '',
      remarks: vip.remarks || '',
    })
    setShowAddForm(true)
  }

  const handleDelete = async (vip: VIP) => {
    if (!confirm(`Are you sure you want to delete ${vip.name}?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vips')
        .delete()
        .eq('id', vip.id)

      if (error) throw error
      
      fetchVips()
    } catch (error) {
      console.error('Error deleting VIP:', error)
    }
  }

  const handleView = (vip: VIP) => {
    setViewingVip(vip)
  }

  const handleCancelEdit = () => {
    setEditingVip(null)
    setShowAddForm(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading VIPs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VIP Management</h1>
          <p className="text-gray-600 mt-1">Manage senior ministers and their travel itineraries</p>
        </div>
        
        <Button onClick={() => showAddForm ? handleCancelEdit() : setShowAddForm(true)}>
          {showAddForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add VIP
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVip ? 'Edit VIP' : 'Add New VIP'}</CardTitle>
            <CardDescription>
              {editingVip ? 'Update travel itinerary details' : 'Enter travel itinerary details for senior minister'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Senior Minister Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Pastor John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_date">Arrival Date *</Label>
                  <Input
                    id="arrival_date"
                    name="arrival_date"
                    type="date"
                    required
                    value={formData.arrival_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_time">Arrival Time *</Label>
                  <Input
                    id="arrival_time"
                    name="arrival_time"
                    type="time"
                    required
                    value={formData.arrival_time}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_airport">Arrival Airport *</Label>
                  <Input
                    id="arrival_airport"
                    name="arrival_airport"
                    required
                    value={formData.arrival_airport}
                    onChange={handleChange}
                    placeholder="Heathrow Airport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival_terminal">Arrival Terminal</Label>
                  <Input
                    id="arrival_terminal"
                    name="arrival_terminal"
                    value={formData.arrival_terminal}
                    onChange={handleChange}
                    placeholder="Terminal 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_date">Departure Date *</Label>
                  <Input
                    id="departure_date"
                    name="departure_date"
                    type="date"
                    required
                    value={formData.departure_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time *</Label>
                  <Input
                    id="departure_time"
                    name="departure_time"
                    type="time"
                    required
                    value={formData.departure_time}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_airport">Departure Airport *</Label>
                  <Input
                    id="departure_airport"
                    name="departure_airport"
                    required
                    value={formData.departure_airport}
                    onChange={handleChange}
                    placeholder="Heathrow Airport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_terminal">Departure Terminal</Label>
                  <Input
                    id="departure_terminal"
                    name="departure_terminal"
                    value={formData.departure_terminal}
                    onChange={handleChange}
                    placeholder="Terminal 3"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Special requirements or notes..."
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingVip ? 'Update VIP' : 'Add VIP'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {vips.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No VIPs added yet</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add VIP" to get started</p>
            </CardContent>
          </Card>
        ) : (
          vips.map((vip) => (
            <Card key={vip.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-lg">{vip.name}</span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-green-700 flex items-center">
                          <Plane className="w-4 h-4 mr-2" />
                          Arrival
                        </h3>
                        <div className="text-sm space-y-1 ml-6">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>{format(new Date(vip.arrival_date), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{vip.arrival_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span>{vip.arrival_airport}</span>
                            {vip.arrival_terminal && <span className="text-gray-500">- {vip.arrival_terminal}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="space-y-2 mt-12">
                        <h3 className="font-medium text-red-700 flex items-center">
                          <Plane className="w-4 h-4 mr-2 transform rotate-45" />
                          Departure
                        </h3>
                        <div className="text-sm space-y-1 ml-6">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>{format(new Date(vip.departure_date), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{vip.departure_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span>{vip.departure_airport}</span>
                            {vip.departure_terminal && <span className="text-gray-500">- {vip.departure_terminal}</span>}
                          </div>
                        </div>
                      </div>

                      {vip.remarks && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                          <p className="text-sm font-medium text-yellow-800">Remarks:</p>
                          <p className="text-sm text-yellow-700">{vip.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-center space-y-2">
                    {vip.assigned_driver_id ? (
                      <div className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                        <p className="text-xs text-green-600 font-medium">ASSIGNED</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto mb-1"></div>
                        <p className="text-xs text-gray-500">UNASSIGNED</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(vip)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(vip)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(vip)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View VIP Detail Modal */}
      {viewingVip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span>{viewingVip.name}</span>
                  </CardTitle>
                  <CardDescription>VIP Travel Details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingVip(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Arrival Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-green-700 flex items-center text-lg">
                    <Plane className="w-5 h-5 mr-2" />
                    Arrival Information
                  </h3>
                  <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Date</p>
                        <p className="text-green-700">{format(new Date(viewingVip.arrival_date), 'EEEE, dd MMMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Time</p>
                        <p className="text-green-700">{viewingVip.arrival_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Airport</p>
                        <p className="text-green-700">{viewingVip.arrival_airport}</p>
                        {viewingVip.arrival_terminal && (
                          <p className="text-sm text-green-600">Terminal: {viewingVip.arrival_terminal}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Departure Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-red-700 flex items-center text-lg">
                    <Plane className="w-5 h-5 mr-2 transform rotate-45" />
                    Departure Information
                  </h3>
                  <div className="space-y-3 bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Date</p>
                        <p className="text-red-700">{format(new Date(viewingVip.departure_date), 'EEEE, dd MMMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Time</p>
                        <p className="text-red-700">{viewingVip.departure_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Airport</p>
                        <p className="text-red-700">{viewingVip.departure_airport}</p>
                        {viewingVip.departure_terminal && (
                          <p className="text-sm text-red-600">Terminal: {viewingVip.departure_terminal}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Status */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">Assignment Status</h3>
                <div className="flex items-center space-x-3">
                  {viewingVip.assigned_driver_id ? (
                    <>
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Driver Assigned</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-500">No Driver Assigned</span>
                    </>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {viewingVip.remarks && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Remarks</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">{viewingVip.remarks}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4 flex space-x-3">
                <Button
                  onClick={() => {
                    setViewingVip(null)
                    handleEdit(viewingVip)
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit VIP
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingVip(null)
                    handleDelete(viewingVip)
                  }}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete VIP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}