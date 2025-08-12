import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const PATCH = requirePermission('assignments', 'update', async (request: NextRequest, context, routeContext) => {
  try {
    const { status, reason } = await request.json()
    const assignmentId = routeContext.params.id

    // Validate status
    const validStatuses = ['scheduled', 'active', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: scheduled, active, completed' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS for admin operations
    const serviceSupabase = createServiceClient()

    // Get current assignment to validate transition
    const { data: currentAssignment, error: fetchError } = await serviceSupabase
      .from('assignments')
      .select('id, status, driver_id, vehicle_id, vip_id')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !currentAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Validate status transitions
    const currentStatus = currentAssignment.status
    const isValidTransition = validateStatusTransition(currentStatus, status)
    
    if (!isValidTransition) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentStatus} to ${status}` },
        { status: 400 }
      )
    }

    // Update assignment status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add activation timestamp for scheduled -> active transition
    if (currentStatus === 'scheduled' && status === 'active') {
      updateData.activated_at = new Date().toISOString()
    }

    // Add completion timestamp for -> completed transition
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await serviceSupabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select(`
        *,
        driver:driver_id(id, name, phone, email),
        vehicle:vehicle_id(id, make, model, registration),
        vip:vip_id(id, name, arrival_date, departure_date)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the status change
    console.log(`Assignment ${assignmentId} status changed from ${currentStatus} to ${status}${reason ? ` - Reason: ${reason}` : ''}`)

    return NextResponse.json({ 
      assignment: data,
      message: `Assignment status updated to ${status}`,
      previous_status: currentStatus
    })

  } catch (error) {
    console.error('Assignment status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Validate status transitions
function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const transitions: Record<string, string[]> = {
    'scheduled': ['active', 'completed'], // Can skip to completed if needed
    'active': ['completed'],
    'completed': [] // Terminal state
  }

  return transitions[currentStatus]?.includes(newStatus) || currentStatus === newStatus
}

export const GET = requirePermission('assignments', 'read', async (request: NextRequest, context, routeContext) => {
  try {
    const assignmentId = routeContext.params.id

    const serviceSupabase = createServiceClient()

    const { data, error } = await serviceSupabase
      .from('assignments')
      .select(`
        *,
        driver:driver_id(id, name, phone, email),
        vehicle:vehicle_id(id, make, model, registration),
        vip:vip_id(id, name, arrival_date, departure_date)
      `)
      .eq('id', assignmentId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment: data })

  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})