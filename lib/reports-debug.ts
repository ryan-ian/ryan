import { supabase } from './supabase'

/**
 * Comprehensive debugging for reports data flow
 */
export async function debugReportsDataFlow(userId: string) {
  console.log(`🔍 [Reports Debug] Starting comprehensive debug for user: ${userId}`)
  
  try {
    // Step 1: Check user details
    console.log(`🔍 [Reports Debug] Step 1: Checking user...`)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error(`❌ [Reports Debug] User error:`, userError)
      return { success: false, error: 'User not found' }
    }
    
    console.log(`✅ [Reports Debug] User found:`, user)
    
    // Step 2: Check facilities
    console.log(`🔍 [Reports Debug] Step 2: Checking facilities...`)
    let facilityQuery = supabase.from('facilities').select('id, name, location, manager_id')
    
    if (user.role === 'admin') {
      console.log(`🔍 [Reports Debug] User is admin, getting all facilities`)
    } else {
      console.log(`🔍 [Reports Debug] User is facility manager, filtering by manager_id`)
      facilityQuery = facilityQuery.eq('manager_id', userId)
    }
    
    const { data: facilities, error: facilitiesError } = await facilityQuery
    
    if (facilitiesError) {
      console.error(`❌ [Reports Debug] Facilities error:`, facilitiesError)
      return { success: false, error: 'Failed to fetch facilities' }
    }
    
    console.log(`✅ [Reports Debug] Found ${facilities?.length || 0} facilities:`, facilities)
    
    if (!facilities || facilities.length === 0) {
      return { success: false, error: 'No facilities found' }
    }
    
    const facility = facilities[0]
    console.log(`🔍 [Reports Debug] Using facility: ${facility.name} (${facility.id})`)
    
    // Step 3: Check rooms in this facility
    console.log(`🔍 [Reports Debug] Step 3: Checking rooms...`)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, facility_id, status')
      .eq('facility_id', facility.id)
    
    if (roomsError) {
      console.error(`❌ [Reports Debug] Rooms error:`, roomsError)
      return { success: false, error: 'Failed to fetch rooms' }
    }
    
    console.log(`✅ [Reports Debug] Found ${rooms?.length || 0} rooms:`, rooms)
    
    if (!rooms || rooms.length === 0) {
      return { success: false, error: 'No rooms found in facility' }
    }
    
    const roomIds = rooms.map(r => r.id)
    console.log(`🔍 [Reports Debug] Room IDs:`, roomIds)
    
    // Step 4: Check ALL bookings for these rooms
    console.log(`🔍 [Reports Debug] Step 4: Checking ALL bookings...`)
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
        rooms:room_id(id, name, facility_id),
        users:user_id(id, name, email)
      `)
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })
    
    if (bookingsError) {
      console.error(`❌ [Reports Debug] Bookings error:`, bookingsError)
      return { success: false, error: 'Failed to fetch bookings' }
    }
    
    console.log(`✅ [Reports Debug] Found ${allBookings?.length || 0} total bookings`)
    
    // Step 5: Analyze booking statuses
    const statusBreakdown = (allBookings || []).reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`📊 [Reports Debug] Status breakdown:`, statusBreakdown)
    
    // Step 6: Check confirmed bookings specifically
    const confirmedBookings = (allBookings || []).filter(b => b.status === 'confirmed')
    console.log(`✅ [Reports Debug] Confirmed bookings: ${confirmedBookings.length}`)
    
    if (confirmedBookings.length > 0) {
      console.log(`📋 [Reports Debug] Sample confirmed bookings:`)
      confirmedBookings.slice(0, 3).forEach((booking, index) => {
        console.log(`  ${index + 1}. "${booking.title}" - ${booking.start_time} - Room: ${booking.rooms?.name}`)
      })
    }
    
    // Step 7: Check recent bookings (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentConfirmed = confirmedBookings.filter(b => 
      new Date(b.start_time) >= thirtyDaysAgo
    )
    
    console.log(`📅 [Reports Debug] Recent confirmed bookings (last 30 days): ${recentConfirmed.length}`)
    
    // Step 8: Test the hook function
    console.log(`🔍 [Reports Debug] Step 8: Testing hook function...`)
    try {
      const { getAllBookingsByFacilityManager } = await import('./supabase-data')
      const hookBookings = await getAllBookingsByFacilityManager(userId)
      console.log(`🔧 [Reports Debug] Hook returned ${hookBookings.length} bookings`)
      
      const hookConfirmed = hookBookings.filter(b => b.status === 'confirmed')
      console.log(`🔧 [Reports Debug] Hook confirmed bookings: ${hookConfirmed.length}`)
      
      // Compare results
      if (hookConfirmed.length !== confirmedBookings.length) {
        console.warn(`⚠️ [Reports Debug] Mismatch! Direct query: ${confirmedBookings.length}, Hook: ${hookConfirmed.length}`)
      }
    } catch (hookError) {
      console.error(`❌ [Reports Debug] Hook error:`, hookError)
    }
    
    return {
      success: true,
      data: {
        user,
        facility,
        rooms,
        totalBookings: allBookings?.length || 0,
        statusBreakdown,
        confirmedBookings: confirmedBookings.length,
        recentConfirmed: recentConfirmed.length,
        sampleBookings: allBookings?.slice(0, 5) || []
      }
    }
    
  } catch (error) {
    console.error(`❌ [Reports Debug] Exception:`, error)
    return {
      success: false,
      error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Quick test to verify a specific booking exists and its status
 */
export async function quickBookingTest() {
  console.log(`🔍 [Quick Test] Checking for any confirmed bookings in the system...`)
  
  try {
    const { data: confirmedBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        status,
        start_time,
        rooms:room_id(name, facility_id),
        users:user_id(name, email)
      `)
      .eq('status', 'confirmed')
      .limit(10)
    
    if (error) {
      console.error(`❌ [Quick Test] Error:`, error)
      return
    }
    
    console.log(`✅ [Quick Test] Found ${confirmedBookings?.length || 0} confirmed bookings system-wide`)
    
    if (confirmedBookings && confirmedBookings.length > 0) {
      console.log(`📋 [Quick Test] Sample confirmed bookings:`)
      confirmedBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. "${booking.title}" - ${booking.start_time} - Room: ${booking.rooms?.name}`)
      })
    } else {
      console.log(`⚠️ [Quick Test] No confirmed bookings found in the entire system!`)
      
      // Check for any bookings at all
      const { data: anyBookings } = await supabase
        .from('bookings')
        .select('id, title, status')
        .limit(5)
      
      console.log(`🔍 [Quick Test] Any bookings at all:`, anyBookings)
    }
    
  } catch (error) {
    console.error(`❌ [Quick Test] Exception:`, error)
  }
}

/**
 * Test the reports hook directly
 */
export async function testReportsHook(userId: string) {
  console.log(`🔍 [Hook Test] Testing useFacilityManagerReports hook logic...`)
  
  try {
    // Import the hook functions
    const { 
      getFacilitiesByManager, 
      getRoomsByFacilityManager, 
      getAllBookingsByFacilityManager 
    } = await import('./supabase-data')
    
    console.log(`🔍 [Hook Test] Step 1: getFacilitiesByManager...`)
    const facilities = await getFacilitiesByManager(userId)
    console.log(`✅ [Hook Test] Facilities:`, facilities)
    
    console.log(`🔍 [Hook Test] Step 2: getRoomsByFacilityManager...`)
    const rooms = await getRoomsByFacilityManager(userId)
    console.log(`✅ [Hook Test] Rooms:`, rooms)
    
    console.log(`🔍 [Hook Test] Step 3: getAllBookingsByFacilityManager...`)
    const bookings = await getAllBookingsByFacilityManager(userId)
    console.log(`✅ [Hook Test] Bookings:`, bookings)
    
    const confirmed = bookings.filter(b => b.status === 'confirmed')
    console.log(`📊 [Hook Test] Confirmed bookings: ${confirmed.length}`)
    
    return {
      facilities: facilities.length,
      rooms: rooms.length,
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length
    }
    
  } catch (error) {
    console.error(`❌ [Hook Test] Error:`, error)
    return null
  }
}
