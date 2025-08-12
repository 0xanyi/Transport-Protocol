import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { sendEmail, createAssignmentNotificationEmail } from '@/lib/email'
import { format } from 'date-fns'

export const POST = requirePermission('assignments', 'create', async (request: NextRequest) => {
  try {
    const assignmentData = await request.json()
    
    // Validate required fields
    if (!assignmentData.driver_id || !assignmentData.vehicle_id) {
      return NextResponse.json({ error: 'Driver ID and Vehicle ID are required' }, { status: 400 })
    }

    // Use service client to bypass RLS for admin operations
    const serviceSupabase = createServiceClient()

    // Create the assignment
    const { data, error } = await serviceSupabase
      .from('assignments')
      .insert([assignmentData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update vehicle assignment
    const { error: vehicleError } = await serviceSupabase
      .from('vehicles')
      .update({ current_driver_id: assignmentData.driver_id })
      .eq('id', assignmentData.vehicle_id)

    if (vehicleError) {
      console.error('Vehicle update error:', vehicleError)
    }

    // Update VIP assignment if provided
    if (assignmentData.vip_id) {
      const { error: vipError } = await serviceSupabase
        .from('vips')
        .update({ assigned_driver_id: assignmentData.driver_id })
        .eq('id', assignmentData.vip_id)

      if (vipError) {
        console.error('VIP update error:', vipError)
      }
    }

    // Send email notification to driver
    try {
      // Get driver details
      const { data: driver, error: driverError } = await serviceSupabase
        .from('drivers')
        .select('name, email')
        .eq('id', assignmentData.driver_id)
        .single()

      if (driverError) {
        console.error('Driver fetch error for email:', driverError)
      } else if (driver) {
        // Get vehicle details
        const { data: vehicle, error: vehicleError } = await serviceSupabase
          .from('vehicles')
          .select('make, model, registration')
          .eq('id', assignmentData.vehicle_id)
          .single()

        // Get VIP details if assigned
        let vip = null
        if (assignmentData.vip_id) {
          const { data: vipData, error: vipFetchError } = await serviceSupabase
            .from('vips')
            .select('name, arrival_airport, departure_airport')
            .eq('id', assignmentData.vip_id)
            .single()
          
          if (!vipFetchError) {
            vip = vipData
          }
        }

        const vehicleInfo = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : 'Vehicle details unavailable'
        
        const assignmentDetails = {
          vipName: vip?.name,
          vehicleInfo,
          startTime: format(new Date(assignmentData.start_time), 'PPP p'),
          endTime: assignmentData.end_time ? format(new Date(assignmentData.end_time), 'PPP p') : undefined,
          pickupLocation: vip?.arrival_airport,
          dropoffLocation: vip?.departure_airport,
          specialInstructions: assignmentData.notes
        }

        const emailData = createAssignmentNotificationEmail(
          driver.name,
          driver.email,
          assignmentDetails
        )

        await sendEmail(emailData)
        console.log('Assignment notification email sent to:', driver.email)
      }
    } catch (emailError) {
      console.error('Failed to send assignment notification email:', emailError)
      // Don't fail the assignment creation if email fails
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const GET = requirePermission('assignments', 'read', async (request: NextRequest) => {
  try {
    // Use service client to bypass RLS for admin operations
    const serviceSupabase = createServiceClient()

    const { data, error } = await serviceSupabase
      .from('assignments')
      .select(`
        *,
        driver:driver_id(id, name, phone, email),
        vehicle:vehicle_id(id, make, model, registration),
        vip:vip_id(id, name, arrival_date, departure_date)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})