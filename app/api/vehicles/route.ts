import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        current_driver:current_driver_id(id, name, phone, status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Validate required fields
    const requiredFields = [
      'make', 'model', 'registration', 'pickup_location',
      'pickup_mileage', 'pickup_fuel_gauge', 'pickup_date'
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (isNaN(body.pickup_mileage) || body.pickup_mileage < 0) {
      return NextResponse.json(
        { error: 'Pickup mileage must be a valid positive number' },
        { status: 400 }
      )
    }

    if (isNaN(body.pickup_fuel_gauge) || body.pickup_fuel_gauge < 0 || body.pickup_fuel_gauge > 100) {
      return NextResponse.json(
        { error: 'Pickup fuel gauge must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Convert numeric fields
    const vehicleData = {
      ...body,
      pickup_mileage: parseInt(body.pickup_mileage),
      pickup_fuel_gauge: parseInt(body.pickup_fuel_gauge),
      pickup_photos: body.pickup_photos || [],
      is_hired: body.is_hired ?? true,
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A vehicle with this registration already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to add vehicle' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Vehicle added successfully', vehicle },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}