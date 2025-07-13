import { type NextRequest, NextResponse } from "next/server"
import { getUserBookingsWithDetails } from "@/lib/supabase-data"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: In a real app, we would extract the user_id from the token
    // For simplicity, we're using a hardcoded user_id
    // In production, you would decode the JWT token and get the user_id from it
    const user_id = request.nextUrl.searchParams.get("user_id") || "user_1"
    
    // Get bookings for the specified user with room and user details
    const bookings = await getUserBookingsWithDetails(user_id)
    
    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get user bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 