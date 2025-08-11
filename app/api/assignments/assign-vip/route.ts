import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const POST = requirePermission('assignments', 'update', async (request: NextRequest) => {
  try {
    const { vipId, driverId } = await request.json()
    
    // Validate required fields
    if (!vipId || !driverId) {
      return NextResponse.json({ error: 'VIP ID and Driver ID are required' }, { status: 400 })
    }

    // Use service client to bypass RLS for admin operations
    const serviceSupabase = createServiceClient()

    // Find the active assignment for this driver
    const { data: existingAssignment, error: findError } = await serviceSupabase
      .from('assignments')
      .select('id, vehicle_id')
      .eq('driver_id', driverId)
      .in('status', ['scheduled', 'active'])
      .single()

    if (findError || !existingAssignment) {
      console.error('No active assignment found for driver:', findError)
      return NextResponse.json({ error: 'No active assignment found for this driver' }, { status: 404 })
    }

    // Update the assignment to include the VIP
    const { error: updateError } = await serviceSupabase
      .from('assignments')
      .update({ vip_id: vipId })
      .eq('id', existingAssignment.id)

    if (updateError) {
      console.error('Assignment update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update VIP assignment
    const { error: vipError } = await serviceSupabase
      .from('vips')
      .update({ assigned_driver_id: driverId })
      .eq('id', vipId)

    if (vipError) {
      console.error('VIP update error:', vipError)
      return NextResponse.json({ error: vipError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('VIP assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})