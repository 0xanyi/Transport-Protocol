import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { canAccessDepartment } from '@/lib/permissions'
import { DriverTrackingInfo, TrackingDashboardFilters } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to tracking dashboard
    const hasAccess = authResult.user.role === 'admin' || 
                     canAccessDepartment(authResult.user, 'hospitality') ||
                     canAccessDepartment(authResult.user, 'lounge') ||
                     canAccessDepartment(authResult.user, 'transport')

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: TrackingDashboardFilters = {
      driver_id: searchParams.get('driver_id') || undefined,
      assignment_status: (searchParams.get('assignment_status') as any) || undefined,
      date_range: searchParams.get('start_date') && searchParams.get('end_date') ? {
        start: new Date(searchParams.get('start_date')!),
        end: new Date(searchParams.get('end_date')!)
      } : undefined,
      checkin_type: (searchParams.get('checkin_type') as any) || undefined
    }

    const supabase = await createClient()

    // Build query for active assignments with driver and VIP details
    let assignmentsQuery = supabase
      .from('assignments')
      .select(`
        id,
        status,
        start_time,
        end_time,
        driver_id,
        vip_id,
        vehicle_id
      `)

    // Apply filters
    if (filters.driver_id) {
      assignmentsQuery = assignmentsQuery.eq('driver_id', filters.driver_id)
    }

    if (filters.assignment_status) {
      assignmentsQuery = assignmentsQuery.eq('status', filters.assignment_status)
    } else {
      // Default to active and scheduled assignments
      assignmentsQuery = assignmentsQuery.in('status', ['active', 'scheduled'])
    }

    if (filters.date_range) {
      assignmentsQuery = assignmentsQuery
        .gte('start_time', filters.date_range.start.toISOString())
        .lte('start_time', filters.date_range.end.toISOString())
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery
      .order('start_time', { ascending: false })

    if (assignmentsError) throw assignmentsError

    // Get recent check-ins for each assignment
    const trackingInfo: DriverTrackingInfo[] = []

    for (const assignment of assignments || []) {
      // Fetch related data separately
      const [driverResult, vipResult, vehicleResult] = await Promise.all([
        supabase.from('drivers').select('id, name, phone').eq('id', assignment.driver_id).single(),
        assignment.vip_id ? supabase.from('vips').select('id, name').eq('id', assignment.vip_id).single() : Promise.resolve({ data: null, error: null }),
        supabase.from('vehicles').select('id, make, model, registration').eq('id', assignment.vehicle_id).single()
      ])

      if (driverResult.error) {
        console.error('Error fetching driver:', driverResult.error)
        continue
      }

      // Get latest check-in for this assignment
      let checkinsQuery = supabase
        .from('checkins')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (filters.checkin_type) {
        checkinsQuery = checkinsQuery.eq('checkin_type', filters.checkin_type)
      }

      const { data: latestCheckin } = await checkinsQuery.single()

      // Get all check-ins for progress calculation
      const { data: allCheckins } = await supabase
        .from('checkins')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('timestamp', { ascending: false })

      // Calculate assignment progress
      const progress = calculateAssignmentProgress(allCheckins || [])

      // Determine current status based on latest check-in
      const currentStatus = determineDriverStatus(latestCheckin, assignment.status)

      const trackingData: DriverTrackingInfo = {
        driver_id: driverResult.data.id,
        driver_name: driverResult.data.name,
        driver_phone: driverResult.data.phone,
        assignment_id: assignment.id,
        vip_name: vipResult.data?.name,
        vehicle_info: vehicleResult.data ?
          `${vehicleResult.data.make} ${vehicleResult.data.model} (${vehicleResult.data.registration})` :
          undefined,
        current_status: currentStatus,
        last_checkin: latestCheckin ? {
          ...latestCheckin,
          timestamp: new Date(latestCheckin.timestamp),
          created_at: new Date(latestCheckin.created_at)
        } : undefined,
        location: latestCheckin?.latitude && latestCheckin?.longitude ? {
          latitude: parseFloat(latestCheckin.latitude),
          longitude: parseFloat(latestCheckin.longitude)
        } : undefined,
        assignment_progress: progress
      }

      trackingInfo.push(trackingData)
    }

    return NextResponse.json({ 
      tracking_info: trackingInfo,
      filters_applied: filters,
      total_count: trackingInfo.length
    })

  } catch (error) {
    console.error('Error fetching tracking data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateAssignmentProgress(checkins: any[]) {
  // This is a simplified version - you can enhance this based on your needs
  const dailyCheckinTypes = [
    'hotel_to_events_venue',
    'arrived_at_events_venue',
    'departing_events_venue',
    'arrived_at_hotel'
  ]

  const oneTimeCheckinTypes = [
    'airport_arrival',
    'vip_pickup'
  ]

  const today = new Date().toISOString().split('T')[0]

  const progress = {
    daily_checkins: dailyCheckinTypes.map(type => ({
      checkin_type: type as any,
      completed: checkins.some(c => 
        c.checkin_type === type && 
        c.is_daily_checkin && 
        c.event_date === today
      ),
      sessions: {}
    })),
    one_time_checkins: oneTimeCheckinTypes.reduce((acc, type) => {
      acc[type as any] = {
        completed: checkins.some(c => c.checkin_type === type && !c.is_daily_checkin)
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

  return progress
}

function determineDriverStatus(latestCheckin: any, assignmentStatus: string): string {
  if (!latestCheckin) {
    return assignmentStatus === 'active' ? 'Available' : 'Scheduled'
  }

  const statusMap: { [key: string]: string } = {
    'airport_arrival': 'At Airport',
    'vip_pickup': 'With VIP',
    'hotel_to_events_venue': 'En Route to Events Venue',
    'arrived_at_events_venue': 'At Events Venue',
    'departing_events_venue': 'Departing Events Venue',
    'arrived_at_hotel': 'At Hotel',
    'custom': 'Custom Location'
  }

  return statusMap[latestCheckin.checkin_type] || 'Active'
}