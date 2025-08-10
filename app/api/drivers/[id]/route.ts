import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Validate driver exists
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    // Update driver
    const { data: driver, error } = await supabase
      .from('drivers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Driver updated successfully',
      driver
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if driver exists
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    // Delete driver
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Driver ${existingDriver.name} deleted successfully`
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}