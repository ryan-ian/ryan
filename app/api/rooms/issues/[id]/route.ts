import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, resolution_notes, resolved_by_user_id } = body

    console.log(`🚀 [API] PATCH /api/rooms/issues/${id} - Updating issue status`)
    console.log(`📝 [API] Update details:`, { status, resolution_notes })

    // Validate status
    if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid status value" 
        },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      
      // If resolving or closing, set resolved_at and resolved_by
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
        if (resolved_by_user_id) {
          updateData.resolved_by_user_id = resolved_by_user_id
        }
      } else {
        // If reopening, clear resolved fields
        updateData.resolved_at = null
        updateData.resolved_by_user_id = null
      }
    }

    if (resolution_notes !== undefined) {
      updateData.resolution_notes = resolution_notes
    }

    // Update the issue
    const { data: issue, error } = await supabase
      .from('room_issues')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        room:room_id(id, name, location),
        booking:booking_id(id, title, start_time, end_time),
        reported_by:reported_by_user_id(id, name, email),
        resolved_by:resolved_by_user_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error(`❌ [API] Error updating room issue:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to update room issue" 
        },
        { status: 500 }
      )
    }

    if (!issue) {
      return NextResponse.json(
        { 
          success: false,
          error: "Issue not found" 
        },
        { status: 404 }
      )
    }

    console.log(`✅ [API] Successfully updated issue ${id}`)

    return NextResponse.json({
      success: true,
      issue,
      message: "Issue updated successfully"
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error updating issue ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update room issue" 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🔍 [API] GET /api/rooms/issues/${id} - Fetching issue details`)

    const { data: issue, error } = await supabase
      .from('room_issues')
      .select(`
        *,
        room:room_id(id, name, location),
        booking:booking_id(id, title, start_time, end_time),
        reported_by:reported_by_user_id(id, name, email),
        resolved_by:resolved_by_user_id(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error(`❌ [API] Error fetching room issue:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to fetch room issue" 
        },
        { status: 500 }
      )
    }

    if (!issue) {
      return NextResponse.json(
        { 
          success: false,
          error: "Issue not found" 
        },
        { status: 404 }
      )
    }

    console.log(`📋 [API] Found issue ${id}`)

    return NextResponse.json({
      success: true,
      issue
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error fetching issue ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room issue" 
      },
      { status: 500 }
    )
  }
}
