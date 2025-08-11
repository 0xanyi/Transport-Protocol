import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, hasPermission } from '@/lib/auth'
import { sendEmail, createDriverLoginEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// Generate a random password
function generatePassword(): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const authContext = await getAuthContext(request)
    
    if (!authContext.isAuthenticated || !authContext.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!hasPermission(authContext.user.role, 'drivers', 'update')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
  // Use service client for writes so RLS doesn't block updates/creates
  const supabase = createServiceClient()

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    if (driver.status === 'approved') {
      return NextResponse.json(
        { error: 'Driver is already approved' },
        { status: 400 }
      )
    }

    // Check if user already exists for this driver
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', driver.email)
      .single()

    let userId: string

    if (existingUser) {
      // Update existing user
      userId = existingUser.id
  await supabase
        .from('users')
        .update({
          role: 'driver',
          department: 'transport',
          status: 'active'
        })
        .eq('id', userId)
    } else {
      // Create new user account for the driver
      const generatedPassword = generatePassword()
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(generatedPassword, saltRounds)

  const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: driver.email,
          password_hash: passwordHash,
          name: driver.name,
          role: 'driver',
          department: 'transport',
          status: 'active',
          created_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // System admin
        })
        .select()
        .single()

      if (userError) {
        console.error('Error creating user account:', userError)
        return NextResponse.json(
          { error: 'Failed to create user account for driver' },
          { status: 500 }
        )
      }

      userId = newUser.id

      // Send email with login credentials
      const emailData = createDriverLoginEmail(driver.name, driver.email, generatedPassword)
      const emailSent = await sendEmail(emailData)
      
      if (!emailSent) {
        console.warn(`Failed to send email to ${driver.email}, but user account was created`)
      }
    }

    // Update driver status to approved and link to user account
  const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        status: 'approved',
        user_id: userId
      })
      .eq('id', id)
      .select()

    if (updateError) {
      console.error('Error updating driver status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update driver status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Driver approved successfully and user account created',
      driver: updatedDriver?.[0] || driver,
      loginCredentials: {
        email: driver.email,
        // In production, don't return password in response
        message: 'Login credentials have been sent to the driver\'s email'
      }
    })

  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}