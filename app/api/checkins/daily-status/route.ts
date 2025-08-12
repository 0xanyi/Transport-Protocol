import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { DailyCheckinType, OneTimeCheckinType, CheckinProgress } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignment_id = searchParams.get('assignment_id')
    const event_date = searchParams.get('event_date') || new Date().toISOString().split('T')[0]

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

    // Get all check-ins for this assignment
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('assignment_id', assignment_id)
      .eq('driver_id', driverData.id)
      .order('timestamp', { ascending: false })

    if (checkinsError) throw checkinsError

    // Define check-in types
    const dailyCheckinTypes: DailyCheckinType[] = [
      'hotel_to_events_venue',
      'arrived_at_events_venue',
      'departing_events_venue',
      'arrived_at_hotel'
    ]

    const oneTimeCheckinTypes: OneTimeCheckinType[] = [
      'airport_arrival',
      'vip_pickup',
      'custom'
    ]

    // Build progress object
    const progress: CheckinProgress = {
      daily_checkins: dailyCheckinTypes.map(type => {
        const typeCheckins = checkins.filter(c => 
          c.checkin_type === type && 
          c.is_daily_checkin && 
          c.event_date === event_date
        )

        const sessions: { [session_id: string]: any } = {}
        let hasAnySession = false

        typeCheckins.forEach(checkin => {
          const sessionKey = checkin.session_id || 'default'
          sessions[sessionKey] = {
            completed: true,
            timestamp: new Date(checkin.timestamp),
            notes: checkin.notes
          }
          hasAnySession = true
        })

        return {
          checkin_type: type,
          completed: hasAnySession,
          sessions
        }
      }),
      one_time_checkins: oneTimeCheckinTypes.reduce((acc, type) => {
        const checkin = checkins.find(c => 
          c.checkin_type === type && 
          !c.is_daily_checkin &&
          type !== 'custom'
        )

        acc[type] = {
          completed: !!checkin,
          timestamp: checkin ? new Date(checkin.timestamp) : undefined,
          notes: checkin?.notes
        }

        return acc
      }, {} as any),
      custom_checkins: checkins
        .filter(c => c.checkin_type === 'custom')
        .map(c => ({
          id: c.id,
          label: c.custom_label || 'Custom Check-in',
          timestamp: new Date(c.timestamp),
          notes: c.notes
        }))
    }

    return NextResponse.json({ progress, event_date })

  } catch (error) {
    console.error('Error fetching daily check-in status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}