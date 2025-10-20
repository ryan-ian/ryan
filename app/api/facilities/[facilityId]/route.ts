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

    // Get facility details with manager relationship
    const { data: facility, error: facilityError } = await adminClient
      .from('facilities')
      .select(`
        *,
        facility_manager:manager_id(id, name, email, role, position, organization, last_login)
      `)
      .eq('id', facilityId)
      .single()

    if (facilityError) {
      if (facilityError.code === 'PGRST116') {
        return NextResponse.json({ error: "Facility not found" }, { status: 404 })
      }
      console.error('Error fetching facility:', facilityError)
      return NextResponse.json({ error: facilityError.message }, { status: 400 })
    }

    // Get rooms for this facility
    const { data: rooms, error: roomsError } = await adminClient
      .from('rooms')
      .select(`
        *,
        facilities!facility_id(id, name, location)
      `)
      .eq('facility_id', facilityId)

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      // Don't fail the whole request if rooms can't be fetched
    }

    // Get facility stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get booking count for the last 30 days
    const { count: bookingCount, error: bookingError } = await adminClient
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('room_id', (rooms || []).map(r => r.id))
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get total room count
    const roomCount = rooms?.length || 0

    // Calculate utilization (simplified - could be more sophisticated)
    const utilization = roomCount > 0 ? Math.min(((bookingCount || 0) / (roomCount * 30)) * 100, 100) : 0

    const stats = {
      totalRooms: roomCount,
      totalBookings: bookingCount || 0,
      utilization: Math.round(utilization),
      activeRooms: rooms?.filter(r => r.status === 'active').length || 0
    }

    // Get recent activity (last 10 bookings)
    const { data: recentBookings, error: recentError } = await adminClient
      .from('bookings')
      .select(`
        *,
        users:user_id(id, name, email),
        rooms:room_id(id, name)
      `)
      .in('room_id', (rooms || []).map(r => r.id))
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActivity = (recentBookings || []).map(booking => ({
      id: booking.id,
      type: 'booking_created' as const,
      title: 'New Booking Created',
      description: `${booking.title} - ${booking.rooms?.name || 'Unknown Room'}`,
      timestamp: booking.created_at,
      user: booking.users?.name || 'Unknown User'
    }))

    // Normalize rooms data
    const normalizedRooms = (rooms || []).map(room => ({
      ...room,
      facility: room.facilities ? {
        id: room.facilities.id,
        name: room.facilities.name,
        location: room.facilities.location
      } : null,
      facilities: undefined
    }))

    return NextResponse.json({
      facility,
      rooms: normalizedRooms,
      stats,
      recentActivity
    })

  } catch (error) {
    console.error("Get facility details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
