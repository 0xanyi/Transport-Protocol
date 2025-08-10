import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find the user account
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the driver record to link it with the user account
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        status: 'approved',
        user_id: user.id
      })
      .eq('email', email)
      .select()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update driver', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      driver: updatedDriver?.[0] || null,
      message: `Driver ${email} has been linked to user account and approved`
    })

  } catch (error) {
    console.error('Fix driver error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}