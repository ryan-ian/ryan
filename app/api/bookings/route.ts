import { type NextRequest, NextResponse } from "next/server"
import { bookings, rooms } from "@/lib/data"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Admin can see all bookings, users can only see their own
    const userBookings = user.role === "admin" ? bookings : bookings.filter((booking) => booking.userId === user.id)

    return NextResponse.json(userBookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const bookingData = await request.json()

    // Check if room exists and is available
    const room = rooms.find((r) => r.id === bookingData.roomId)
    if (!room || room.status !== "available") {
      return NextResponse.json({ error: "Room not available" }, { status: 400 })
    }

    // Check for conflicts
    const startTime = new Date(bookingData.startTime)
    const endTime = new Date(bookingData.endTime)

    const conflicts = bookings.filter((booking) => {
      if (booking.roomId !== bookingData.roomId || booking.status === "cancelled") {
        return false
      }

      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)

      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      )
    })

    if (conflicts.length > 0) {
      return NextResponse.json({ error: "Room is already booked for this time slot" }, { status: 409 })
    }

    const newBooking = {
      id: (bookings.length + 1).toString(),
      ...bookingData,
      userId: user.id,
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    bookings.push(newBooking)

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
