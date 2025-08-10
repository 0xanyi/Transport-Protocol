import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if users table exists and get all users (without password hashes)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, department, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        hint: error.hint || 'Check if users table exists and schema is properly applied'
      })
    }

    // Also check drivers table
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, email, status, user_id')

    return NextResponse.json({ 
      users: users || [],
      drivers: drivers || [],
      usersCount: users?.length || 0,
      driversCount: drivers?.length || 0,
      driversError: driversError?.message || null
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}