import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const { facilityId } = await params
    
    if (!facilityId) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get rooms for this facility first
    const { data: rooms, error: roomsError } = await adminClient
      .from('rooms')
      .select('id')
      .eq('facility_id', facilityId)

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return NextResponse.json({ error: roomsError.message }, { status: 400 })
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ trends: [] })
    }

    const roomIds = rooms.map(r => r.id)

    // Get booking trends for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: bookings, error: bookingsError } = await adminClient
      .from('bookings')
      .select('created_at, start_time')
      .in('room_id', roomIds)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: bookingsError.message }, { status: 400 })
    }

    // Group bookings by date
    const bookingsByDate = new Map<string, number>()
    
    // Initialize all dates in the last 30 days with 0 bookings
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      bookingsByDate.set(dateStr, 0)
    }

    // Count actual bookings by date
    (bookings || []).forEach(booking => {
      const date = new Date(booking.created_at).toISOString().split('T')[0]
      const currentCount = bookingsByDate.get(date) || 0
      bookingsByDate.set(date, currentCount + 1)
    })

    // Convert to array format for the chart
    const trends = Array.from(bookingsByDate.entries()).map(([date, count]) => {
      const dateObj = new Date(date)
      return {
        date,
        bookings: count,
        name: dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    })

    return NextResponse.json({ trends })

  } catch (error) {
    console.error("Get booking trends error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
