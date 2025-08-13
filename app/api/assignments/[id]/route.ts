import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const PUT = requirePermission('assignments', 'update', async (request: NextRequest, context, routeContext) => {
  const params = await routeContext.params
  const assignmentId = params.id
  
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { vip_id, vehicle_id, start_time, end_time } = body

    const serviceSupabase = createServiceClient()

    // First, get the current assignment to check what's changing
    const { data: currentAssignment, error: fetchError } = await serviceSupabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !currentAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {}
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (vip_id !== undefined) updateData.vip_id = vip_id
    if (vehicle_id !== undefined) updateData.vehicle_id = vehicle_id

    // Handle vehicle reassignment
    if (vehicle_id !== undefined && vehicle_id !== currentAssignment.vehicle_id) {
      // Check if new vehicle is available
      if (vehicle_id) {
        const { data: newVehicle, error: vehicleCheckError } = await serviceSupabase
          .from('vehicles')
          .select('current_driver_id')
          .eq('id', vehicle_id)
          .single()

        if (vehicleCheckError) {
          return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
        }

        if (newVehicle.current_driver_id && newVehicle.current_driver_id !== currentAssignment.driver_id) {
          return NextResponse.json({ error: 'Vehicle is already assigned to another driver' }, { status: 400 })
        }
      }

      // Clear old vehicle assignment
      if (currentAssignment.vehicle_id) {
        await serviceSupabase
          .from('vehicles')
          .update({ current_driver_id: null })
          .eq('id', currentAssignment.vehicle_id)
      }

      // Set new vehicle assignment
      if (vehicle_id) {
        await serviceSupabase
          .from('vehicles')
          .update({ current_driver_id: currentAssignment.driver_id })
          .eq('id', vehicle_id)
      }
    }

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await serviceSupabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating assignment:', updateError)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    // Handle VIP assignment changes
    if (vip_id !== undefined) {
      // If removing VIP assignment
      if (vip_id === null && currentAssignment.vip_id) {
        await serviceSupabase
          .from('vips')
          .update({ assigned_driver_id: null })
          .eq('id', currentAssignment.vip_id)
      }
      // If adding or changing VIP assignment
      else if (vip_id && vip_id !== currentAssignment.vip_id) {
        // Clear old VIP assignment if exists
        if (currentAssignment.vip_id) {
          await serviceSupabase
            .from('vips')
            .update({ assigned_driver_id: null })
            .eq('id', currentAssignment.vip_id)
        }
        // Set new VIP assignment
        await serviceSupabase
          .from('vips')
          .update({ assigned_driver_id: currentAssignment.driver_id })
          .eq('id', vip_id)
      }
    }

    return NextResponse.json({ data: updatedAssignment })
  } catch (error) {
    console.error('Assignment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

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