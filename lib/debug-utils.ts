import { supabase } from './supabase'
import { getAllBookingsByFacilityManager, getFacilitiesByManager } from './supabase-data'

/**
 * Debug utility to verify booking data flow with detailed database inspection
 */
export async function debugBookingDataFlow(userId: string) {
  console.log(`🔍 [Debug] Starting comprehensive booking data flow verification for user: ${userId}`)

  try {
    // Step 0: Verify user exists and has correct role
    console.log(`🔍 [Debug] Step 0: Verifying user details...`)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error(`❌ [Debug] User not found:`, userError)
      return { success: false, error: 'User not found in database' }
    }

    console.log(`🔍 [Debug] User details:`, userData)

    // Step 1: Check if user manages any facilities
    console.log(`🔍 [Debug] Step 1: Checking managed facilities...`)

    // Direct database query to check facilities
    const { data: facilitiesRaw, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, location, manager_id')
      .eq('manager_id', userId)

    console.log(`🔍 [Debug] Raw facilities query result:`, { facilitiesRaw, facilitiesError })

    // Also try the hook function
    const facilities = await getFacilitiesByManager(userId)
    console.log(`🔍 [Debug] Hook facilities result:`, facilities)
    
    if (facilities.length === 0) {
      console.log(`❌ [Debug] No facilities found for user ${userId}`)
      console.log(`🔍 [Debug] Checking if user has admin role instead...`)

      // Check if user is admin (admins might access all facilities)
      if (userData.role === 'admin') {
        console.log(`🔍 [Debug] User is admin, checking all facilities...`)
        const { data: allFacilities, error: allFacilitiesError } = await supabase
          .from('facilities')
          .select('id, name, location, manager_id')

        console.log(`🔍 [Debug] All facilities for admin:`, { allFacilities, allFacilitiesError })

        if (allFacilities && allFacilities.length > 0) {
          // Use first facility for admin
          const facility = allFacilities[0]
          console.log(`🔍 [Debug] Using first facility for admin: ${facility.name}`)
        } else {
          return {
            success: false,
            error: 'No facilities found in the system',
            data: { facilities: [], rooms: [], bookings: [] }
          }
        }
      } else {
        return {
          success: false,
          error: 'No facilities managed by this user',
          data: { facilities: [], rooms: [], bookings: [] }
        }
      }
    }
    
    // Step 2: Get room IDs for the facility
    console.log(`🔍 [Debug] Step 2: Getting rooms for facility...`)
    const facilityId = facilities[0].id
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, facility_id')
      .eq('facility_id', facilityId)
    
    if (roomsError) {
      console.error(`❌ [Debug] Error fetching rooms:`, roomsError)
      return {
        success: false,
        error: `Failed to fetch rooms: ${roomsError.message}`,
        data: { facilities, rooms: [], bookings: [] }
      }
    }
    
    console.log(`🔍 [Debug] Found ${rooms?.length || 0} rooms:`, rooms)
    const roomIds = rooms?.map(r => r.id) || []
    
    // Step 3: Get all bookings for these rooms (raw query)
    console.log(`🔍 [Debug] Step 3: Getting all bookings for rooms...`)
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        status,
        start_time,
        end_time,
        created_at,
        updated_at,
        room_id,
        user_id,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      .in('room_id', roomIds)
      .order('updated_at', { ascending: false })
    
    if (bookingsError) {
      console.error(`❌ [Debug] Error fetching bookings:`, bookingsError)
      return {
        success: false,
        error: `Failed to fetch bookings: ${bookingsError.message}`,
        data: { facilities, rooms, bookings: [] }
      }
    }
    
    console.log(`🔍 [Debug] Found ${allBookings?.length || 0} total bookings`)
    
    // Step 4: Analyze booking statuses
    const statusCounts = (allBookings || []).reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`🔍 [Debug] Booking status breakdown:`, statusCounts)
    
    // Step 5: Check recent updates (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentBookings = (allBookings || []).filter(b => 
      new Date(b.updated_at) > yesterday
    )
    
    console.log(`🔍 [Debug] Recent bookings (last 24h): ${recentBookings.length}`)
    recentBookings.forEach(booking => {
      console.log(`🔍 [Debug] Recent: "${booking.title}" - ${booking.status} - Updated: ${booking.updated_at}`)
    })
    
    // Step 6: Compare with hook function
    console.log(`🔍 [Debug] Step 6: Comparing with getAllBookingsByFacilityManager...`)
    const hookBookings = await getAllBookingsByFacilityManager(userId)
    console.log(`🔍 [Debug] Hook returned ${hookBookings.length} bookings`)
    
    // Check for discrepancies
    const hookIds = new Set(hookBookings.map(b => b.id))
    const rawIds = new Set((allBookings || []).map(b => b.id))
    
    const missingInHook = (allBookings || []).filter(b => !hookIds.has(b.id))
    const extraInHook = hookBookings.filter(b => !rawIds.has(b.id))
    
    if (missingInHook.length > 0) {
      console.log(`⚠️ [Debug] Bookings missing in hook result:`, missingInHook)
    }
    
    if (extraInHook.length > 0) {
      console.log(`⚠️ [Debug] Extra bookings in hook result:`, extraInHook)
    }
    
    return {
      success: true,
      data: {
        facilities,
        rooms: rooms || [],
        bookings: allBookings || [],
        statusCounts,
        recentBookings,
        hookBookings,
        discrepancies: {
          missingInHook,
          extraInHook
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ [Debug] Exception in debugBookingDataFlow:`, error)
    return {
      success: false,
      error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { facilities: [], rooms: [], bookings: [] }
    }
  }
}

/**
 * Debug utility to check specific booking status
 */
export async function debugBookingStatus(bookingId: string) {
  console.log(`🔍 [Debug] Checking status of booking: ${bookingId}`)
  
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        status,
        start_time,
        end_time,
        created_at,
        updated_at,
        room_id,
        user_id,
        rooms:room_id(id, name, facility_id),
        users:user_id(id, name, email)
      `)
      .eq('id', bookingId)
      .single()
    
    if (error) {
      console.error(`❌ [Debug] Error fetching booking:`, error)
      return { success: false, error: error.message }
    }
    
    console.log(`🔍 [Debug] Booking details:`, booking)
    
    // Check facility manager
    if (booking.rooms && 'facility_id' in booking.rooms) {
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name, manager_id')
        .eq('id', (booking.rooms as any).facility_id)
        .single()
      
      if (facilityError) {
        console.error(`❌ [Debug] Error fetching facility:`, facilityError)
      } else {
        console.log(`🔍 [Debug] Facility details:`, facility)
      }
    }
    
    return { success: true, data: booking }
    
  } catch (error) {
    console.error(`❌ [Debug] Exception in debugBookingStatus:`, error)
    return {
      success: false,
      error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Debug utility to simulate booking approval
 */
export async function debugBookingApproval(bookingId: string, newStatus: 'confirmed' | 'cancelled') {
  console.log(`🔍 [Debug] Simulating booking approval: ${bookingId} -> ${newStatus}`)
  
  try {
    // First check current status
    const currentStatus = await debugBookingStatus(bookingId)
    if (!currentStatus.success) {
      return currentStatus
    }
    
    console.log(`🔍 [Debug] Current status: ${currentStatus.data?.status}`)
    
    // Update the booking
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()
    
    if (error) {
      console.error(`❌ [Debug] Error updating booking:`, error)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ [Debug] Booking updated successfully:`, updatedBooking)
    
    // Verify the update
    const verifyStatus = await debugBookingStatus(bookingId)
    console.log(`🔍 [Debug] Verification - new status: ${verifyStatus.data?.status}`)
    
    return { success: true, data: updatedBooking }
    
  } catch (error) {
    console.error(`❌ [Debug] Exception in debugBookingApproval:`, error)
    return {
      success: false,
      error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}


