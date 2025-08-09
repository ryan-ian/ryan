import { supabase } from './supabase';

// Types for facility-specific data
export interface FacilityStats {
  totalBookings: number;
  currentMonthBookings: number;
  activeBookings: number;
  totalRooms: number;
  utilizationRate: number;
  popularTimes: Array<{ hour: number; count: number }>;
}

export interface ActivityLog {
  id: string;
  type: 'booking_created' | 'booking_cancelled' | 'room_added' | 'room_updated' | 'manager_changed';
  title: string;
  description: string;
  timestamp: string;
  user?: { name: string; email: string };
}

/**
 * Fetches comprehensive booking statistics for a specific facility
 * @param facilityId The facility ID to get stats for
 * @returns Promise with facility booking statistics
 */
export async function getFacilityBookingStats(facilityId: string): Promise<FacilityStats> {
  try {
    // Get current date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // First, get all room IDs for this facility
    const { data: facilityRooms, error: roomsQueryError } = await supabase
      .from('rooms')
      .select('id')
      .eq('facility_id', facilityId);

    if (roomsQueryError) {
      console.error('Error fetching facility rooms:', roomsQueryError);
      return {
        totalBookings: 0,
        currentMonthBookings: 0,
        activeBookings: 0,
        totalRooms: 0,
        utilizationRate: 0,
        popularTimes: [],
      };
    }

    const roomIds = facilityRooms?.map(room => room.id) || [];

    if (roomIds.length === 0) {
      return {
        totalBookings: 0,
        currentMonthBookings: 0,
        activeBookings: 0,
        totalRooms: 0,
        utilizationRate: 0,
        popularTimes: [],
      };
    }

    // Get total bookings for this facility
    const { count: totalBookings, error: totalError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('room_id', roomIds);

    if (totalError) {
      console.error('Error fetching total bookings:', totalError);
    }

    // Get current month bookings
    const { count: currentMonthBookings, error: monthError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('room_id', roomIds)
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString());

    if (monthError) {
      console.error('Error fetching current month bookings:', monthError);
    }

    // Get active bookings (future bookings that are confirmed)
    const { count: activeBookings, error: activeError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('room_id', roomIds)
      .eq('status', 'confirmed')
      .gt('end_time', now.toISOString());

    if (activeError) {
      console.error('Error fetching active bookings:', activeError);
    }

    // Get total rooms count
    const { count: totalRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId);

    if (roomsError) {
      console.error('Error fetching rooms count:', roomsError);
    }

    // Get bookings with time data for utilization and popular times calculation
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        start_time,
        end_time,
        status
      `)
      .in('room_id', roomIds)
      .eq('status', 'confirmed')
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (bookingsError) {
      console.error('Error fetching bookings data:', bookingsError);
    }

    // Calculate utilization rate and popular times
    let utilizationRate = 0;
    const popularTimes: { [hour: number]: number } = {};

    if (bookingsData && bookingsData.length > 0) {
      let totalBookedHours = 0;
      
      bookingsData.forEach(booking => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
        
        totalBookedHours += duration;
        
        // Track popular hours
        const hour = start.getHours();
        popularTimes[hour] = (popularTimes[hour] || 0) + 1;
      });

      // Calculate utilization rate (assuming 8 hours per day, 30 days, for all rooms)
      const totalAvailableHours = (totalRooms || 1) * 8 * 30;
      utilizationRate = totalAvailableHours > 0 ? (totalBookedHours / totalAvailableHours) * 100 : 0;
    }

    // Convert popular times to array and sort
    const popularTimesArray = Object.entries(popularTimes)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalBookings: totalBookings || 0,
      currentMonthBookings: currentMonthBookings || 0,
      activeBookings: activeBookings || 0,
      totalRooms: totalRooms || 0,
      utilizationRate: Math.min(utilizationRate, 100), // Cap at 100%
      popularTimes: popularTimesArray,
    };
  } catch (error) {
    console.error('Error fetching facility booking stats:', error);
    // Return default stats on error
    return {
      totalBookings: 0,
      currentMonthBookings: 0,
      activeBookings: 0,
      totalRooms: 0,
      utilizationRate: 0,
      popularTimes: [],
    };
  }
}

/**
 * Fetches recent activity logs for a specific facility
 * @param facilityId The facility ID to get activity for
 * @param limit Number of activity items to return (default: 20)
 * @returns Promise with recent activity logs
 */
export async function getFacilityRecentActivity(
  facilityId: string, 
  limit = 20
): Promise<ActivityLog[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activities: ActivityLog[] = [];

    // First get room IDs for this facility
    const { data: facilityRooms, error: roomsQueryError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('facility_id', facilityId);

    if (roomsQueryError) {
      console.error('Error fetching facility rooms for activity:', roomsQueryError);
      return [];
    }

    const roomIds = facilityRooms?.map(room => room.id) || [];
    const roomNameMap = new Map(facilityRooms?.map(room => [room.id, room.name]) || []);

    if (roomIds.length === 0) {
      return [];
    }

    // Get recent bookings (created and cancelled)
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        room_id,
        user_id,
        users(name, email)
      `)
      .in('room_id', roomIds)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!bookingsError && recentBookings) {
      recentBookings.forEach(booking => {
        const roomName = roomNameMap.get(booking.room_id) || 'Unknown Room';
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking_created',
          title: 'New Booking Created',
          description: `${booking.title} in ${roomName}`,
          timestamp: booking.created_at,
          user: booking.users ? { name: booking.users.name, email: booking.users.email } : undefined,
        });
      });
    }

    // Get recent room additions/updates
    const { data: recentRooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        facility_id
      `)
      .eq('facility_id', facilityId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!roomsError && recentRooms) {
      recentRooms.forEach(room => {
        activities.push({
          id: `room-${room.id}`,
          type: 'room_added',
          title: 'New Room Added',
          description: `Room "${room.name}" was added to the facility`,
          timestamp: room.created_at,
        });
      });
    }

    // Get facility updates (manager changes, etc.)
    const { data: facilityUpdates, error: facilityError } = await supabase
      .from('facilities')
      .select(`
        id,
        name,
        updated_at,
        manager_id,
        facility_manager:manager_id(name, email)
      `)
      .eq('id', facilityId)
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (!facilityError && facilityUpdates && facilityUpdates.length > 0) {
      facilityUpdates.forEach(facility => {
        activities.push({
          id: `facility-${facility.id}-${facility.updated_at}`,
          type: 'manager_changed',
          title: 'Facility Updated',
          description: `Facility details or manager assignment was updated`,
          timestamp: facility.updated_at,
        });
      });
    }

    // Sort all activities by timestamp (newest first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching facility recent activity:', error);
    return [];
  }
}

/**
 * Exports facility data as CSV format
 * @param facilityId The facility ID to export data for
 * @returns Promise with CSV string
 */
export async function exportFacilityData(facilityId: string): Promise<string> {
  try {
    // Get facility details
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select(`
        *,
        facility_manager:manager_id(name, email)
      `)
      .eq('id', facilityId)
      .single();

    if (facilityError) throw facilityError;

    // Get rooms data
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('facility_id', facilityId);

    if (roomsError) throw roomsError;

    // Get room IDs for this facility first
    const { data: facilityRooms, error: roomsQueryError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('facility_id', facilityId);

    if (roomsQueryError) throw roomsQueryError;

    const roomIds = facilityRooms?.map(room => room.id) || [];

    // Get bookings data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        users(name, email)
      `)
      .in('room_id', roomIds);

    if (bookingsError) throw bookingsError;

    // Create CSV content
    let csv = 'Facility Export Report\n\n';
    
    // Facility information
    csv += 'Facility Information\n';
    csv += 'Name,Location,Description,Status,Manager,Created\n';
    csv += `"${facility.name}","${facility.location || ''}","${facility.description || ''}","${facility.status}","${facility.facility_manager?.name || 'None'}","${facility.created_at}"\n\n`;
    
    // Rooms information
    csv += 'Rooms\n';
    csv += 'Name,Capacity,Status,Description,Created\n';
    rooms?.forEach(room => {
      csv += `"${room.name}","${room.capacity}","${room.status}","${room.description || ''}","${room.created_at}"\n`;
    });
    
    csv += '\n';
    
    // Create room name map for bookings
    const roomNameMap = new Map(facilityRooms?.map(room => [room.id, room.name]) || []);

    // Bookings information
    csv += 'Recent Bookings\n';
    csv += 'Title,Room,User,Start Time,End Time,Status,Created\n';
    bookings?.forEach(booking => {
      const roomName = roomNameMap.get(booking.room_id) || 'Unknown Room';
      csv += `"${booking.title}","${roomName}","${booking.users?.name || ''}","${booking.start_time}","${booking.end_time}","${booking.status}","${booking.created_at}"\n`;
    });

    return csv;
  } catch (error) {
    console.error('Error exporting facility data:', error);
    throw error;
  }
}
