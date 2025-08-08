import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    console.log(`🔍 [API] GET /api/rooms/${id}/issues - Fetching room issues`)

    let query = supabase
      .from('room_issues')
      .select(`
        *,
        room:room_id(id, name, location),
        booking:booking_id(id, title, start_time, end_time),
        reported_by:reported_by_user_id(id, name, email),
        resolved_by:resolved_by_user_id(id, name, email)
      `)
      .eq('room_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: issues, error } = await query

    if (error) {
      console.error(`❌ [API] Error fetching room issues:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to fetch room issues" 
        },
        { status: 500 }
      )
    }

    console.log(`📋 [API] Found ${issues?.length || 0} issues for room ${id}`)

    return NextResponse.json({
      success: true,
      issues: issues || []
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error fetching issues for room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room issues" 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, priority = 'medium', booking_id, reported_by_user_id } = body

    console.log(`🚀 [API] POST /api/rooms/${id}/issues - Creating new issue`)
    console.log(`📝 [API] Issue details:`, { title, description, priority, booking_id })

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { 
          success: false,
          error: "Title and description are required" 
        },
        { status: 400 }
      )
    }

    // Validate priority
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid priority level" 
        },
        { status: 400 }
      )
    }

    // Create the issue
    const { data: issue, error } = await supabase
      .from('room_issues')
      .insert({
        room_id: id,
        booking_id: booking_id || null,
        reported_by_user_id: reported_by_user_id || null,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'open'
      })
      .select(`
        *,
        room:room_id(id, name, location),
        booking:booking_id(id, title, start_time, end_time),
        reported_by:reported_by_user_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error(`❌ [API] Error creating room issue:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to create room issue" 
        },
        { status: 500 }
      )
    }

    console.log(`✅ [API] Successfully created issue ${issue.id} for room ${id}`)

    // TODO: Send notification to facility managers
    // This could be implemented later to notify relevant staff

    return NextResponse.json({
      success: true,
      issue,
      message: "Issue reported successfully"
    }, { status: 201 })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error creating issue for room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to create room issue" 
      },
      { status: 500 }
    )
  }
}
