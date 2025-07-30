import { supabase, createAdminClient } from './supabase'
import * as types from '@/types'
import { createBookingConfirmationNotification, createBookingRejectionNotification } from '@/lib/notifications'
import { sendBookingConfirmationEmail, sendBookingRejectionEmail, sendUserBookingCancellationEmail } from '@/lib/email-service'

// Users
export async function getUsers(): Promise<types.User[]> {
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

export async function getUserById(id: string): Promise<types.User | null> {
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

export async function getUserByEmail(email: string): Promise<types.User | null> {
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

// Facilities
export async function getFacilities(): Promise<types.Facility[]> {
  try {
    console.log('Fetching all facilities...');
    
    const { data, error } = await supabase
      .from('facilities')
      .select('*');

    if (error) {
      console.error('Error fetching facilities:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} facilities:`);
      data.forEach(facility => {
        console.log(`- Facility ID: ${facility.id}, Name: ${facility.name}, Location: ${facility.location || 'N/A'}`);
      });
    } else {
      console.log('No facilities found in the database.');
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getFacilities:', error);
    throw error;
  }
}

export async function getFacilitiesByManager(userId: string): Promise<types.Facility[]> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('manager_id', userId)

    if (error) {
      console.error('Error fetching facilities by manager:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getFacilitiesByManager:', error);
    throw error;
  }
}

export async function getFacilityById(id: string): Promise<types.Facility | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching facility ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getFacilityById:', error);
    throw error;
  }
}

export async function createFacility(facilityInput: Omit<types.Facility, 'id' | 'created_at' | 'updated_at'>): Promise<types.Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .insert(facilityInput)
      .select()
      .single();

    if (error) {
      console.error('Error creating facility:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in createFacility:', error);
    throw error;
  }
}

export async function updateFacility(id: string, facilityInput: Partial<types.Facility>): Promise<types.Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .update(facilityInput)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating facility ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in updateFacility:', error);
    throw error;
  }
}

export async function deleteFacility(id: string): Promise<boolean> {
  try {
    // Check for rooms associated with the facility
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('facility_id', id)
      .limit(1);

    if (roomsError) {
      console.error(`Error checking rooms for facility ${id}:`, roomsError);
      throw roomsError;
    }

    if (rooms && rooms.length > 0) {
      throw new Error('Cannot delete facility with associated rooms. Please delete or reassign rooms first.');
    }

    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting facility ${id}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Exception in deleteFacility:', error);
    throw error;
  }
}


// Rooms

// Helper function to get the IDs of rooms managed by a facility manager.
// Not exported, as it's only used by other functions in this file.
async function getManagedRoomIds(userId: string): Promise<string[]> {
  // Step 1: Find the facility managed by the user.
  const { data: facility, error: facilityError } = await supabase
    .from('facilities')
    .select('id')
    .eq('manager_id', userId)
    .single();

  if (facilityError || !facility) {
    // It's not an error if a manager has no facility, just return empty.
    if (facilityError && facilityError.code !== 'PGRST116') { // PGRST116: "not found"
       console.error(`Error fetching facility for manager ${userId}:`, facilityError);
       throw facilityError;
    }
    return [];
  }
  
  // Step 2: Get all room IDs that belong to that facility.
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id')
    .eq('facility_id', facility.id);

  if (roomsError) {
      console.error(`Error fetching rooms for facility ${facility.id}:`, roomsError);
      throw roomsError;
  }

  return (rooms || []).map(r => r.id);
}

export async function getRoomsByFacilityManager(userId: string): Promise<types.Room[]> {
  try {
    // Step 1: Find the facility managed by the user.
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id')
      .eq('manager_id', userId)
      .single();

    if (facilityError || !facility) {
      if (facilityError && facilityError.code !== 'PGRST116') {
         console.error(`Error fetching facility for manager ${userId}:`, facilityError);
         throw facilityError;
      }
      return [];
    }

    // Step 2: Get all rooms that belong to that facility with explicit join
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`*, facilities!facility_id(id, name, location)`)
      .eq('facility_id', facility.id);
    
    if (roomsError) {
      console.error(`Error fetching rooms for facility ${facility.id}:`, roomsError);
      throw roomsError;
    }

    // Normalize facility property
    const normalizedRooms = rooms ? rooms.map(room => {
      let normalizedFacility = null;
      if (room.facilities) {
        normalizedFacility = {
          id: room.facilities.id,
          name: room.facilities.name,
          location: room.facilities.location
        };
      } else if (room.facility_id) {
        normalizedFacility = {
          id: room.facility_id,
          name: "Unknown Facility",
          location: "Unknown Location"
        };
      }
      
      return {
        ...room,
        facility: normalizedFacility,
        facilities: undefined
      };
    }) : [];

    return normalizedRooms;
  } catch (error) {
    console.error('Exception in getRoomsByFacilityManager:', error);
    throw error;
  }
}


export async function getRooms(): Promise<types.Room[]> {
  try {
    console.log('Fetching rooms with explicit facility join...');
    
    // Use the same join pattern that works in getRoomsByFacilityManager
    const { data: roomsWithFacilities, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        *,
        facilities!facility_id(id, name, location)
      `)
      
    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      throw roomsError
    }
    
    if (!roomsWithFacilities || roomsWithFacilities.length === 0) {
      console.log('No rooms found');
      return []
    }
    
    console.log(`Found ${roomsWithFacilities.length} rooms`);
    
    // Process the results to normalize the facility property using the same approach as getRoomsByFacilityManager
    const normalizedRooms = roomsWithFacilities.map(room => {
      let normalizedFacility = null;
      // If the join returned facility data, use it
      if (room.facilities) {
        normalizedFacility = {
          id: room.facilities.id,
          name: room.facilities.name,
          location: room.facilities.location || 'Unknown Location'
        };
      } else if (room.facility_id) {
        // Fallback if the join didn't work but we have facility_id
        normalizedFacility = {
          id: room.facility_id,
          name: "Unknown Facility",
          location: "Unknown Location"
        };
      }
      
      // Return the room with normalized facility property
      return {
        ...room,
        facility: normalizedFacility,
        facilities: undefined // Remove the original joined property
      };
    });
    
    // For each room, get the resource details if needed
    const roomsWithResourceDetails = await Promise.all(normalizedRooms.map(async (room) => {
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
    }));
    
    return roomsWithResourceDetails;
  } catch (error) {
    console.error('Exception in getRooms:', error)
    throw error
  }
}

export async function getRoomById(id: string): Promise<types.Room | null> {
  try {
    // Get the room with its resources using explicit join
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select(`
        *,
        facilities!facility_id (id, name, location)
      `)
      .eq('id', id)
      .single()
      
    if (roomError) {
      console.error(`Error fetching room ${id}:`, roomError)
      throw roomError
    }
    
    if (!room) return null
    
    // Normalize facility property
    let facility = null;
    if (room.facilities) {
      facility = {
        id: room.facilities.id,
        name: room.facilities.name,
        location: room.facilities.location
      };
    } else if (room.facility_id) {
      facility = {
        id: room.facility_id,
        name: "Unknown Facility",
        location: "Unknown Location"
      };
    }
    
    // If the room has no resources, return as is
    if (!room.room_resources || room.room_resources.length === 0) {
      return {
        ...room,
        facility: facility,
        facilities: undefined,
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
        facility: facility,
        facilities: undefined,
        resourceDetails: []
      }
    }
    
    return {
      ...room,
      facility: facility,
      facilities: undefined,
      resourceDetails: resourceDetails || []
    }
  } catch (error) {
    console.error('Exception in getRoomById:', error)
    throw error
  }
}

export async function createRoom(roomInput: Omit<types.Room, 'id'>): Promise<types.Room> {
  try {
    // If facility_id is provided but facility_name is not, look up the facility name
    let facilityName = roomInput.facility_name;
    
    if (roomInput.facility_id && !facilityName) {
      // Look up the facility name from the facility_id
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', roomInput.facility_id)
        .single();
      
      if (facilityData) {
        facilityName = facilityData.name;
      }
    }
    
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
        description: roomInput.description || null,
        facility_id: roomInput.facility_id,
        facility_name: facilityName || 'Unknown Facility'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating room:', error)
      throw error
    }
    
    // Return the room with resource details
    return getRoomById(room.id) as Promise<types.Room>
  } catch (error) {
    console.error('Exception in createRoom:', error)
    throw error
  }
}

export async function updateRoom(id: string, roomInput: Partial<types.Room>): Promise<types.Room> {
  try {
    // If facility_id is provided but facility_name is not, look up the facility name
    let facilityName = roomInput.facility_name;
    
    if (roomInput.facility_id && !facilityName) {
      // Look up the facility name from the facility_id
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', roomInput.facility_id)
        .single();
      
      if (facilityData) {
        facilityName = facilityData.name;
      }
    }
    
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
        description: roomInput.description,
        facility_id: roomInput.facility_id,
        facility_name: facilityName
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating room ${id}:`, error)
      throw error
    }
    
    // Return the room with resource details
    return getRoomById(id) as Promise<types.Room>
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
export async function getBookings(): Promise<types.Booking[]> {
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

export async function getBookingsWithDetails(): Promise<types.BookingWithDetails[]> {
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

export async function getUserBookingsWithDetails(userId: string): Promise<types.BookingWithDetails[]> {
  try {
    if (!userId) {
      console.warn('getUserBookingsWithDetails called with empty userId');
      return [];
    }
    
    // Add a random parameter to prevent caching
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error(`Error fetching bookings with details for user ${userId}:`, error)
      throw error
    }
    
    // Ensure we return an array even if data is null or undefined
    const bookings = data || [];
    console.log(`Fetched ${bookings.length} bookings for user ${userId}`)
    return bookings
  } catch (error) {
    console.error('Exception in getUserBookingsWithDetails:', error)
    // Return empty array instead of throwing to prevent UI errors
    return []
  }
}

export async function getBookingsByUserId(userId: string): Promise<types.Booking[]> {
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

export async function getBookingById(id: string): Promise<types.Booking | null> {
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

export async function createBooking(bookingData: Omit<types.Booking, 'id' | 'created_at' | 'updated_at'>): Promise<types.Booking> {
  try {
    // Ensure all required fields are present
    if (!bookingData.room_id) throw new Error('room_id is required')
    if (!bookingData.user_id) throw new Error('user_id is required')
    if (!bookingData.title) throw new Error('title is required')
    if (!bookingData.start_time) throw new Error('start_time is required')
    if (!bookingData.end_time) throw new Error('end_time is required')
    
    // Prepare the booking data with timestamps
    const newBooking = {
      ...bookingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Ensure status is set
      status: bookingData.status || 'pending'
    }
    
    console.log(`Creating booking: ${JSON.stringify(newBooking, null, 2)}`)
    
    // Use admin client to bypass RLS if needed
    const client = createAdminClient()
    
    // Insert the booking
    const { data, error } = await client
      .from('bookings')
      .insert(newBooking)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating booking:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned after booking creation')
    }
    
    console.log(`Successfully created booking with ID: ${data.id}`)
    return data
  } catch (error) {
    console.error('Exception in createBooking:', error)
    throw error
  }
}

export async function updateBooking(id: string, bookingData: Partial<types.Booking>): Promise<types.Booking> {
  console.log(`🟢 [updateBooking] FUNCTION ENTRY - Booking ID: ${id}`)
  console.log(`🟢 [updateBooking] Data to update:`, JSON.stringify(bookingData, null, 2))
  
  try {
    // First get the current booking to validate cancellation rules
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, users:user_id(id, name, email), rooms:room_id(id, name)')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error(`Error fetching booking ${id}:`, fetchError)
      throw fetchError
    }
    
    const updates = {
      ...bookingData,
      updated_at: new Date().toISOString()
    }
    
    console.log(`🟢 [updateBooking] Prepared updates:`, JSON.stringify(updates, null, 2))
    
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
    
    // Send email notifications if status is being changed to confirmed or cancelled
    console.log(`🎯 REACHED EMAIL SECTION - Booking ID: ${id}`)
    console.log(`🔍 updateBooking Debug - Booking ID: ${id}`)
    console.log(`🔍 Status being set to: ${bookingData.status}`)
    console.log(`🔍 Current booking data structure:`, JSON.stringify(currentBooking, null, 2))
    console.log(`🔍 User data type:`, typeof currentBooking.users, Array.isArray(currentBooking.users))
    console.log(`🔍 User data:`, currentBooking.users)
    console.log(`🔍 Room data type:`, typeof currentBooking.rooms, Array.isArray(currentBooking.rooms))
    console.log(`🔍 Room data:`, currentBooking.rooms)
    
    // Handle potential array structure from Supabase joins
    let user = currentBooking.users
    let room = currentBooking.rooms
    
    // Sometimes Supabase returns joined data as arrays
    if (Array.isArray(user) && user.length > 0) {
      user = user[0]
      console.log(`🔧 User was array, using first element:`, user)
    }
    if (Array.isArray(room) && room.length > 0) {
      room = room[0]
      console.log(`🔧 Room was array, using first element:`, room)
    }
    
    console.log(`🔍 Final user object:`, user)
    console.log(`🔍 Final room object:`, room)
    
    if (bookingData.status && user && room) {
      try {
        console.log(`🔍 Email notification conditions met:`)
        console.log(`   - Status: ${bookingData.status}`)
        console.log(`   - User email: ${user.email}`)
        console.log(`   - User name: ${user.name}`)
        console.log(`   - Room name: ${room.name}`)
        console.log(`   - User has email: ${!!user.email}`)
        console.log(`   - Email valid: ${user.email && user.email.includes('@')}`)
        
        if (bookingData.status === 'confirmed' && user.email && user.name) {
          console.log(`📧 Sending booking confirmation email to ${user.email} for booking ${id}`)
          console.log(`📧 Booking details: ${currentBooking.title} in ${room.name}`)
          
          const emailResult = await sendBookingConfirmationEmail(
            user.email,
            user.name,
            currentBooking.title,
            room.name,
            currentBooking.start_time,
            currentBooking.end_time
          )
          
          if (emailResult) {
            console.log(`✅ Booking confirmation email sent successfully to ${user.email}`)
          } else {
            console.log(`❌ Booking confirmation email failed to send to ${user.email}`)
          }
          
          // Also create in-app notification
          await createBookingConfirmationNotification(
            currentBooking.user_id,
            id,
            currentBooking.title,
            room.name
          )
        } else if (bookingData.status === 'cancelled' && user.email && user.name) {
            // This is a manager rejection
            console.log(`📧 Sending booking rejection email to ${user.email} for booking ${id}`)
            console.log(`📧 Booking details: ${currentBooking.title} in ${room.name}`)
            console.log(`📧 Rejection reason: ${bookingData.rejection_reason || 'No reason provided'}`)
            
            const emailResult = await sendBookingRejectionEmail(
              user.email,
              user.name,
              currentBooking.title,
              room.name,
              bookingData.rejection_reason || 'No reason provided'
            )
            
            if (emailResult) {
              console.log(`✅ Booking rejection email sent successfully to ${user.email}`)
            } else {
              console.log(`❌ Booking rejection email failed to send to ${user.email}`)
            }
            
            // Also create in-app notification for manager rejections
            await createBookingRejectionNotification(
              currentBooking.user_id,
              id,
              currentBooking.title,
              room.name,
              bookingData.rejection_reason
            )
        } else if (bookingData.status === 'confirmed' || bookingData.status === 'cancelled') {
          console.warn(`⚠️ Could not send ${bookingData.status === 'confirmed' ? 'confirmation' : 'rejection'} email - user not found or missing email/name`)
          console.warn(`   - User email: ${user?.email || 'MISSING'}`)
          console.warn(`   - User name: ${user?.name || 'MISSING'}`)
        }
      } catch (emailError) {
        console.error(`❌ Failed to send email notification for booking ${id}:`, emailError)
        // Don't fail the booking update if email fails
      }
    } else {
      console.log(`⚠️ Email notification NOT sent for booking ${id}:`)
      console.log(`   - Status update: ${bookingData.status ? 'YES' : 'NO'}`)
      console.log(`   - User data available: ${user ? 'YES' : 'NO'}`)
      console.log(`   - Room data available: ${room ? 'YES' : 'NO'}`)
      if (user) {
        console.log(`   - User email: ${user.email || 'MISSING'}`)
        console.log(`   - User name: ${user.name || 'MISSING'}`)
      }
      if (room) {
        console.log(`   - Room name: ${room.name || 'MISSING'}`)
      }
      console.log(`   - Original user data:`, currentBooking.users)
      console.log(`   - Original room data:`, currentBooking.rooms)
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateBooking:', error)
    throw error
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ [deleteBooking] Starting deletion of booking ${id}`)
    
    // First, get the booking to check if it can be deleted
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error(`Error fetching booking ${id}:`, fetchError)
      return false
    }
    
    // Check if this is a confirmed booking and if it's within 24 hours of start time
    if (booking.status === 'confirmed') {
      const now = new Date()
      const startTime = new Date(booking.start_time)
      const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      console.log(`🔍 [deleteBooking] Confirmed booking validation:`)
      console.log(`   - Hours until meeting: ${hoursUntilMeeting.toFixed(1)}`)
      
      if (hoursUntilMeeting < 24) {
        const errorMsg = hoursUntilMeeting < 0 
          ? "Cannot delete booking after it has started"
          : "Cannot delete confirmed booking less than 24 hours before start time"
        console.error(`❌ [deleteBooking] Deletion validation failed: ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      console.log(`✅ [deleteBooking] Confirmed booking validation passed - more than 24 hours before start time`)
    } else {
      console.log(`✅ [deleteBooking] Booking is ${booking.status}, can be deleted without time restriction`)
    }
    
    // Delete the booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error(`Error deleting booking ${id}:`, error)
      return false
    }
    
    console.log(`✅ [deleteBooking] Successfully deleted booking ${id}`)
    return true
  } catch (error) {
    console.error('Exception in deleteBooking:', error)
    throw error // Rethrow to allow API to handle the error message
  }
}

// Resources
export async function getResources(): Promise<types.Resource[]> {
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

export async function getResourceById(id: string): Promise<types.Resource | null> {
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

export async function createResource(resourceData: Omit<types.Resource, 'id'>): Promise<types.Resource> {
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

export async function updateResource(id: string, resourceData: Partial<types.Resource>): Promise<types.Resource> {
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

export async function getResourcesByFacility(facilityId: string): Promise<types.Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('facility_id', facilityId)
      
    if (error) {
      console.error(`Error fetching resources for facility ${facilityId}:`, error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in getResourcesByFacility:', error)
    throw error
  }
}

// Admin operations - using admin client to bypass RLS
export async function adminGetAllUsers(): Promise<types.User[]> {
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

export async function adminGetAllBookings(): Promise<types.Booking[]> {
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

export async function adminCreateResource(resourceData: Omit<types.Resource, 'id'>): Promise<types.Resource> {
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
    // Fetch all bookings for the room that could possibly conflict
    let query = supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('room_id', room_id)
      .in('status', ['confirmed', 'pending'])
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }
    const { data, error } = await query
    if (error) {
      console.error('Error checking booking conflicts:', error)
      throw error
    }
    // Parse the new booking times
    const newStart = new Date(start_time)
    const newEnd = new Date(end_time)
    // 30-minute buffer in ms
    const bufferMs = 30 * 60 * 1000
    // Check for conflicts with buffer
    const hasConflict = (data || []).some((booking: any) => {
      const existingStart = new Date(booking.start_time)
      const existingEnd = new Date(booking.end_time)
      const bufferEnd = new Date(existingEnd.getTime() + bufferMs)
      // New booking cannot start before bufferEnd of existing booking
      // and cannot end after existingStart
      // Overlap if: newStart < bufferEnd && newEnd > existingStart
      return newStart < bufferEnd && newEnd > existingStart
    })
    return hasConflict
  } catch (error) {
    console.error('Exception in checkBookingConflicts:', error)
    throw error
  }
}

// Get available rooms for a time period
export async function getAvailableRooms(start_time: string, end_time: string): Promise<types.Room[]> {
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
export async function getRoomsWithResource(resourceId: string): Promise<types.Room[]> {
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

export async function getPendingBookingsByFacilityManager(userId: string): Promise<types.BookingWithDetails[]> {
  try {
    const roomIds = await getManagedRoomIds(userId);
    if (roomIds.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      .in('room_id', roomIds)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending bookings:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Exception in getPendingBookingsByFacilityManager:', error);
    throw error;
  }
} 

export async function getAllBookingsByFacilityManager(userId: string): Promise<types.BookingWithDetails[]> {
  try {
      const roomIds = await getManagedRoomIds(userId);
      if (roomIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
          .from('bookings')
          .select(`
              *,
              rooms:room_id(id, name, location, capacity),
              users:user_id(id, name, email)
          `)
          .in('room_id', roomIds)
          .order('start_time', { ascending: false });

      if (error) {
          console.error('Error fetching bookings:', error);
          throw error;
      }

      return data || [];
  } catch (error) {
      console.error('Exception in getAllBookingsByFacilityManager:', error);
      throw error;
  }
} 
  
  
export async function getTodaysBookingsByFacilityManager(userId: string): Promise<types.BookingWithDetails[]> {
  try {
    const roomIds = await getManagedRoomIds(userId);
    if (roomIds.length === 0) {
      return [];
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms:room_id(id, name, location, capacity),
        users:user_id(id, name, email)
      `)
      .in('room_id', roomIds)
      .eq('status', 'confirmed')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s bookings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getTodaysBookingsByFacilityManager:', error);
    throw error;
  }
} 

export async function updateBookingStatus(
  bookingId: string,
  userId: string,
  status: 'confirmed' | 'cancelled',
  rejectionReason?: string
): Promise<{ success: boolean; booking?: types.Booking; error?: string }> {
  try {
    // Step 1: Get the booking with room details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, rooms:room_id(*)')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError || 'Booking not found');
      return { 
        success: false, 
        error: bookingError ? bookingError.message : 'Booking not found' 
      };
    }
    
    // Step 2: Get the room's facility
    if (!booking.rooms || !booking.rooms.facility_id) {
      return { 
        success: false, 
        error: 'Room or facility information missing' 
      };
    }
    
    // Step 3: Check if the user is the facility manager
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', booking.rooms.facility_id)
      .eq('manager_id', userId)
      .single();
    
    if (facilityError || !facility) {
      console.error('Permission denied: User is not the facility manager', facilityError);
      return { 
        success: false, 
        error: 'Permission denied: Only the facility manager can approve or reject bookings' 
      };
    }
    
    // Step 4: Update the booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating booking status:', updateError);
      return { 
        success: false, 
        error: `Failed to update booking status: ${updateError.message}` 
      };
    }
    
    // Step 5: Create notification for the user who made the booking
    try {
      // Get user details for the notification
      const user = await getUserById(booking.user_id);
      
      if (user) {
        if (status === 'confirmed') {
          // Create confirmation notification
          await createBookingConfirmationNotification(
            booking.user_id,
            bookingId,
            booking.title,
            booking.rooms.name
          );
          
          // Send email notification
          if (user.email) {
            try {
              console.log(`📧 Sending confirmation email to ${user.email} via updateBookingStatus`);
              const emailSent = await sendBookingConfirmationEmail(
                user.email,
                user.name,
                booking.title,
                booking.rooms.name,
                booking.start_time,
                booking.end_time
              );
              console.log(`📧 Confirmation email result: ${emailSent}`);
            } catch (emailError) {
              console.error('❌ Failed to send confirmation email in updateBookingStatus:', emailError);
            }
          } else {
            console.log(`❌ No email address for user ${user.name} (ID: ${user.id})`);
          }
        } else if (status === 'cancelled') {
          // Create rejection notification
          await createBookingRejectionNotification(
            booking.user_id,
            bookingId,
            booking.title,
            booking.rooms.name,
            rejectionReason
          );
          
          // Send email notification
          if (user.email) {
            try {
              console.log(`📧 Sending rejection email to ${user.email} via updateBookingStatus`);
              const emailSent = await sendBookingRejectionEmail(
                user.email,
                user.name,
                booking.title,
                booking.rooms.name,
                rejectionReason || 'No reason provided'
              );
              console.log(`📧 Rejection email result: ${emailSent}`);
            } catch (emailError) {
              console.error('❌ Failed to send rejection email in updateBookingStatus:', emailError);
            }
          } else {
            console.log(`❌ No email address for user ${user.name} (ID: ${user.id})`);
          }
        }
      }
    } catch (notificationError) {
      // Log the error but don't fail the request
      console.error('Failed to send user notification:', notificationError);
    }
    
    return { 
      success: true, 
      booking: updatedBooking 
    };
  } catch (error) {
    console.error('Exception in updateBookingStatus:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 