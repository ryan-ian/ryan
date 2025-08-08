import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  getAllBookingsByFacilityManager, 
  getRoomsByFacilityManager,
  getResourcesByFacility,
  getFacilitiesByManager
} from '@/lib/supabase-data';
import type { BookingWithDetails, Room, Resource, Facility } from '@/types';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getDay, addDays, subDays, subMonths } from 'date-fns';

// Define the date range options
export type DateRangeOption = '7days' | '30days' | '90days' | 'custom';

// Define the report data structure
export interface ReportData {
  // KPIs
  totalBookings: number;
  utilizationRate: number;
  busiestDay: string | null;
  peakHour: string | null;
  averageBookingDuration: number; // in minutes
  
  // Room utilization
  roomUtilization: {
    roomId: string;
    roomName: string;
    totalBookings: number;
    totalHours: number;
    utilization: number;
  }[];
  
  // Booking trends
  bookingsByDay: {
    day: string;
    count: number;
  }[];
  bookingsByDepartment: {
    department: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    userName: string;
    bookingCount: number;
  }[];
  bookingLeadTimes: {
    range: string;
    count: number;
  }[];
  
  // Resource management
  resourceDemand: {
    resourceId: string;
    resourceName: string;
    count: number;
  }[];
  resourceStatus: {
    available: number;
    inUse: number;
    maintenance: number;
  };
  
  // Raw data for exports
  rawBookings: BookingWithDetails[];
  rawRooms: Room[];
  rawResources: Resource[];
}

// Define the hook return type
export interface UseReportsResult {
  isLoading: boolean;
  error: string | null;
  reportData: ReportData | null;
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  customStartDate: Date | null;
  setCustomStartDate: (date: Date | null) => void;
  customEndDate: Date | null;
  setCustomEndDate: (date: Date | null) => void;
  facility: Facility | null;
  refreshData: () => Promise<void>;
}

// Create a utility function to calculate date range
function getDateRangeFromOption(option: DateRangeOption, customStart?: Date | null, customEnd?: Date | null): { startDate: Date, endDate: Date } {
  const today = new Date();
  
  switch (option) {
    case '7days':
      return {
        startDate: subDays(today, 7),
        endDate: today
      };
    case '30days':
      return {
        startDate: subDays(today, 30),
        endDate: today
      };
    case '90days':
      return {
        startDate: subDays(today, 90),
        endDate: today
      };
    case 'custom':
      if (customStart && customEnd) {
        return {
          startDate: customStart,
          endDate: customEnd
        };
      }
      // Default to last 30 days if custom dates aren't provided
      return {
        startDate: subDays(today, 30),
        endDate: today
      };
  }
}

// Utility function to calculate booking duration in minutes
function calculateBookingDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60); // Convert milliseconds to minutes
}

// Utility function to get hour from date string
function getHourFromDateString(dateString: string): number {
  return new Date(dateString).getHours();
}

export function useFacilityManagerReports(): UseReportsResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30days');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  // Function to load data
  const loadReportData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the facility managed by the user
      console.log(`🏢 [Reports] Loading facilities for user: ${user.id} (role: ${user.role})`);

      let facilities;
      if (user.role === 'admin') {
        // Admins can access all facilities
        console.log(`🏢 [Reports] User is admin, loading all facilities`);
        const { getFacilities } = await import('@/lib/supabase-data');
        facilities = await getFacilities();
      } else {
        // Facility managers only see their assigned facilities
        facilities = await getFacilitiesByManager(user.id);
      }

      console.log(`🏢 [Reports] Found ${facilities.length} facilities:`, facilities);

      if (facilities.length === 0) {
        console.log(`⚠️ [Reports] No facilities found for user ${user.id}`);
        setError("no_facility");
        setIsLoading(false);
        return;
      }
      
      const managedFacility = facilities[0]; // Assuming a manager manages one facility
      console.log(`🏢 [Reports] Using facility:`, managedFacility);
      setFacility(managedFacility);

      // Get all rooms for this facility
      console.log(`🏠 [Reports] Loading rooms for facility: ${managedFacility.id}`);
      let roomsData;
      if (user.role === 'admin') {
        // For admins, get all rooms in the facility directly
        console.log(`🏠 [Reports] Admin user - getting all rooms for facility ${managedFacility.id}`);
        const { supabase } = await import('@/lib/supabase');
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select(`
            *,
            facilities!facility_id(id, name, location)
          `)
          .eq('facility_id', managedFacility.id);

        if (roomsError) {
          console.error('Error fetching rooms for admin:', roomsError);
          throw roomsError;
        }

        // Normalize the room data to match the expected format
        roomsData = (rooms || []).map(room => ({
          ...room,
          facility: room.facilities ? {
            id: room.facilities.id,
            name: room.facilities.name,
            location: room.facilities.location
          } : null
        }));
      } else {
        // Facility managers use the existing function
        roomsData = await getRoomsByFacilityManager(user.id);
      }
      console.log(`🏠 [Reports] Found ${roomsData.length} rooms:`, roomsData);
      setRooms(roomsData);

      // Get all resources for this facility
      console.log(`🔧 [Reports] Loading resources for facility: ${managedFacility.id}`);
      const resourcesData = await getResourcesByFacility(managedFacility.id);
      console.log(`🔧 [Reports] Found ${resourcesData.length} resources:`, resourcesData);
      setResources(resourcesData);

      // Get all bookings for rooms in this facility
      console.log(`📅 [Reports] Loading bookings for facility: ${managedFacility.id}`);
      let bookingsData;
      if (user.role === 'admin') {
        // For admins, get all bookings for rooms in this facility
        console.log(`📅 [Reports] Admin user - getting all bookings for facility ${managedFacility.id}`);
        const roomIds = roomsData.map(room => room.id);
        console.log(`📅 [Reports] Room IDs to query: ${roomIds.length} rooms`);

        if (roomIds.length > 0) {
          const { supabase } = await import('@/lib/supabase');
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              *,
              rooms:room_id(id, name, location, capacity, facility_id),
              users:user_id(id, name, email, department)
            `)
            .in('room_id', roomIds)
            .order('start_time', { ascending: false });

          if (bookingsError) {
            console.error('Error fetching bookings for admin:', bookingsError);
            throw bookingsError;
          }

          bookingsData = bookings || [];
        } else {
          console.log(`📅 [Reports] No rooms found, no bookings to fetch`);
          bookingsData = [];
        }
      } else {
        // Facility managers use the existing function
        bookingsData = await getAllBookingsByFacilityManager(user.id);
      }
      console.log(`📅 [Reports] Found ${bookingsData.length} bookings:`, bookingsData);
      setBookings(bookingsData);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Load data on component mount or when user changes
  useEffect(() => {
    loadReportData();
  }, [user]);
  
  // Filter bookings based on selected date range
  const filteredBookings = useMemo(() => {
    if (!bookings.length) {
      console.log(`📊 [Reports] No bookings to filter`);
      return [];
    }

    const { startDate, endDate } = getDateRangeFromOption(dateRange, customStartDate, customEndDate);
    console.log(`📊 [Reports] Filtering ${bookings.length} bookings for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Log booking statuses for debugging
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📊 [Reports] Booking status counts:`, statusCounts);

    const filtered = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time);
      const inRange = bookingDate >= startDate && bookingDate <= endDate;
      if (!inRange) {
        console.log(`📊 [Reports] Booking "${booking.title}" (${booking.status}) outside date range: ${bookingDate.toISOString()}`);
      }
      return inRange;
    });

    console.log(`📊 [Reports] Filtered to ${filtered.length} bookings in date range`);

    // Log filtered booking statuses
    const filteredStatusCounts = filtered.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📊 [Reports] Filtered booking status counts:`, filteredStatusCounts);

    return filtered;
  }, [bookings, dateRange, customStartDate, customEndDate]);
  
  // Calculate report data based on filtered bookings
  const reportData = useMemo((): ReportData | null => {
    console.log(`📊 [Reports] Calculating report data...`);
    console.log(`📊 [Reports] Filtered bookings: ${filteredBookings.length}`);
    console.log(`📊 [Reports] Rooms: ${rooms.length}`);

    if (!filteredBookings.length || !rooms.length) {
      console.log(`📊 [Reports] No data available - bookings: ${filteredBookings.length}, rooms: ${rooms.length}`);
      return null;
    }
    
    // Calculate KPIs
    const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
    const totalBookings = confirmedBookings.length;

    console.log(`📊 [Reports] Processing ${filteredBookings.length} filtered bookings`);
    console.log(`📊 [Reports] Found ${confirmedBookings.length} confirmed bookings`);

    // Log some sample confirmed bookings for debugging
    if (confirmedBookings.length > 0) {
      console.log(`📊 [Reports] Sample confirmed bookings:`, confirmedBookings.slice(0, 3).map(b => ({
        id: b.id,
        title: b.title,
        status: b.status,
        start_time: b.start_time,
        room: b.rooms?.name
      })));
    } else {
      console.log(`📊 [Reports] No confirmed bookings found. All bookings:`, filteredBookings.map(b => ({
        id: b.id,
        title: b.title,
        status: b.status,
        start_time: b.start_time,
        room: b.rooms?.name
      })));
    }
    
    // Calculate average booking duration
    const totalDuration = confirmedBookings.reduce((sum, booking) => {
      return sum + calculateBookingDuration(booking.start_time, booking.end_time);
    }, 0);
    const averageBookingDuration = totalBookings > 0 ? Math.round(totalDuration / totalBookings) : 0;
    
    // Calculate busiest day
    const bookingsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    confirmedBookings.forEach(booking => {
      const dayOfWeek = new Date(booking.start_time).getDay();
      bookingsByDayOfWeek[dayOfWeek]++;
    });
    
    const busiestDayIndex = bookingsByDayOfWeek.indexOf(Math.max(...bookingsByDayOfWeek));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDay = bookingsByDayOfWeek.every(count => count === 0) ? null : dayNames[busiestDayIndex];
    
    // Calculate peak hour
    const bookingsByHour = Array(24).fill(0);
    confirmedBookings.forEach(booking => {
      const hour = getHourFromDateString(booking.start_time);
      bookingsByHour[hour]++;
    });
    
    const peakHourIndex = bookingsByHour.indexOf(Math.max(...bookingsByHour));
    const peakHour = bookingsByHour.every(count => count === 0) 
      ? null 
      : `${peakHourIndex % 12 === 0 ? 12 : peakHourIndex % 12}${peakHourIndex < 12 ? 'AM' : 'PM'}`;
    
    // Calculate room utilization
    const roomUtilization = rooms.map(room => {
      const roomBookings = confirmedBookings.filter(b => b.room_id === room.id);
      const totalHours = roomBookings.reduce((sum, booking) => {
        return sum + (calculateBookingDuration(booking.start_time, booking.end_time) / 60);
      }, 0);
      
      // Assuming 8 working hours per day for the date range
      const { startDate, endDate } = getDateRangeFromOption(dateRange, customStartDate, customEndDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPossibleHours = daysDiff * 8;
      
      return {
        roomId: room.id,
        roomName: room.name,
        totalBookings: roomBookings.length,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
        utilization: totalPossibleHours > 0 ? Math.round((totalHours / totalPossibleHours) * 100) : 0
      };
    });
    
    // Calculate overall utilization rate
    const totalBookedHours = roomUtilization.reduce((sum, room) => sum + room.totalHours, 0);
    const totalPossibleHours = roomUtilization.length * 8 * Math.ceil(
      (getDateRangeFromOption(dateRange, customStartDate, customEndDate).endDate.getTime() - 
       getDateRangeFromOption(dateRange, customStartDate, customEndDate).startDate.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const utilizationRate = totalPossibleHours > 0 ? Math.round((totalBookedHours / totalPossibleHours) * 100) : 0;
    
    // Calculate bookings by day
    const { startDate, endDate } = getDateRangeFromOption(dateRange, customStartDate, customEndDate);
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const bookingsByDay = daysInRange.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const count = confirmedBookings.filter(b => 
        format(new Date(b.start_time), 'yyyy-MM-dd') === dayString
      ).length;
      
      return {
        day: format(day, 'MMM dd'),
        count
      };
    });
    
    // Calculate bookings by department
    const departmentCounts: Record<string, number> = {};
    confirmedBookings.forEach(booking => {
      // Get the user's department - we need to fetch this separately since it's not in the BookingWithDetails type
      // For now, we'll just use a placeholder or user name
      const department = booking.users?.name?.split(' ')[0] || 'Unknown';
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });
    
    const bookingsByDepartment = Object.entries(departmentCounts).map(([department, count]) => ({
      department,
      count
    })).sort((a, b) => b.count - a.count);
    
    // Calculate top users
    const userCounts: Record<string, { count: number, name: string }> = {};
    confirmedBookings.forEach(booking => {
      const userId = booking.user_id;
      const userName = booking.users?.name || 'Unknown User';
      if (!userCounts[userId]) {
        userCounts[userId] = { count: 0, name: userName };
      }
      userCounts[userId].count++;
    });
    
    const topUsers = Object.entries(userCounts)
      .map(([userId, { count, name }]) => ({
        userId,
        userName: name,
        bookingCount: count
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
    
    // Calculate booking lead times
    const bookingLeadTimes = [
      { range: 'Same day', count: 0 },
      { range: '1-2 days', count: 0 },
      { range: '3-7 days', count: 0 },
      { range: '1-2 weeks', count: 0 },
      { range: '2+ weeks', count: 0 }
    ];
    
    confirmedBookings.forEach(booking => {
      const createdDate = new Date(booking.created_at);
      const bookingDate = new Date(booking.start_time);
      const leadTimeDays = Math.floor((bookingDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (leadTimeDays === 0) {
        bookingLeadTimes[0].count++;
      } else if (leadTimeDays <= 2) {
        bookingLeadTimes[1].count++;
      } else if (leadTimeDays <= 7) {
        bookingLeadTimes[2].count++;
      } else if (leadTimeDays <= 14) {
        bookingLeadTimes[3].count++;
      } else {
        bookingLeadTimes[4].count++;
      }
    });
    
    // Resource demand calculation removed as per requirements
    
    // Calculate resource status
    const resourceStatus = {
      available: resources.filter(r => r.status === 'available').length,
      inUse: resources.filter(r => r.status === 'in-use').length,
      maintenance: resources.filter(r => r.status === 'maintenance').length
    };
    
    return {
      totalBookings,
      utilizationRate,
      busiestDay,
      peakHour,
      averageBookingDuration,
      roomUtilization,
      bookingsByDay,
      bookingsByDepartment,
      topUsers,
      bookingLeadTimes,
      resourceStatus,
      rawBookings: filteredBookings,
      rawRooms: rooms,
      rawResources: resources
    };
  }, [filteredBookings, rooms, resources, dateRange, customStartDate, customEndDate]);
  
  return {
    isLoading,
    error,
    reportData,
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    facility,
    refreshData: loadReportData
  };
}