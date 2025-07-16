import { supabase, createAdminClient } from './supabase'
import type { AuthUser, User, Room, Booking, Resource, BookingWithDetails } from '@/types'

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
    // Get all rooms with their resources
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      
    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      throw roomsError
    }
    
    if (!rooms || rooms.length === 0) {
      return []
    }
    
    // For each room, get the resource details
    const roomsWithResourceDetails = await Promise.all(rooms.map(async (room) => {
      // If the room has no resources, return as is
      if (!room.room_resources || room.room_resources.length === 0) {
        return {
          ...room,
          resourceDetails: []
        }
      }
      
      // Get details for each resource
      const { data: resourceDetails, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .in('id', room.room_resources)
      
      if (resourcesError) {
        console.error(`Error fetching resource details for room ${room.id}:`, resourcesError)
        return {
          ...room,
          resourceDetails: []
        }
      }
      
      return {
        ...room,
        resourceDetails: resourceDetails || []
      }
    }))
    
    return roomsWithResourceDetails || []
  } catch (error) {
    console.error('Exception in getRooms:', error)
    throw error
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  try {
    // Get the room with its resources
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()
      
    if (roomError) {
      console.error(`Error fetching room ${id}:`, roomError)
      throw roomError
    }
    
    if (!room) return null
    
    // If the room has no resources, return as is
    if (!room.room_resources || room.room_resources.length === 0) {
      return {
        ...room,
        resourceDetails: []
      }
    }
    
    // Get details for each resource
    const { data: resourceDetails, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .in('id', room.room_resources)
    
    if (resourcesError) {
      console.error(`Error fetching resource details for room ${id}:`, resourcesError)
      return {
        ...room,
        resourceDetails: []
      }
    }
    
    return {
      ...room,
      resourceDetails: resourceDetails || []
    }
  } catch (error) {
    console.error('Exception in getRoomById:', error)
    throw error
  }
}

export async function createRoom(roomInput: Omit<Room, 'id'>): Promise<Room> {
  try {
    // Create the room with resources directly in the room record
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        name: roomInput.name,
        location: roomInput.location,
        capacity: roomInput.capacity,
        room_resources: roomInput.room_resources || [],
        status: roomInput.status || 'available',
        image: roomInput.image || null,
        description: roomInput.description || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating room:', error)
      throw error
    }
    
    // Return the room with resource details
    return getRoomById(room.id) as Promise<Room>
  } catch (error) {
    console.error('Exception in createRoom:', error)
    throw error
  }
}

export async function updateRoom(id: string, roomInput: Partial<Room>): Promise<Room> {
  try {
    // Update the room with resources directly in the room record
    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        name: roomInput.name,
        location: roomInput.location,
        capacity: roomInput.capacity,
        room_resources: roomInput.room_resources,
        status: roomInput.status,
        image: roomInput.image,
        description: roomInput.description
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating room ${id}:`, error)
      throw error
    }
    
    // Return the room with resource details
    return getRoomById(id) as Promise<Room>
  } catch (error) {
    console.error('Exception in updateRoom:', error)
    throw error
  }
}

export async function deleteRoom(id: string): Promise<boolean> {
  try {
    // First check if there are any active or future bookings for this room
    const currentDate = new Date().toISOString()
    
    const { data: activeBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', id)
      .neq('status', 'cancelled') // Exclude cancelled bookings
      .gt('end_time', currentDate) // Only include future or ongoing bookings
      .limit(1)
      
    if (bookingError) {
      console.error(`Error checking bookings for room ${id}:`, bookingError)
      throw bookingError
    }
    
    // If there are active or future bookings, don't allow deletion
    if (activeBookings && activeBookings.length > 0) {
      throw new Error('Cannot delete room with active or future bookings. Cancel all active bookings first.')
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

export async function getBookingsWithDetails(): Promise<BookingWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      
    if (error) {
      console.error('Error fetching bookings with details:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getBookingsWithDetails:', error)
    throw error
  }
}

export async function getUserBookingsWithDetails(userId: string): Promise<BookingWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      .eq('user_id', userId)
      
    if (error) {
      console.error(`Error fetching bookings with details for user ${userId}:`, error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getUserBookingsWithDetails:', error)
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

export async function createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
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

export async function adminCreateResource(resourceData: Omit<Resource, 'id'>): Promise<Resource> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
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
    console.error('Exception in adminCreateResource:', error)
    throw error
  }
}

// Check for booking conflicts
export async function checkBookingConflicts(
  room_id: string, 
  start_time: string, 
  end_time: string, 
  excludeBookingId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('room_id', room_id)
      .eq('status', 'confirmed')
      .or(`start_time.gte.${start_time},end_time.gt.${start_time}`)
      .or(`start_time.lt.${end_time},end_time.lte.${end_time}`)
      .or(`start_time.lte.${start_time},end_time.gte.${end_time}`)
    
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
export async function getAvailableRooms(start_time: string, end_time: string): Promise<Room[]> {
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
      .or(`start_time.gte.${start_time},end_time.gt.${start_time}`)
      .or(`start_time.lt.${end_time},end_time.lte.${end_time}`)
      .or(`start_time.lte.${start_time},end_time.gte.${end_time}`)
    
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

// New function to assign a resource to a room
export async function assignResourceToRoom(
  roomId: string, 
  resourceId: string, 
  quantity: number = 1
): Promise<boolean> {
  try {
    console.log(`Attempting to assign resource ${resourceId} to room ${roomId} with quantity ${quantity}`)
    
    // Check if the assignment already exists
    const { data: existing, error: checkError } = await supabase
      .from('room_resources')
      .select('id')
      .eq('room_id', roomId)
      .eq('resource_id', resourceId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing room resource:', checkError)
      throw checkError
    }
    
    if (existing) {
      console.log(`Resource ${resourceId} already assigned to room ${roomId}, updating quantity to ${quantity}`)
      // Update existing assignment
      const { error } = await supabase
        .from('room_resources')
        .update({ quantity })
        .eq('id', existing.id)
      
      if (error) {
        console.error('Error updating room resource:', error)
        throw error
      }
    } else {
      console.log(`Creating new assignment for resource ${resourceId} to room ${roomId}`)
      // Create new assignment
      const { data, error } = await supabase
        .from('room_resources')
        .insert({
          room_id: roomId,
          resource_id: resourceId,
          quantity
        })
      
      if (error) {
        console.error('Error assigning resource to room:', error)
        console.error('Error details:', JSON.stringify(error))
        throw error
      }
      
      console.log('Resource assignment successful:', data)
    }
    
    return true
  } catch (error) {
    console.error('Exception in assignResourceToRoom:', error)
    throw error
  }
}

// New function to remove a resource from a room
export async function removeResourceFromRoom(roomId: string, resourceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('room_resources')
      .delete()
      .eq('room_id', roomId)
      .eq('resource_id', resourceId)
    
    if (error) {
      console.error('Error removing resource from room:', error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in removeResourceFromRoom:', error)
    throw error
  }
}

// New function to remove all resources from a room
export async function removeAllResourcesFromRoom(roomId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('room_resources')
      .delete()
      .eq('room_id', roomId)
    
    if (error) {
      console.error('Error removing all resources from room:', error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in removeAllResourcesFromRoom:', error)
    throw error
  }
}

// New function to get resources for a specific room
export async function getResourcesForRoom(roomId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('room_resources')
      .select(`
        resource_id,
        quantity,
        resources:resource_id (
          id,
          name,
          type,
          status,
          description
        )
      `)
      .eq('room_id', roomId)
    
    if (error) {
      console.error(`Error fetching resources for room ${roomId}:`, error)
      throw error
    }
    
    return data.map(item => ({
      ...item.resources,
      quantity: item.quantity
    })) || []
  } catch (error) {
    console.error('Exception in getResourcesForRoom:', error)
    throw error
  }
}

// New function to get rooms that have a specific resource
export async function getRoomsWithResource(resourceId: string): Promise<Room[]> {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .contains('room_resources', [resourceId])
    
    if (error) {
      console.error(`Error fetching rooms with resource ${resourceId}:`, error)
      throw error
    }
    
    return rooms || []
  } catch (error) {
    console.error('Exception in getRoomsWithResource:', error)
    throw error
  }
} 

// Image upload functions
export async function uploadRoomImage(file: File): Promise<string | null> {
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `room-images/${fileName}`
    
    console.log(`Attempting to upload file to path: ${filePath}`)
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('conference-hub')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Changed from false to true
      })
    
    if (error) {
      console.error('Error uploading image:', error)
      throw error
    }
    
    console.log('File uploaded successfully:', data)
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('conference-hub')
      .getPublicUrl(data.path)
    
    console.log('Generated public URL:', publicUrlData)
    
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Exception in uploadRoomImage:', error)
    throw error
  }
}

export async function deleteRoomImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract the path from the URL
    const baseUrl = supabase.storage.from('conference-hub').getPublicUrl('').data.publicUrl
    const path = imageUrl.replace(baseUrl, '')
    
    // Delete the file
    const { error } = await supabase
      .storage
      .from('conference-hub')
      .remove([path])
    
    if (error) {
      console.error('Error deleting image:', error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('Exception in deleteRoomImage:', error)
    return false
  }
} 