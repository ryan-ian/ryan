import { supabase, createAdminClient } from './supabase'
import type { AuthUser, User, Room, Booking, Resource } from '@/types'

// Users
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      
    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getUsers:', error)
    throw error
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Error fetching user ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getUserById:', error)
    throw error
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
      
    if (error) {
      console.error(`Error fetching user by email ${email}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getUserByEmail:', error)
    throw error
  }
}

// Rooms
export async function getRooms(): Promise<Room[]> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      
    if (error) {
      console.error('Error fetching rooms:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getRooms:', error)
    throw error
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Error fetching room ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getRoomById:', error)
    throw error
  }
}

export async function createRoom(roomInput: Omit<Room, 'id'>): Promise<Room> {
  try {
    // Direct table insert approach - we'll rely on proper RLS policies
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: roomInput.name,
        location: roomInput.location,
        capacity: roomInput.capacity,
        features: roomInput.features,
        status: roomInput.status,
        image: roomInput.image || null,
        description: roomInput.description || null,
        resources: roomInput.resources || []
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating room:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in createRoom:', error)
    throw error
  }
}

export async function updateRoom(id: string, roomInput: Partial<Room>): Promise<Room> {
  try {
    // Direct table update approach - we'll rely on proper RLS policies
    const { data, error } = await supabase
      .from('rooms')
      .update({
        name: roomInput.name,
        location: roomInput.location,
        capacity: roomInput.capacity,
        features: roomInput.features,
        status: roomInput.status,
        image: roomInput.image || null,
        description: roomInput.description || null,
        resources: roomInput.resources || []
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating room ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateRoom:', error)
    throw error
  }
}

export async function deleteRoom(id: string): Promise<boolean> {
  try {
    // First check if there are any bookings for this room
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', id)
      .limit(1)
      
    if (bookingError) {
      console.error(`Error checking bookings for room ${id}:`, bookingError)
      throw bookingError
    }
    
    // If there are bookings, don't allow deletion
    if (bookings && bookings.length > 0) {
      throw new Error('Cannot delete room with existing bookings')
    }
    
    // Delete the room
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error(`Error deleting room ${id}:`, error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in deleteRoom:', error)
    throw error
  }
}

// Bookings
export async function getBookings(): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      
    if (error) {
      console.error('Error fetching bookings:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getBookings:', error)
    throw error
  }
}

export async function getBookingsByUserId(userId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      
    if (error) {
      console.error(`Error fetching bookings for user ${userId}:`, error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getBookingsByUserId:', error)
    throw error
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Error fetching booking ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getBookingById:', error)
    throw error
  }
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
  try {
    const newBooking = {
      ...bookingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert(newBooking)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating booking:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in createBooking:', error)
    throw error
  }
}

export async function updateBooking(id: string, bookingData: Partial<Booking>): Promise<Booking> {
  try {
    const updates = {
      ...bookingData,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) {
      console.error(`Error updating booking ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateBooking:', error)
    throw error
  }
}

// Resources
export async function getResources(): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      
    if (error) {
      console.error('Error fetching resources:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getResources:', error)
    throw error
  }
}

export async function getResourceById(id: string): Promise<Resource | null> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Error fetching resource ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in getResourceById:', error)
    throw error
  }
}

export async function createResource(resourceData: Omit<Resource, 'id'>): Promise<Resource> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating resource:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in createResource:', error)
    throw error
  }
}

export async function updateResource(id: string, resourceData: Partial<Resource>): Promise<Resource> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .update(resourceData)
      .eq('id', id)
      .select()
      .single()
      
    if (error) {
      console.error(`Error updating resource ${id}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateResource:', error)
    throw error
  }
}

export async function deleteResource(id: string): Promise<boolean> {
  try {
    // First check if there are any bookings using this resource
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .contains('resources', [id])
      .limit(1)
      
    if (bookingError) {
      console.error(`Error checking bookings for resource ${id}:`, bookingError)
      throw bookingError
    }
    
    // If there are bookings using this resource, don't allow deletion
    if (bookings && bookings.length > 0) {
      throw new Error('Cannot delete resource that is being used in bookings')
    }
    
    // Delete the resource
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error(`Error deleting resource ${id}:`, error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in deleteResource:', error)
    throw error
  }
}

// Admin operations - using admin client to bypass RLS
export async function adminGetAllUsers(): Promise<User[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      
    if (error) {
      console.error('Admin error fetching users:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in adminGetAllUsers:', error)
    throw error
  }
}

export async function adminGetAllBookings(): Promise<Booking[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('bookings')
      .select('*')
      
    if (error) {
      console.error('Admin error fetching bookings:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in adminGetAllBookings:', error)
    throw error
  }
}

// Check for booking conflicts
export async function checkBookingConflicts(
  roomId: string, 
  startTime: string, 
  endTime: string, 
  excludeBookingId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .or(`start_time.gte.${startTime},end_time.gt.${startTime}`)
      .or(`start_time.lt.${endTime},end_time.lte.${endTime}`)
      .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
    
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error checking booking conflicts:', error)
      throw error
    }
    
    return (data && data.length > 0) || false
  } catch (error) {
    console.error('Exception in checkBookingConflicts:', error)
    throw error
  }
}

// Get available rooms for a time period
export async function getAvailableRooms(startTime: string, endTime: string): Promise<Room[]> {
  try {
    // First get all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'available')
    
    if (roomsError) {
      console.error('Error fetching available rooms:', roomsError)
      throw roomsError
    }
    
    if (!rooms || rooms.length === 0) {
      return []
    }
    
    // Then get all conflicting bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('status', 'confirmed')
      .or(`start_time.gte.${startTime},end_time.gt.${startTime}`)
      .or(`start_time.lt.${endTime},end_time.lte.${endTime}`)
      .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
    
    if (bookingsError) {
      console.error('Error fetching conflicting bookings:', bookingsError)
      throw bookingsError
    }
    
    // Filter out rooms with conflicting bookings
    const bookedRoomIds = new Set((bookings || []).map(b => b.room_id))
    return rooms.filter(room => !bookedRoomIds.has(room.id))
  } catch (error) {
    console.error('Exception in getAvailableRooms:', error)
    throw error
  }
} 