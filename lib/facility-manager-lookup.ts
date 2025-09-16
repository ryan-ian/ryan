import { supabase } from './supabase'

/**
 * Get facility manager's information for a given room ID
 * Follows the chain: bookings.room_id → rooms.facility_id → facilities.manager_id → users.email
 */
export async function getFacilityManagerByRoomId(roomId: string): Promise<{ id: string; email: string; name: string; facilityName: string } | null> {
  try {
    console.log(`🔍 [FACILITY MANAGER LOOKUP] Starting lookup for room ${roomId}`)
    
    // Step 1: Get room with facility information
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, facility_id')
      .eq('id', roomId)
      .single()
    
    if (roomError || !room) {
      console.error(`❌ [FACILITY MANAGER LOOKUP] Room not found: ${roomId}`, roomError)
      return null
    }
    
    console.log(`✅ [FACILITY MANAGER LOOKUP] Room found: ${room.name}, facility_id: ${room.facility_id}`)
    
    if (!room.facility_id) {
      console.warn(`⚠️ [FACILITY MANAGER LOOKUP] Room ${roomId} has no facility_id`)
      return null
    }
    
    // Step 2: Get facility with manager information
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, manager_id')
      .eq('id', room.facility_id)
      .single()
    
    if (facilityError || !facility) {
      console.error(`❌ [FACILITY MANAGER LOOKUP] Facility not found: ${room.facility_id}`, facilityError)
      return null
    }
    
    console.log(`✅ [FACILITY MANAGER LOOKUP] Facility found: ${facility.name}, manager_id: ${facility.manager_id}`)
    
    if (!facility.manager_id) {
      console.warn(`⚠️ [FACILITY MANAGER LOOKUP] Facility ${facility.id} has no manager_id`)
      return null
    }
    
    // Step 3: Get manager user information
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', facility.manager_id)
      .single()
    
    if (managerError || !manager) {
      console.error(`❌ [FACILITY MANAGER LOOKUP] Manager user not found: ${facility.manager_id}`, managerError)
      return null
    }
    
    console.log(`✅ [FACILITY MANAGER LOOKUP] Manager found: ${manager.name} (${manager.email})`)
    
    if (!manager.email || !manager.name) {
      console.warn(`⚠️ [FACILITY MANAGER LOOKUP] Manager ${manager.id} missing email or name`)
      return null
    }
    
    const result = {
      id: manager.id,
      email: manager.email,
      name: manager.name,
      facilityName: facility.name
    }
    
    console.log(`✅ [FACILITY MANAGER LOOKUP] Successfully resolved facility manager for room ${roomId}:`, result)
    return result
    
  } catch (error) {
    console.error(`❌ [FACILITY MANAGER LOOKUP] Exception in getFacilityManagerByRoomId for room ${roomId}:`, error)
    return null
  }
}
