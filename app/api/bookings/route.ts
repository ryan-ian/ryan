import { type NextRequest, NextResponse } from "next/server"
import { getBookings, getBookingsByUserId, createBooking, getRoomById, checkBookingConflicts, getBookingsWithDetails, getUserById } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"
import { createPendingApprovalNotificationsForAdmins, createNotification, createFacilityManagerBookingNotification } from "@/lib/notifications"
import { sendBookingRequestSubmittedEmail } from "@/lib/email-service"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const searchParams = request.nextUrl.searchParams
    
    // Extract query parameters
    const roomId = searchParams.get("roomId")
    const startTime = searchParams.get("start")
    const endTime = searchParams.get("end")
    const date = searchParams.get("date")
    
    // For room-specific booking queries with date only (for calendar view)
    if (roomId && date) {
      // Get bookings for a specific room on a specific date
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .in('status', ['confirmed', 'pending'])
      
      if (error) {
        console.error('Error fetching room bookings for date:', error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // For room-specific booking queries with time range
    if (roomId && startTime && endTime) {
      // Get bookings for a specific room within a time range
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startTime)
        .lte('end_time', endTime)
        .in('status', ['confirmed', 'pending'])
      
      if (error) {
        console.error('Error fetching room bookings:', error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // For room-specific booking queries with user details
    if (roomId) {
      const includeUsers = searchParams.get("includeUsers") === "true"
      
      let query = supabase.from('bookings').select(
        includeUsers 
          ? `*, users:user_id(id, name, email)` 
          : '*'
      )
      .eq('room_id', roomId)
      .order('start_time', { ascending: true })
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching room bookings with user details:', error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // For all other booking queries, require authentication
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid
    
    // Get all bookings with user and room details
    const bookings = await getBookingsWithDetails()
    
    return NextResponse.json(bookings)
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

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid

    const bookingData = await request.json()
    console.log("Received booking data:", bookingData)
    
    // Check if room exists and is available
    const room = await getRoomById(bookingData.room_id)
    if (!room || room.status !== "available") {
      return NextResponse.json({ error: "Room not available" }, { status: 400 })
    }

    // Handle multiple bookings
    if (bookingData.bookings && Array.isArray(bookingData.bookings)) {
      return await createMultipleBookings(bookingData, room)
    } else {
      // Handle single booking (legacy support)
      return await createSingleBooking(bookingData, room)
    }
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to create a single booking
async function createSingleBooking(bookingData: any, room: any) {
  try {
    // Check for conflicts
    const start_time = bookingData.start_time
    const end_time = bookingData.end_time
    
    const hasConflict = await checkBookingConflicts(bookingData.room_id, start_time, end_time)
    if (hasConflict) {
      return NextResponse.json({ error: "Room is already booked for this time slot" }, { status: 409 })
    }

    // Check if user already has a booking on the same day
    const bookingDate = new Date(start_time).toISOString().split('T')[0]
    const startOfDay = `${bookingDate}T00:00:00.000Z`
    const endOfDay = `${bookingDate}T23:59:59.999Z`
    
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', bookingData.user_id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .in('status', ['confirmed', 'pending'])
    
    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError)
      return NextResponse.json({ error: "Failed to check existing bookings" }, { status: 500 })
    }
    
    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json({ error: "You can only book one room per day" }, { status: 400 })
    }

    // Create the booking - ALWAYS set to pending regardless of what was provided
    const newBooking = await createBooking({
      room_id: bookingData.room_id,
      user_id: bookingData.user_id,
      title: bookingData.title,
      description: bookingData.description || null,
      start_time: start_time,
      end_time: end_time,
      attendees: Array.isArray(bookingData.attendees) ? bookingData.attendees : bookingData.attendees ? [Number(bookingData.attendees)] : [],
      status: "pending", // Always set to pending regardless of input
      resources: bookingData.resources || null
    })
    
    // Send email notification to user about booking request submission
    try {
      const user = await getUserById(bookingData.user_id)
      if (user && user.email && user.name) {
        console.log(`📧 Sending booking request submitted email to ${user.email}`)
        await sendBookingRequestSubmittedEmail(
          user.email,
          user.name,
          bookingData.title,
          room.name,
          start_time,
          end_time
        )
        console.log(`✅ Booking request submitted email sent successfully to ${user.email}`)
      } else {
        console.warn(`⚠️ Could not send email - user not found or missing email/name: ${bookingData.user_id}`)
      }
    } catch (emailError) {
      console.error("❌ Failed to send booking request submitted email:", emailError)
      // Don't fail the booking creation if email fails
    }
    
    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error("Error in createSingleBooking:", error)
    throw error
  }
}

// Helper function to create multiple bookings
async function createMultipleBookings(bookingData: any, room: any) {
  try {
    // Validate number of bookings
    if (!bookingData.bookings || !Array.isArray(bookingData.bookings) || bookingData.bookings.length === 0) {
      return NextResponse.json({ error: "No booking dates provided" }, { status: 400 })
    }

    if (bookingData.bookings.length > 5) {
      return NextResponse.json({ error: "Maximum 5 bookings allowed per request" }, { status: 400 })
    }

    const createdBookings = []
    const failedBookings = []
    const user = await getUserById(bookingData.user_id)
    
    // Get facility details to find the manager
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*, manager:manager_id(id, name, email)')
      .eq('id', room.facility_id)
      .single();
      
    if (facilityError || !facility || !facility.manager || !facility.manager.id) {
      console.error('Error fetching facility or manager:', facilityError || 'No facility manager found')
    }

    // Process each booking
    for (const booking of bookingData.bookings) {
      const bookingDate = format(new Date(booking.date), 'yyyy-MM-dd')
      const start_time = `${bookingDate}T${booking.startTime}:00`
      const end_time = `${bookingDate}T${booking.endTime}:00`

      // Check for conflicts
      const hasConflict = await checkBookingConflicts(bookingData.room_id, start_time, end_time)
      if (hasConflict) {
        failedBookings.push({
          date: bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reason: "Time slot already booked"
        })
        continue
      }

      // Check if user already has a booking on the same day
      const startOfDay = `${bookingDate}T00:00:00.000Z`
      const endOfDay = `${bookingDate}T23:59:59.999Z`
      
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', bookingData.user_id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['confirmed', 'pending'])
      
      if (bookingsError) {
        console.error('Error checking existing bookings:', bookingsError)
        failedBookings.push({
          date: bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reason: "Failed to check existing bookings"
        })
        continue
      }
      
      if (existingBookings && existingBookings.length > 0) {
        failedBookings.push({
          date: bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reason: "You already have a booking on this day"
        })
        continue
      }

      // Create the booking
      try {
        const newBooking = await createBooking({
          room_id: bookingData.room_id,
          user_id: bookingData.user_id,
          title: bookingData.title,
          description: bookingData.description || null,
          start_time: start_time,
          end_time: end_time,
          attendees: [room.capacity], // Set attendees to room capacity
          status: "pending", // Always pending, regardless of input
          resources: bookingData.resources || null
        })
        
        createdBookings.push(newBooking)
        
        // Send email notification to user about booking request submission
        if (user && user.email && user.name) {
          try {
            console.log(`📧 Sending booking request submitted email to ${user.email} for booking on ${bookingDate}`)
            await sendBookingRequestSubmittedEmail(
              user.email,
              user.name,
              bookingData.title,
              room.name,
              start_time,
              end_time
            )
            console.log(`✅ Booking request submitted email sent successfully to ${user.email} for booking on ${bookingDate}`)
          } catch (emailError) {
            console.error(`❌ Failed to send booking request submitted email for booking on ${bookingDate}:`, emailError)
            // Don't fail the booking creation if email fails
          }
        } else {
          console.warn(`⚠️ Could not send email for booking on ${bookingDate} - user not found or missing email/name: ${bookingData.user_id}`)
        }
        
        // Send notification to facility manager
        if (user && room && facility && facility.manager && facility.manager.id) {
          try {
            await createFacilityManagerBookingNotification(
              facility.manager.id,
              newBooking.id,
              user.name,
              bookingData.title,
              room.name,
              start_time,
              end_time
            )
            console.log(`Notification sent to facility manager ${facility.manager.name} for booking on ${bookingDate}`)
          } catch (notificationError) {
            console.error("Failed to send facility manager notification:", notificationError)
          }
        }
      } catch (error) {
        console.error("Error creating booking:", error)
        failedBookings.push({
          date: bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reason: "Failed to create booking"
        })
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      created: createdBookings.length,
      failed: failedBookings.length,
      bookings: createdBookings,
      failures: failedBookings
    }, { status: 201 })
  } catch (error) {
    console.error("Error in createMultipleBookings:", error)
    throw error
  }
}
