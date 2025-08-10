'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Driver } from '@/types'
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, Calendar, Trash2, Mail, AlertTriangle, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [updatingDriverId, setUpdatingDriverId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('Fetched drivers:', data)
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDriverStatus = async (driverId: string, status: 'approved' | 'rejected') => {
    setUpdatingDriverId(driverId)
    
    try {
      console.log('Updating driver status:', { driverId, status })
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .update({ status: status === 'rejected' ? 'inactive' : status })
        .eq('id', driverId)
        .select()

      if (error) {
        console.error('Database error:', error)
        alert(`Error updating driver status: ${error.message}`)
        return
      }
      
      console.log('Update successful:', data)
      
      // Update the local state immediately instead of refetching
      setDrivers(prev => 
        prev.map(driver => 
          driver.id === driverId 
            ? { ...driver, status: status === 'rejected' ? 'inactive' : status }
            : driver
        )
      )
      
      alert(`Driver ${status === 'approved' ? 'approved' : 'rejected'} successfully!`)
      
    } catch (error) {
      console.error('Error updating driver status:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setUpdatingDriverId(null)
    }
  }

  const deleteDriver = async (driverId: string, driverName: string) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${driverName}? This action cannot be undone.`
    )
    
    if (!confirmed) return

    setUpdatingDriverId(driverId)
    
    try {
      console.log('Deleting driver:', { driverId, driverName })
      
      const supabase = createClient()
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)

      if (error) {
        console.error('Database error:', error)
        alert(`Error deleting driver: ${error.message}`)
        return
      }
      
      console.log('Delete successful')
      
      // Remove from local state immediately
      setDrivers(prev => prev.filter(driver => driver.id !== driverId))
      
      alert(`${driverName} has been deleted successfully.`)
      
    } catch (error) {
      console.error('Error deleting driver:', error)
      alert('An unexpected error occurred while deleting. Please try again.')
    } finally {
      setUpdatingDriverId(null)
    }
  }

  const filteredDrivers = drivers
    .filter(driver => {
      const matchesStatus = selectedStatus === 'all' || driver.status === selectedStatus
      const matchesSearch = searchQuery === '' || 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone.includes(searchQuery) ||
        driver.church.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.group.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesStatus && matchesSearch
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drivers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage and approve driver registrations</p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('all')}
              size="sm"
            >
              All ({drivers.length})
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('pending')}
              size="sm"
            >
              Pending ({drivers.filter(d => d.status === 'pending').length})
            </Button>
            <Button
              variant={selectedStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('approved')}
              size="sm"
            >
              Approved ({drivers.filter(d => d.status === 'approved').length})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No drivers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid lg:grid-cols-4 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-lg">{driver.name}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3" />
                          <span>{driver.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3" />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3" />
                          <span>{driver.home_post_code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Church:</span> {driver.church}</p>
                      <p><span className="font-medium">Zone:</span> {driver.zone}</p>
                      <p><span className="font-medium">Group:</span> {driver.group}</p>
                      <p><span className="font-medium">KingsChat:</span> {driver.kingschat_handle || 'N/A'}</p>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Emergency Contact:</span></p>
                      <p className="text-gray-600">{driver.emergency_contact_name}</p>
                      <p className="text-gray-600">{driver.emergency_contact_phone}</p>
                      <p><span className="font-medium">Experience:</span> {driver.years_driving_experience} years</p>
                      <p><span className="font-medium">License:</span> {driver.license_duration_years} years</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Availability</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(driver.availability_start), 'dd MMM')} - {format(new Date(driver.availability_end), 'dd MMM yyyy')}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(driver.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(driver.status)}`}>
                          {driver.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {driver.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateDriverStatus(driver.id, 'approved')}
                          disabled={updatingDriverId === driver.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingDriverId === driver.id ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateDriverStatus(driver.id, 'rejected')}
                          disabled={updatingDriverId === driver.id}
                        >
                          {updatingDriverId === driver.id ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDriver(driver.id, driver.name)}
                      disabled={updatingDriverId === driver.id}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {updatingDriverId === driver.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}