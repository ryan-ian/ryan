import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const date = url.searchParams.get('date') // Expected format: YYYY-MM-DD
    const status = url.searchParams.get('status')

    console.log(`🔍 [API] GET /api/rooms/${id}/bookings - Fetching room bookings`)

    // Use today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Check for conditional request headers
    const ifNoneMatch = request.headers.get('if-none-match')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        users:user_id (id, name, email)
      `)
      .eq('room_id', id)
      .gte('start_time', `${targetDate}T00:00:00.000Z`)
      .lte('end_time', `${targetDate}T23:59:59.999Z`)
      .order('start_time', { ascending: true })

    // Filter by status if provided
    if (status) {
      const statusArray = status.split(',')
      query = query.in('status', statusArray)
    } else {
      // Default to confirmed and pending bookings
      query = query.in('status', ['confirmed', 'pending'])
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error(`❌ [API] Error fetching room bookings:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to fetch room bookings" 
        },
        { status: 500 }
      )
    }

    // Generate ETag based on bookings data
    const bookingsHash = JSON.stringify(bookings?.map(b => ({
      id: b.id,
      status: b.status,
      checked_in_at: b.checked_in_at,
      updated_at: b.updated_at
    })) || [])
    
    const etag = `"bookings-${id}-${targetDate}-${Buffer.from(bookingsHash).toString('base64').slice(0, 16)}"`

    // If client has a matching ETag, return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      console.log(`📡 [API] No changes detected for room ${id} bookings (ETag match)`)
      return new NextResponse(null, { status: 304 })
    }

    console.log(`📋 [API] Found ${bookings?.length || 0} bookings for room ${id} on ${targetDate}`)

    // Return bookings data with cache headers
    const response = NextResponse.json({
      success: true,
      bookings: bookings || [],
      date: targetDate,
      count: bookings?.length || 0
    })

    // Add cache headers
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'public, max-age=30, must-revalidate')
    
    return response
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error fetching bookings for room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room bookings" 
      },
      { status: 500 }
    )
  }
}
