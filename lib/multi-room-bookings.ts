import { supabase } from '@/lib/supabase'
import * as types from '@/types'

// Client-safe multi-room bookings fetcher
export async function getBookingsForRoomsDateRange(
  roomIds: string[],
  start: string,
  end: string
): Promise<types.Booking[]> {
  if (!roomIds || roomIds.length === 0) return []

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      users:user_id (id, name, email, department),
      rooms:room_id (id, name, location, facility_id)
    `)
    .in('room_id', roomIds)
    .gte('start_time', start)
    .lte('end_time', end)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching bookings for rooms date range:', error)
    throw error
  }

  return (data || []) as unknown as types.Booking[]
}

