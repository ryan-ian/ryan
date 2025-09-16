import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkInvitationCapacity } from "@/lib/meeting-invitations"
import { getBookingById } from "@/lib/supabase-data"

// GET - Check invitation capacity for a booking
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get("bookingId")
    const newInviteeCount = parseInt(searchParams.get("newInviteeCount") || "0")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Verify user has access to this booking
    const booking = await getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user owns the booking or is admin
    if (booking.user_id !== user.id && user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const capacityCheck = await checkInvitationCapacity(bookingId, newInviteeCount)
    return NextResponse.json(capacityCheck)

  } catch (error) {
    console.error("Error checking invitation capacity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
