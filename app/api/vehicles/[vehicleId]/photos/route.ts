import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/auth'
import { deleteFile } from '@/lib/cloudflare-r2'

// GET - Fetch vehicle photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId } = await params
    const supabase = await createClient()

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('pickup_photos, dropoff_photos')
      .eq('id', vehicleId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({
      pickup_photos: vehicle.pickup_photos || [],
      dropoff_photos: vehicle.dropoff_photos || []
    })

  } catch (error) {
    console.error('Error fetching vehicle photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add photos to vehicle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions for updating vehicles
    if (!hasPermission(authResult.user.role, 'vehicles', 'update')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const { vehicleId } = await params
    const body = await request.json()
    const { photos, photoType = 'pickup' } = body

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Photos array is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current photos
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('pickup_photos, dropoff_photos')
      .eq('id', vehicleId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Update the appropriate photo array
    const updateData: any = {}
    if (photoType === 'pickup') {
      updateData.pickup_photos = [...(vehicle.pickup_photos || []), ...photos]
    } else if (photoType === 'dropoff') {
      updateData.dropoff_photos = [...(vehicle.dropoff_photos || []), ...photos]
    }

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update vehicle photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Photos added successfully',
      vehicle: updatedVehicle
    })

  } catch (error) {
    console.error('Error adding vehicle photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove photo from vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const authResult = await getAuthContext(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions for updating vehicles
    if (!hasPermission(authResult.user.role, 'vehicles', 'update')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const { vehicleId } = await params
    const { searchParams } = new URL(request.url)
    const photoKey = searchParams.get('key')
    const photoType = searchParams.get('type') || 'pickup'

    if (!photoKey) {
      return NextResponse.json(
        { error: 'Photo key is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current photos
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('pickup_photos, dropoff_photos')
      .eq('id', vehicleId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Remove photo from array
    const updateData: any = {}
    if (photoType === 'pickup') {
      updateData.pickup_photos = (vehicle.pickup_photos || []).filter(
        (photo: string) => !photo.includes(photoKey)
      )
    } else if (photoType === 'dropoff') {
      updateData.dropoff_photos = (vehicle.dropoff_photos || []).filter(
        (photo: string) => !photo.includes(photoKey)
      )
    }

    // Update database
    const { error: updateError } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove photo from database' },
        { status: 500 }
      )
    }

    // Delete from Cloudflare R2
    try {
      await deleteFile(photoKey)
    } catch (r2Error) {
      console.warn('Failed to delete file from R2:', r2Error)
      // Continue even if R2 deletion fails
    }

    return NextResponse.json({ message: 'Photo removed successfully' })

  } catch (error) {
    console.error('Error removing vehicle photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
