import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authResult.user.id
    const supabase = createClient()

    // First get the driver record for this user
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (driverError || !driverData) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Get current assignment for this driver
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        driver:driver_id(id, name, phone, email),
        vehicle:vehicle_id(id, make, model, registration, pickup_location, pickup_mileage, pickup_fuel_gauge),
        vip:vip_id(id, name, arrival_date, arrival_time, arrival_airport, arrival_terminal, departure_date, departure_time, departure_airport, departure_terminal, remarks)
      `)
      .eq('driver_id', driverData.id)
      .in('status', ['scheduled', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (assignmentError) {
      if (assignmentError.code === 'PGRST116') {
        // No assignment found
        return NextResponse.json({ assignment: null })
      }
      throw assignmentError
    }

    // Get check-ins for this assignment if it exists
    let checkins = []
    if (assignmentData) {
      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('*')
        .eq('assignment_id', assignmentData.id)
        .order('timestamp', { ascending: false })

      checkins = checkinsData || []
    }

    return NextResponse.json({ 
      assignment: assignmentData,
      checkins 
    })

  } catch (error) {
    console.error('Error fetching driver assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}