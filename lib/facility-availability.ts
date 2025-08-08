import { supabase } from '@/lib/supabase'
import * as types from '@/types'

// Client-safe facility availability helpers (no server-only imports)

export async function getFacilityAvailability(facilityId: string): Promise<types.FacilityAvailability | null> {
  const { data, error } = await supabase
    .from('facility_availability')
    .select('*')
    .eq('facility_id', facilityId)
    .single()

  if (error) {
    // PGRST116: No rows
    if ((error as any).code === 'PGRST116') {
      return await createDefaultFacilityAvailability(facilityId)
    }
    console.error(`Error fetching facility availability for ${facilityId}:`, error)
    throw error
  }

  return data as types.FacilityAvailability
}

export async function createDefaultFacilityAvailability(facilityId: string): Promise<types.FacilityAvailability> {
  const { data: { user } } = await supabase.auth.getUser()

  const defaultAvailability = {
    facility_id: facilityId,
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
    .from('facility_availability')
    .insert(defaultAvailability)
    .select()
    .single()

  if (error) {
    console.error('Error creating default facility availability:', error)
    throw error
  }

  return data as types.FacilityAvailability
}

export async function updateFacilityAvailability(
  facilityId: string,
  updates: Partial<types.FacilityAvailability>
): Promise<types.FacilityAvailability> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('facility_availability')
    .update({
      ...updates,
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    })
    .eq('facility_id', facilityId)
    .select()
    .single()

  if (error) {
    console.error(`Error updating facility availability for ${facilityId}:`, error)
    throw error
  }

  return data as types.FacilityAvailability
}

