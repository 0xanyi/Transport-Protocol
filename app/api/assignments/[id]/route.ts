import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const DELETE = requirePermission('assignments', 'delete', async (request: NextRequest, context, routeContext) => {
  const params = await routeContext.params
  const assignmentId = params.id
  
  if (!assignmentId) {
    console.error('DELETE /api/assignments/[id] - Missing assignment ID')
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
  }

  console.log(`DELETE /api/assignments/${assignmentId} - Starting deletion process`)

  try {
    const serviceSupabase = createServiceClient()

    // Step 1: Fetch the assignment to validate it exists and get related data
    console.log(`DELETE /api/assignments/${assignmentId} - Fetching assignment details`)
    const { data: assignment, error: fetchError } = await serviceSupabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (fetchError) {
      console.error(`DELETE /api/assignments/${assignmentId} - Fetch error:`, fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
    }

    if (!assignment) {
      console.error(`DELETE /api/assignments/${assignmentId} - Assignment not found`)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    console.log(`DELETE /api/assignments/${assignmentId} - Found assignment:`, {
      id: assignment.id,
      driver_id: assignment.driver_id,
      vehicle_id: assignment.vehicle_id,
      vip_id: assignment.vip_id,
      status: assignment.status
    })

    // Step 2: Check for related records that might prevent deletion
    console.log(`DELETE /api/assignments/${assignmentId} - Checking for related records`)
    
    // Check for checkins
    const { data: checkins, error: checkinsError } = await serviceSupabase
      .from('checkins')
      .select('id')
      .eq('assignment_id', assignmentId)

    if (checkinsError) {
      console.error(`DELETE /api/assignments/${assignmentId} - Error checking checkins:`, checkinsError)
      return NextResponse.json({ error: 'Failed to check related checkins' }, { status: 500 })
    }

    // Check for vehicle observations
    const { data: observations, error: observationsError } = await serviceSupabase
      .from('vehicle_observations')
      .select('id')
      .eq('assignment_id', assignmentId)

    if (observationsError) {
      console.error(`DELETE /api/assignments/${assignmentId} - Error checking vehicle observations:`, observationsError)
      return NextResponse.json({ error: 'Failed to check related vehicle observations' }, { status: 500 })
    }

    console.log(`DELETE /api/assignments/${assignmentId} - Related records found:`, {
      checkins: checkins?.length || 0,
      observations: observations?.length || 0
    })

    // Step 3: Delete related records first (if any)
    if (checkins && checkins.length > 0) {
      console.log(`DELETE /api/assignments/${assignmentId} - Deleting ${checkins.length} related checkins`)
      const { error: deleteCheckinsError } = await serviceSupabase
        .from('checkins')
        .delete()
        .eq('assignment_id', assignmentId)

      if (deleteCheckinsError) {
        console.error(`DELETE /api/assignments/${assignmentId} - Error deleting checkins:`, deleteCheckinsError)
        return NextResponse.json({ error: 'Failed to delete related checkins' }, { status: 500 })
      }
      console.log(`DELETE /api/assignments/${assignmentId} - Successfully deleted checkins`)
    }

    if (observations && observations.length > 0) {
      console.log(`DELETE /api/assignments/${assignmentId} - Deleting ${observations.length} related vehicle observations`)
      const { error: deleteObservationsError } = await serviceSupabase
        .from('vehicle_observations')
        .delete()
        .eq('assignment_id', assignmentId)

      if (deleteObservationsError) {
        console.error(`DELETE /api/assignments/${assignmentId} - Error deleting vehicle observations:`, deleteObservationsError)
        return NextResponse.json({ error: 'Failed to delete related vehicle observations' }, { status: 500 })
      }
      console.log(`DELETE /api/assignments/${assignmentId} - Successfully deleted vehicle observations`)
    }

    // Step 4: Clear vehicle assignment
    if (assignment.vehicle_id) {
      console.log(`DELETE /api/assignments/${assignmentId} - Clearing vehicle assignment for vehicle ${assignment.vehicle_id}`)
      const { error: vehicleUpdateError } = await serviceSupabase
        .from('vehicles')
        .update({ current_driver_id: null })
        .eq('id', assignment.vehicle_id)

      if (vehicleUpdateError) {
        console.error(`DELETE /api/assignments/${assignmentId} - Error clearing vehicle assignment:`, vehicleUpdateError)
        return NextResponse.json({ error: 'Failed to clear vehicle assignment' }, { status: 500 })
      }
      console.log(`DELETE /api/assignments/${assignmentId} - Successfully cleared vehicle assignment`)
    }

    // Step 5: Clear VIP assignment (if exists)
    if (assignment.vip_id) {
      console.log(`DELETE /api/assignments/${assignmentId} - Clearing VIP assignment for VIP ${assignment.vip_id}`)
      const { error: vipUpdateError } = await serviceSupabase
        .from('vips')
        .update({ assigned_driver_id: null })
        .eq('id', assignment.vip_id)

      if (vipUpdateError) {
        console.error(`DELETE /api/assignments/${assignmentId} - Error clearing VIP assignment:`, vipUpdateError)
        return NextResponse.json({ error: 'Failed to clear VIP assignment' }, { status: 500 })
      }
      console.log(`DELETE /api/assignments/${assignmentId} - Successfully cleared VIP assignment`)
    }

    // Step 6: Delete the assignment itself
    console.log(`DELETE /api/assignments/${assignmentId} - Deleting assignment record`)
    const { error: deleteError } = await serviceSupabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error(`DELETE /api/assignments/${assignmentId} - Error deleting assignment:`, deleteError)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    console.log(`DELETE /api/assignments/${assignmentId} - Successfully deleted assignment`)

    return NextResponse.json({ 
      message: 'Assignment deleted successfully',
      deletedAssignmentId: assignmentId,
      relatedRecordsDeleted: {
        checkins: checkins?.length || 0,
        observations: observations?.length || 0
      }
    })

  } catch (error) {
    console.error(`DELETE /api/assignments/${assignmentId} - Unexpected error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})