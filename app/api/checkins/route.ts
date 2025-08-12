import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { DailyCheckinType, OneTimeCheckinType, CheckinType } from '@/types'

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
      checkin_type,
      latitude,
      longitude,
      notes,
      event_date,
      session_id,
      custom_label
    } = body

    if (!assignment_id || !checkin_type) {
      return NextResponse.json(
        { error: 'Assignment ID and check-in type are required' },
        { status: 400 }
      )
    }

    // Define which check-in types are daily (reset each day)
    const dailyCheckinTypes: DailyCheckinType[] = [
      'hotel_to_events_venue',
      'arrived_at_events_venue',
      'departing_events_venue',
      'arrived_at_hotel'
    ]
    
    // Define one-time check-in types
    const oneTimeCheckinTypes: OneTimeCheckinType[] = [
      'airport_arrival',
      'vip_pickup',
      'custom'
    ]
    
    const isDailyCheckin = dailyCheckinTypes.includes(checkin_type as DailyCheckinType)
    const isOneTimeCheckin = oneTimeCheckinTypes.includes(checkin_type as OneTimeCheckinType)
    
    // Validation for daily check-ins
    if (isDailyCheckin && !event_date) {
      return NextResponse.json(
        { error: 'Event date is required for daily check-ins' },
        { status: 400 }
      )
    }

    // Validation for custom check-ins
    if (checkin_type === 'custom' && !custom_label) {
      return NextResponse.json(
        { error: 'Custom label is required for custom check-ins' },
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

    // For daily check-ins, check if one already exists for today/session
    if (isDailyCheckin) {
      let query = supabase
        .from('checkins')
        .select('id')
        .eq('driver_id', driverData.id)
        .eq('assignment_id', assignment_id)
        .eq('checkin_type', checkin_type)
        .eq('event_date', event_date)
        .eq('is_daily_checkin', true)

      // If session_id is provided, check for that specific session
      if (session_id) {
        query = query.eq('session_id', session_id)
      } else {
        // If no session_id, check if any session exists for this type/date
        query = query.is('session_id', null)
      }

      const { data: existingCheckin } = await query.single()

      if (existingCheckin) {
        const sessionText = session_id ? ` (${session_id})` : ''
        return NextResponse.json(
          { error: `You have already checked in for ${checkin_type}${sessionText} on ${event_date}` },
          { status: 409 }
        )
      }
    }

    // For one-time check-ins (except custom), check if already exists for this assignment
    if (isOneTimeCheckin && checkin_type !== 'custom') {
      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('driver_id', driverData.id)
        .eq('assignment_id', assignment_id)
        .eq('checkin_type', checkin_type)
        .eq('is_daily_checkin', false)
        .single()

      if (existingCheckin) {
        return NextResponse.json(
          { error: `You have already completed ${checkin_type} for this assignment` },
          { status: 409 }
        )
      }
    }

    // Create the check-in
    const checkinData = {
      driver_id: driverData.id,
      assignment_id,
      checkin_type,
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes?.trim() || null,
      timestamp: new Date().toISOString(),
      is_daily_checkin: isDailyCheckin,
      event_date: isDailyCheckin ? event_date : null,
      session_id: session_id || null,
      custom_label: checkin_type === 'custom' ? custom_label : null
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert([checkinData])
      .select()
      .single()

    if (error) throw error

    // Check if this is the first check-in for this assignment
    // If so, activate the assignment
    const { data: existingCheckins } = await supabase
      .from('checkins')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('driver_id', driverData.id)

    // If this is the first check-in (only the one we just created exists), activate the assignment
    if (existingCheckins && existingCheckins.length === 1) {
      console.log(`Activating assignment ${assignment_id} - first check-in detected`)
      
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment_id)
        .eq('status', 'scheduled') // Only update if still scheduled

      if (updateError) {
        console.error('Error activating assignment:', updateError)
        // Don't fail the check-in if assignment update fails
      } else {
        console.log(`Assignment ${assignment_id} successfully activated`)
      }
    }

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