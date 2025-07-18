import { NextResponse } from 'next/server'
import { createAdminClient, supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: Request) {
  try {
    // Get session using the existing supabase client
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unread') === 'true'

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Add filter for unread notifications if requested
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data, count })
  } catch (error) {
    console.error('Exception in GET /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification (admin only)
export async function POST(request: Request) {
  try {
    // Get session using the existing supabase client
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admins to create notifications
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse the request body
    const body = await request.json()
    const { user_id, title, message, type, related_id } = body

    // Validate required fields
    if (!user_id || !title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the notification using the admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        related_id,
        is_read: false,
      })
      .select()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notification: data[0] })
  } catch (error) {
    console.error('Exception in POST /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 