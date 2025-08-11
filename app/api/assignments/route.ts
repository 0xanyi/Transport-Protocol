import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

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