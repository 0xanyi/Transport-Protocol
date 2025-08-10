import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateUserRequest, User } from '@/types'
import { requirePermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const GET = requirePermission('users', 'read', async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        department,
        status,
        created_at,
        updated_at,
        created_by_user:created_by(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }
    if (department) {
      query = query.eq('department', department)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = requirePermission('users', 'create', async (request: NextRequest) => {
  try {
    const body = await request.json() as CreateUserRequest
    const { email, password, name, role, department } = body

    if (!email || !password || !name || !role || !department) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role, department' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Get current user from auth context (this would be improved with proper auth)
    // For now, we'll assume admin user
    const currentUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        department,
        created_by: currentUserId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Remove password_hash from response
    const { password_hash, ...userResponse } = newUser
    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})