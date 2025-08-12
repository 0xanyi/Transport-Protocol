import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateUserRequest } from '@/types'
import { requirePermission } from '@/lib/auth'
import type { AuthContext } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const GET = requirePermission('users', 'read', async (
  request: NextRequest,
  _context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch user' },
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

export const PUT = requirePermission('users', 'update', async (
  request: NextRequest,
  _context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json() as UpdateUserRequest & { password?: string }
    const { name, role, department, status, password } = body

    const supabase = await createClient()
    
    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (status !== undefined) updateData.status = status

    // Hash password if provided
    if (password) {
      const saltRounds = 12
      updateData.password_hash = await bcrypt.hash(password, saltRounds)
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        role,
        department,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error updating user:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update user' },
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

export const DELETE = requirePermission('users', 'delete', async (
  request: NextRequest,
  _context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user exists and get their role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      )
    }

    // Prevent deletion of admin users (optional safety check)
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})