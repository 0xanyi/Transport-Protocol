import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ drivers })
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
      'name', 'email', 'phone', 'church', 'zone', 'group',
      'emergency_contact_name', 'emergency_contact_phone',
      'years_driving_experience', 'license_duration_years',
      'availability_start', 'availability_end'
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (basic UK format)
    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid UK phone number format' },
        { status: 400 }
      )
    }

    // Convert numeric fields
    const driverData = {
      ...body,
      years_driving_experience: parseInt(body.years_driving_experience),
      license_duration_years: parseInt(body.license_duration_years),
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A driver with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create driver registration' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Driver registered successfully', driver },
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