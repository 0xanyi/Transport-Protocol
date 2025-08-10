import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      assignment_id, 
      vehicle_id, 
      observation_type, 
      mileage, 
      fuel_level, 
      damage_notes, 
      photos 
    } = body

    if (!assignment_id || !vehicle_id || !observation_type) {
      return NextResponse.json(
        { error: 'Assignment ID, vehicle ID, and observation type are required' },
        { status: 400 }
      )
    }

  const supabase = await createClient()
    
    // Get the driver ID for the authenticated user
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', authResult.user.id)
      .single()

    if (driverError || !driverData) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Verify this assignment belongs to the driver
    const { data: assignmentData, error: assignmentVerifyError } = await supabase
      .from('assignments')
      .select('id, vehicle_id')
      .eq('id', assignment_id)
      .eq('driver_id', driverData.id)
      .eq('vehicle_id', vehicle_id)
      .single()

    if (assignmentVerifyError || !assignmentData) {
      return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 403 })
    }

    // Create the vehicle observation
    const observationData = {
      driver_id: driverData.id,
      vehicle_id,
      assignment_id,
      observation_type,
      mileage: mileage ? parseInt(mileage) : null,
      fuel_level: fuel_level ? parseInt(fuel_level) : null,
      damage_notes: damage_notes?.trim() || null,
      photos: photos || null,
      timestamp: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('vehicle_observations')
      .insert([observationData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ observation: data }, { status: 201 })

  } catch (error) {
    console.error('Error creating vehicle observation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignment_id = searchParams.get('assignment_id')
    const vehicle_id = searchParams.get('vehicle_id')

    if (!assignment_id && !vehicle_id) {
      return NextResponse.json(
        { error: 'Assignment ID or vehicle ID is required' },
        { status: 400 }
      )
    }

  const supabase = await createClient()
    
    // Get the driver ID for the authenticated user
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', authResult.user.id)
      .single()

    if (driverError || !driverData) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('vehicle_observations')
      .select('*')
      .eq('driver_id', driverData.id)

    if (assignment_id) {
      query = query.eq('assignment_id', assignment_id)
    }
    if (vehicle_id) {
      query = query.eq('vehicle_id', vehicle_id)
    }

    const { data: observations, error } = await query
      .order('timestamp', { ascending: false })

    if (error) throw error

    return NextResponse.json({ observations })

  } catch (error) {
    console.error('Error fetching vehicle observations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}