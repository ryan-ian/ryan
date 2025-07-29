import { supabase } from './supabase';

// Types
export interface SystemStats {
  totalUsers: number;
  totalFacilities: number;
  activeBookings: number;
}

export interface ActivityItem {
  id: string;
  type: 'user_signup' | 'facility_added' | 'booking_created' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
}

export interface BookingTrend {
  name: string; // Month or date
  bookings: number;
}

export interface UserGrowth {
  name: string; // Month or date
  users: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'facility_manager' | 'admin';
  status: 'active' | 'inactive';
  department?: string;
  position?: string;
  date_created: string;
  last_login?: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role: 'user' | 'facility_manager' | 'admin';
  status: 'active' | 'inactive';
  department?: string;
  position?: string;
  password?: string; // Only for new users
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  location?: string;
  created_at: string;
  facility_manager_id?: string;
  facility_manager?: User;
}

export interface FacilityFormData {
  name: string;
  description?: string;
  location?: string;
  facility_manager_id?: string;
}

/**
 * Fetches system statistics for the admin dashboard
 * @returns Promise with system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    // Get total users
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;

    // Get total facilities
    const { count: facilityCount, error: facilityError } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true });
    
    if (facilityError) throw facilityError;

    // Get active bookings (bookings with end_time > current time)
    const { count: bookingCount, error: bookingError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gt('end_time', new Date().toISOString());
    
    if (bookingError) throw bookingError;

    return {
      totalUsers: userCount || 0,
      totalFacilities: facilityCount || 0,
      activeBookings: bookingCount || 0,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
}

/**
 * Fetches recent activity for the admin dashboard
 * @param limit Number of activity items to fetch
 * @returns Promise with activity items
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  try {
    // In a real implementation, you might have a dedicated activities table
    // For now, we'll combine data from multiple tables to create an activity feed

    // Get recent user signups
    const { data: recentUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, name, date_created')
      .order('date_created', { ascending: false })
      .limit(limit);
    
    if (userError) throw userError;

    // Get recent facility additions
    const { data: recentFacilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (facilityError) throw facilityError;

    // Get recent bookings
    const { data: recentBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, room_id, user_id, start_time, title, rooms(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (bookingError) throw bookingError;

    // Combine and transform the data into activity items
    const activities: ActivityItem[] = [
      // Transform user signups to activity items
      ...(recentUsers?.map(user => ({
        id: `user-${user.id}`,
        type: 'user_signup' as const,
        title: 'New User Registration',
        description: `${user.name} (${user.email}) registered as a new user`,
        timestamp: user.date_created,
      })) || []),

      // Transform facility additions to activity items
      ...(recentFacilities?.map(facility => ({
        id: `facility-${facility.id}`,
        type: 'facility_added' as const,
        title: 'New Facility Added',
        description: `${facility.name} was added to the system`,
        timestamp: facility.created_at,
      })) || []),

      // Transform bookings to activity items
      ...(recentBookings?.map(booking => ({
        id: `booking-${booking.id}`,
        type: 'booking_created' as const,
        title: 'New Booking Created',
        description: `${booking.rooms?.name} booked for ${booking.title}`,
        timestamp: booking.start_time,
      })) || []),
    ];

    // Sort by timestamp (newest first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

/**
 * Fetches booking trends data for the admin dashboard
 * @param period 'month' or 'day' to determine grouping
 * @param limit Number of data points to return
 * @returns Promise with booking trend data
 */
export async function getBookingTrends(
  period: 'month' | 'day' = 'month',
  limit = 12
): Promise<BookingTrend[]> {
  try {
    // This would typically be a complex database query with aggregation
    // For now, we'll return mock data
    // In a real implementation, you would use SQL functions like date_trunc to group by month/day

    // Example of how you might implement this with Supabase
    // const { data, error } = await supabase.rpc('get_booking_trends', { 
    //   p_period: period,
    //   p_limit: limit
    // });

    // if (error) throw error;
    // return data;

    // Mock data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mockData: BookingTrend[] = months.map(month => ({
      name: month,
      bookings: Math.floor(Math.random() * 100) + 20,
    }));

    return mockData.slice(0, limit);
  } catch (error) {
    console.error('Error fetching booking trends:', error);
    throw error;
  }
}

/**
 * Fetches user growth data for the admin dashboard
 * @param period 'month' or 'day' to determine grouping
 * @param limit Number of data points to return
 * @returns Promise with user growth data
 */
export async function getUserGrowth(
  period: 'month' | 'day' = 'month',
  limit = 12
): Promise<UserGrowth[]> {
  try {
    // Similar to booking trends, this would be a complex database query
    // For now, we'll return mock data

    // Example implementation with Supabase
    // const { data, error } = await supabase.rpc('get_user_growth', { 
    //   p_period: period,
    //   p_limit: limit
    // });

    // if (error) throw error;
    // return data;

    // Mock data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let userCount = 10;
    const mockData: UserGrowth[] = months.map(month => {
      const growth = Math.floor(Math.random() * 10) + 5;
      userCount += growth;
      return {
        name: month,
        users: userCount,
      };
    });

    return mockData.slice(0, limit);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    throw error;
  }
}

/**
 * Fetches all users with pagination and filtering
 * @param page Page number (1-indexed)
 * @param pageSize Number of users per page
 * @param searchQuery Optional search query to filter users by name or email
 * @param roleFilter Optional role filter
 * @returns Promise with users and total count
 */
export async function getUsers(
  page = 1, 
  pageSize = 10, 
  searchQuery?: string,
  roleFilter?: 'user' | 'facility_manager' | 'admin'
): Promise<{ users: User[], totalCount: number }> {
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    
    // Apply role filter if provided
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await query
      .order('date_created', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return {
      users: data as User[],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Fetches a user by ID
 * @param userId User ID to fetch
 * @returns Promise with user or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        return null;
      }
      throw error;
    }
    
    return data as User;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

/**
 * Creates a new user
 * @param userData User data to create
 * @returns Promise with created user
 */
export async function createUser(userData: UserFormData): Promise<User> {
  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || Math.random().toString(36).slice(-8), // Generate random password if not provided
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: userData.name,
        department: userData.department,
        position: userData.position,
      },
    });
    
    if (authError) throw authError;
    
    // The user profile should be created automatically via a trigger,
    // but we need to update the role and status
    const { data, error } = await supabase
      .from('users')
      .update({
        role: userData.role,
        status: userData.status,
        department: userData.department,
        position: userData.position,
      })
      .eq('id', authData.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as User;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Updates an existing user
 * @param userId User ID to update
 * @param userData User data to update
 * @returns Promise with updated user
 */
export async function updateUser(userId: string, userData: Partial<UserFormData>): Promise<User> {
  try {
    // Update auth user email if provided
    if (userData.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: userData.email }
      );
      
      if (authError) throw authError;
    }
    
    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        role: userData.role,
        status: userData.status,
        department: userData.department,
        position: userData.position,
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as User;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
}

/**
 * Updates a user's password
 * @param userId User ID to update
 * @param newPassword New password
 * @returns Promise<void>
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error updating password for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Activates or deactivates a user
 * @param userId User ID to update
 * @param isActive Whether the user should be active
 * @returns Promise with updated user
 */
export async function setUserActiveStatus(userId: string, isActive: boolean): Promise<User> {
  try {
    // Update user status in the database
    const { data, error } = await supabase
      .from('users')
      .update({
        status: isActive ? 'active' : 'inactive'
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as User;
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Fetches facility managers who are not assigned to any facility
 * @returns Promise with available facility managers
 */
export async function getAvailableFacilityManagers(): Promise<User[]> {
  try {
    // Get facility managers
    const { data: managers, error: managersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'facility_manager')
      .eq('status', 'active');
    
    if (managersError) throw managersError;
    
    // Get facility managers who are already assigned to facilities
    const { data: assignedManagers, error: assignedError } = await supabase
      .from('facilities')
      .select('facility_manager_id')
      .not('facility_manager_id', 'is', null);
    
    if (assignedError) throw assignedError;
    
    // Filter out managers who are already assigned
    const assignedManagerIds = assignedManagers.map(f => f.facility_manager_id);
    const availableManagers = managers.filter(m => !assignedManagerIds.includes(m.id));
    
    return availableManagers as User[];
  } catch (error) {
    console.error('Error fetching available facility managers:', error);
    throw error;
  }
}

/**
 * Fetches all facilities with pagination and filtering
 * @param page Page number (1-indexed)
 * @param pageSize Number of facilities per page
 * @param searchQuery Optional search query to filter facilities by name or location
 * @returns Promise with facilities and total count
 */
export async function getFacilities(
  page = 1, 
  pageSize = 10, 
  searchQuery?: string
): Promise<{ facilities: Facility[], totalCount: number }> {
  try {
    let query = supabase
      .from('facilities')
      .select(`
        *,
        facility_manager:facility_manager_id(id, name, email)
      `, { count: 'exact' });
    
    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return {
      facilities: data as Facility[],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
}

/**
 * Fetches a facility by ID
 * @param facilityId Facility ID to fetch
 * @returns Promise with facility or null if not found
 */
export async function getFacilityById(facilityId: string): Promise<Facility | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        facility_manager:facility_manager_id(id, name, email)
      `)
      .eq('id', facilityId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        return null;
      }
      throw error;
    }
    
    return data as Facility;
  } catch (error) {
    console.error(`Error fetching facility ${facilityId}:`, error);
    throw error;
  }
}

/**
 * Creates a new facility
 * @param facilityData Facility data to create
 * @returns Promise with created facility
 */
export async function createFacility(facilityData: FacilityFormData): Promise<Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name: facilityData.name,
        description: facilityData.description,
        location: facilityData.location,
        facility_manager_id: facilityData.facility_manager_id,
      })
      .select(`
        *,
        facility_manager:facility_manager_id(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    
    return data as Facility;
  } catch (error) {
    console.error('Error creating facility:', error);
    throw error;
  }
}

/**
 * Updates an existing facility
 * @param facilityId Facility ID to update
 * @param facilityData Facility data to update
 * @returns Promise with updated facility
 */
export async function updateFacility(facilityId: string, facilityData: Partial<FacilityFormData>): Promise<Facility> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .update({
        name: facilityData.name,
        description: facilityData.description,
        location: facilityData.location,
        facility_manager_id: facilityData.facility_manager_id,
      })
      .eq('id', facilityId)
      .select(`
        *,
        facility_manager:facility_manager_id(id, name, email)
      `)
      .single();
    
    if (error) throw error;
    
    return data as Facility;
  } catch (error) {
    console.error(`Error updating facility ${facilityId}:`, error);
    throw error;
  }
}

/**
 * Deletes a facility
 * @param facilityId Facility ID to delete
 * @returns Promise<void>
 */
export async function deleteFacility(facilityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', facilityId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting facility ${facilityId}:`, error);
    throw error;
  }
} 