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
    const { assignment_id, checkin_type, latitude, longitude, notes } = body

    if (!assignment_id || !checkin_type) {
      return NextResponse.json(
        { error: 'Assignment ID and check-in type are required' },
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
      .select('id')
      .eq('id', assignment_id)
      .eq('driver_id', driverData.id)
      .single()

    if (assignmentVerifyError || !assignmentData) {
      return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 403 })
    }

    // Create the check-in
    const checkinData = {
      driver_id: driverData.id,
      assignment_id,
      checkin_type,
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes?.trim() || null,
      timestamp: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert([checkinData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ checkin: data }, { status: 201 })

  } catch (error) {
    console.error('Error creating check-in:', error)
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

    if (!assignment_id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
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

    // Verify this assignment belongs to the driver and get check-ins
    const { data: checkins, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('assignment_id', assignment_id)
      .eq('driver_id', driverData.id)
      .order('timestamp', { ascending: false })

    if (error) throw error

    return NextResponse.json({ checkins })

  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}