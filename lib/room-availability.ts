import { supabase } from './supabase'
import * as types from '@/types'

// Room Availability Management Functions

/**
 * Get room availability settings by room ID
 */
export async function getRoomAvailability(roomId: string): Promise<types.RoomAvailability | null> {
  try {
    const { data, error } = await supabase
      .from('room_availability')
      .select('*')
      .eq('room_id', roomId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No availability record found, create default
        return await createDefaultRoomAvailability(roomId)
      }
      console.error(`Error fetching room availability for ${roomId}:`, error)
      throw error
    }
    
    return data as types.RoomAvailability
  } catch (error) {
    console.error('Exception in getRoomAvailability:', error)
    throw error
  }
}

/**
 * Create default availability settings for a room
 */
export async function createDefaultRoomAvailability(roomId: string): Promise<types.RoomAvailability> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const defaultAvailability = {
      room_id: roomId,
      operating_hours: {
        monday: { enabled: true, start: '08:00', end: '18:00' },
        tuesday: { enabled: true, start: '08:00', end: '18:00' },
        wednesday: { enabled: true, start: '08:00', end: '18:00' },
        thursday: { enabled: true, start: '08:00', end: '18:00' },
        friday: { enabled: true, start: '08:00', end: '18:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' }
      },
      min_booking_duration: 30,
      max_booking_duration: 480,
      buffer_time: 15,
      advance_booking_days: 30,
      same_day_booking_enabled: true,
      max_bookings_per_user_per_day: 1,
      max_bookings_per_user_per_week: 5,
      created_by: user?.id
    }

    const { data, error } = await supabase
      .from('room_availability')
      .insert(defaultAvailability)
      .select()
      .single()

    if (error) {
      console.error('Error creating default room availability:', error)
      throw error
    }

    return data as types.RoomAvailability
  } catch (error) {
    console.error('Exception in createDefaultRoomAvailability:', error)
    throw error
  }
}

/**
 * Update room availability settings
 */
export async function updateRoomAvailability(
  roomId: string, 
  updates: Partial<types.RoomAvailability>
): Promise<types.RoomAvailability> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('room_availability')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .select()
      .single()

    if (error) {
      console.error(`Error updating room availability for ${roomId}:`, error)
      throw error
    }

    return data as types.RoomAvailability
  } catch (error) {
    console.error('Exception in updateRoomAvailability:', error)
    throw error
  }
}

/**
 * Get room blackouts for a specific room
 */
export async function getRoomBlackouts(roomId: string): Promise<types.RoomBlackout[]> {
  try {
    const { data, error } = await supabase
      .from('room_blackouts')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('start_time', { ascending: true })

    if (error) {
      console.error(`Error fetching room blackouts for ${roomId}:`, error)
      throw error
    }

    return data as types.RoomBlackout[]
  } catch (error) {
    console.error('Exception in getRoomBlackouts:', error)
    throw error
  }
}

/**
 * Create a new room blackout
 */
export async function createRoomBlackout(blackout: Omit<types.RoomBlackout, 'id' | 'created_at' | 'updated_at'>): Promise<types.RoomBlackout> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('room_blackouts')
      .insert({
        ...blackout,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating room blackout:', error)
      throw error
    }

    return data as types.RoomBlackout
  } catch (error) {
    console.error('Exception in createRoomBlackout:', error)
    throw error
  }
}

/**
 * Update a room blackout
 */
export async function updateRoomBlackout(
  blackoutId: string, 
  updates: Partial<types.RoomBlackout>
): Promise<types.RoomBlackout> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('room_blackouts')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', blackoutId)
      .select()
      .single()

    if (error) {
      console.error(`Error updating room blackout ${blackoutId}:`, error)
      throw error
    }

    return data as types.RoomBlackout
  } catch (error) {
    console.error('Exception in updateRoomBlackout:', error)
    throw error
  }
}

/**
 * Delete a room blackout
 */
export async function deleteRoomBlackout(blackoutId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('room_blackouts')
      .delete()
      .eq('id', blackoutId)

    if (error) {
      console.error(`Error deleting room blackout ${blackoutId}:`, error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Exception in deleteRoomBlackout:', error)
    throw error
  }
}

/**
 * Get bookings for a room within a date range
 */
export async function getBookingsByRoomAndDateRange(
  roomId: string, 
  startDate: string, 
  endDate: string
): Promise<types.Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users:user_id (id, name, email),
        rooms:room_id (id, name, location)
      `)
      .eq('room_id', roomId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true })

    if (error) {
      console.error(`Error fetching bookings for room ${roomId}:`, error)
      throw error
    }

    return data as types.Booking[]
  } catch (error) {
    console.error('Exception in getBookingsByRoomAndDateRange:', error)
    throw error
  }
}

/**
 * Automatically expire pending bookings that have passed their scheduled time
 * This function should be called periodically or when viewing pending bookings
 */
export async function expirePendingBookings(): Promise<{ expiredCount: number; expiredBookings: types.Booking[] }> {
  try {
    console.log('🕐 [expirePendingBookings] Starting automatic expiration of pending bookings')

    const now = new Date().toISOString()

    // First, get all pending bookings that have passed their start time
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('start_time', now)

    if (fetchError) {
      console.error('Error fetching expired pending bookings:', fetchError)
      throw fetchError
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log('✅ [expirePendingBookings] No pending bookings to expire')
      return { expiredCount: 0, expiredBookings: [] }
    }

    console.log(`📋 [expirePendingBookings] Found ${expiredBookings.length} pending bookings to expire:`)
    expiredBookings.forEach(booking => {
      console.log(`   - ${booking.id}: "${booking.title}" scheduled for ${booking.start_time}`)
    })

    // Update all expired pending bookings to cancelled status
    const { data: updatedBookings, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: now
      })
      .eq('status', 'pending')
      .lt('start_time', now)
      .select()

    if (updateError) {
      console.error('Error updating expired pending bookings:', updateError)
      throw updateError
    }

    const expiredCount = updatedBookings?.length || 0
    console.log(`✅ [expirePendingBookings] Successfully expired ${expiredCount} pending bookings`)

    return {
      expiredCount,
      expiredBookings: updatedBookings as types.Booking[] || []
    }
  } catch (error) {
    console.error('Exception in expirePendingBookings:', error)
    throw error
  }
}
