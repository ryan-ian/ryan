import { supabase, createAdminClient } from './supabase';

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
  status: 'active' | 'inactive' | 'suspended' | 'locked';
  organization: string;
  position?: string;
  phone?: string;
  profile_image?: string;
  date_created: string;
  last_login?: string;
  suspended_until?: string;
  suspension_reason?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role: 'user' | 'facility_manager' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'locked';
  organization?: string;
  position?: string;
  phone?: string;
  password?: string; // Only for new users
  suspension_reason?: string;
  suspended_until?: string;
}

export interface UserAuditLog {
  id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated' | 'suspended' | 'locked' | 'unlocked' | 'role_changed' | 'password_reset';
  details: Record<string, any>;
  performed_by: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface BulkUserOperation {
  action: 'activate' | 'deactivate' | 'suspend' | 'delete' | 'change_role';
  user_ids: string[];
  parameters?: Record<string, any>;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  location: string;
  created_at: string;
  updated_at: string;
  manager_id?: string;
  facility_manager?: User;
}

export interface FacilityFormData {
  name: string;
  description?: string;
  location?: string;
  manager_id?: string;
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
    // Get the date range for the query
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - limit);
    } else {
      startDate.setDate(endDate.getDate() - limit);
    }

    // Fetch bookings within the date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group bookings by period
    const groupedData: { [key: string]: number } = {};

    bookings?.forEach(booking => {
      const date = new Date(booking.created_at);
      let key: string;

      if (period === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    // Convert to array format expected by the chart
    const result: BookingTrend[] = Object.entries(groupedData).map(([name, bookings]) => ({
      name,
      bookings,
    }));

    // If no data, return empty array with proper structure
    if (result.length === 0) {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return [{ name: currentMonth, bookings: 0 }];
    }

    return result.slice(-limit); // Return the most recent data points
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
    // Get the date range for the query
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - limit);
    } else {
      startDate.setDate(endDate.getDate() - limit);
    }

    // Fetch users within the date range
    const { data: users, error } = await supabase
      .from('users')
      .select('date_created')
      .gte('date_created', startDate.toISOString())
      .lte('date_created', endDate.toISOString())
      .order('date_created', { ascending: true });

    if (error) throw error;

    // Group users by period and calculate cumulative growth
    const groupedData: { [key: string]: number } = {};

    users?.forEach(user => {
      const date = new Date(user.date_created);
      let key: string;

      if (period === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    // Get total users count for cumulative calculation
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Convert to array format with cumulative growth
    let cumulativeUsers = (totalUsers || 0) - (users?.length || 0);
    const result: UserGrowth[] = Object.entries(groupedData).map(([name, newUsers]) => {
      cumulativeUsers += newUsers;
      return {
        name,
        users: cumulativeUsers,
      };
    });

    // If no data, return current user count
    if (result.length === 0) {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return [{ name: currentMonth, users: totalUsers || 0 }];
    }

    return result.slice(-limit); // Return the most recent data points
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
        organization: userData.organization,
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
        organization: userData.organization,
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
        organization: userData.organization,
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
    // Use admin client to access all user data
    const adminClient = createAdminClient();

    // Get facility managers
    const { data: managers, error: managersError } = await adminClient
      .from('users')
      .select('*')
      .eq('role', 'facility_manager')
      .eq('status', 'active');

    if (managersError) throw managersError;

    // Get facility managers who are already assigned to facilities
    const { data: assignedManagers, error: assignedError } = await adminClient
      .from('facilities')
      .select('manager_id')
      .not('manager_id', 'is', null);

    if (assignedError) throw assignedError;

    // Filter out managers who are already assigned
    const assignedManagerIds = assignedManagers.map(f => f.manager_id);
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
    // Use admin client to ensure we can access all facility data
    const adminClient = createAdminClient();
    let query = adminClient
      .from('facilities')
      .select(`
        *,
        facility_manager:manager_id(id, name, email)
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
    // Use admin client to ensure we can access all facility data
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('facilities')
      .select(`
        *,
        facility_manager:manager_id(id, name, email)
      `)
      .eq('id', facilityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        return null;
      }
      console.error(`Error fetching facility ${facilityId}:`, error);
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
    // Use admin client to ensure we can create facilities
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('facilities')
      .insert({
        name: facilityData.name,
        description: facilityData.description,
        location: facilityData.location,
        manager_id: facilityData.manager_id,
      })
      .select(`
        *,
        facility_manager:manager_id(id, name, email)
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
    // Use admin client to ensure we can update facilities
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('facilities')
      .update({
        name: facilityData.name,
        description: facilityData.description,
        location: facilityData.location,
        manager_id: facilityData.manager_id,
      })
      .eq('id', facilityId)
      .select(`
        *,
        facility_manager:manager_id(id, name, email)
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

// ============================================================================
// ENHANCED USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Deletes a user account (soft delete by setting status to deleted)
 * @param userId User ID to delete
 * @param performedBy ID of the admin performing the action
 * @returns Promise<void>
 */
export async function deleteUser(userId: string, performedBy: string): Promise<void> {
  try {
    // First, check if user exists and get their current data for audit log
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by updating status to 'inactive' and adding deletion metadata
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Disable the auth user
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { ban_duration: 'none' } // Permanently ban
    );

    if (authError) throw authError;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'deleted',
      details: {
        previous_status: user.status,
        user_email: user.email,
        user_name: user.name,
      },
      performed_by: performedBy,
    });

  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}

/**
 * Suspends a user for a specified duration
 * @param userId User ID to suspend
 * @param suspendedUntil Date until which the user is suspended
 * @param reason Reason for suspension
 * @param performedBy ID of the admin performing the action
 * @returns Promise with updated user
 */
export async function suspendUser(
  userId: string,
  suspendedUntil: string,
  reason: string,
  performedBy: string
): Promise<User> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Use admin client to bypass RLS policies
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .update({
        status: 'suspended',
        suspended_until: suspendedUntil,
        suspension_reason: reason,
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'suspended',
      details: {
        previous_status: user.status,
        suspended_until: suspendedUntil,
        reason: reason,
      },
      performed_by: performedBy,
    });

    return data as User;
  } catch (error) {
    console.error(`Error suspending user ${userId}:`, error);
    throw error;
  }
}

/**
 * Unsuspends a user
 * @param userId User ID to unsuspend
 * @param performedBy ID of the admin performing the action
 * @returns Promise with updated user
 */
export async function unsuspendUser(userId: string, performedBy: string): Promise<User> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Use admin client to bypass RLS policies
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .update({
        status: 'active',
        suspended_until: null,
        suspension_reason: null,
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'activated',
      details: {
        previous_status: user.status,
        action_type: 'unsuspended',
      },
      performed_by: performedBy,
    });

    return data as User;
  } catch (error) {
    console.error(`Error unsuspending user ${userId}:`, error);
    throw error;
  }
}

/**
 * Locks a user account
 * @param userId User ID to lock
 * @param lockedUntil Date until which the user is locked (optional, permanent if not provided)
 * @param performedBy ID of the admin performing the action
 * @returns Promise with updated user
 */
export async function lockUser(userId: string, lockedUntil: string | null, performedBy: string): Promise<User> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'locked',
        locked_until: lockedUntil,
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'locked',
      details: {
        previous_status: user.status,
        locked_until: lockedUntil,
      },
      performed_by: performedBy,
    });

    return data as User;
  } catch (error) {
    console.error(`Error locking user ${userId}:`, error);
    throw error;
  }
}

/**
 * Unlocks a user account
 * @param userId User ID to unlock
 * @param performedBy ID of the admin performing the action
 * @returns Promise with updated user
 */
export async function unlockUser(userId: string, performedBy: string): Promise<User> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        locked_until: null,
        failed_login_attempts: 0,
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'unlocked',
      details: {
        previous_status: user.status,
      },
      performed_by: performedBy,
    });

    return data as User;
  } catch (error) {
    console.error(`Error unlocking user ${userId}:`, error);
    throw error;
  }
}

/**
 * Changes a user's role
 * @param userId User ID to update
 * @param newRole New role to assign
 * @param performedBy ID of the admin performing the action
 * @returns Promise with updated user
 */
export async function changeUserRole(
  userId: string,
  newRole: 'user' | 'facility_manager' | 'admin',
  performedBy: string
): Promise<User> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_by: performedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logUserAction({
      user_id: userId,
      action: 'role_changed',
      details: {
        previous_role: user.role,
        new_role: newRole,
      },
      performed_by: performedBy,
    });

    return data as User;
  } catch (error) {
    console.error(`Error changing role for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Performs bulk operations on multiple users
 * @param operation Bulk operation to perform
 * @param performedBy ID of the admin performing the action
 * @returns Promise with operation results
 */
export async function performBulkUserOperation(
  operation: BulkUserOperation,
  performedBy: string
): Promise<{ success: string[], failed: { id: string, error: string }[] }> {
  const results = {
    success: [] as string[],
    failed: [] as { id: string, error: string }[]
  };

  for (const userId of operation.user_ids) {
    try {
      switch (operation.action) {
        case 'activate':
          await setUserActiveStatus(userId, true);
          await logUserAction({
            user_id: userId,
            action: 'activated',
            details: { bulk_operation: true },
            performed_by: performedBy,
          });
          break;

        case 'deactivate':
          await setUserActiveStatus(userId, false);
          await logUserAction({
            user_id: userId,
            action: 'deactivated',
            details: { bulk_operation: true },
            performed_by: performedBy,
          });
          break;

        case 'suspend':
          if (operation.parameters?.suspended_until && operation.parameters?.reason) {
            await suspendUser(
              userId,
              operation.parameters.suspended_until,
              operation.parameters.reason,
              performedBy
            );
          } else {
            throw new Error('Suspension requires suspended_until and reason parameters');
          }
          break;

        case 'delete':
          await deleteUser(userId, performedBy);
          break;

        case 'change_role':
          if (operation.parameters?.role) {
            await changeUserRole(userId, operation.parameters.role, performedBy);
          } else {
            throw new Error('Role change requires role parameter');
          }
          break;

        default:
          throw new Error(`Unknown bulk operation: ${operation.action}`);
      }

      results.success.push(userId);
    } catch (error) {
      results.failed.push({
        id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Logs a user management action for audit purposes
 * @param logData Audit log data
 * @returns Promise<void>
 */
export async function logUserAction(logData: Omit<UserAuditLog, 'id' | 'performed_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_audit_logs')
      .insert({
        user_id: logData.user_id,
        action: logData.action,
        details: logData.details,
        performed_by: logData.performed_by,
        performed_at: new Date().toISOString(),
        ip_address: logData.ip_address,
        user_agent: logData.user_agent,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging user action:', error);
    // Don't throw here as audit logging failure shouldn't break the main operation
  }
}

/**
 * Fetches audit logs for a specific user
 * @param userId User ID to fetch logs for
 * @param limit Number of logs to fetch
 * @returns Promise with audit logs
 */
export async function getUserAuditLogs(userId: string, limit = 50): Promise<UserAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('user_audit_logs')
      .select(`
        *,
        performed_by_user:performed_by(id, name, email)
      `)
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data as UserAuditLog[];
  } catch (error) {
    console.error(`Error fetching audit logs for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Fetches all audit logs with pagination
 * @param page Page number (1-indexed)
 * @param pageSize Number of logs per page
 * @param actionFilter Optional action filter
 * @returns Promise with audit logs and total count
 */
export async function getAllAuditLogs(
  page = 1,
  pageSize = 50,
  actionFilter?: string
): Promise<{ logs: UserAuditLog[], totalCount: number }> {
  try {
    let query = supabase
      .from('user_audit_logs')
      .select(`
        *,
        user:user_id(id, name, email),
        performed_by_user:performed_by(id, name, email)
      `, { count: 'exact' });

    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('performed_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      logs: data as UserAuditLog[],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * Gets user statistics for admin dashboard
 * @returns Promise with user statistics
 */
export async function getUserStatistics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  adminUsers: number;
  facilityManagers: number;
  regularUsers: number;
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('status, role');

    if (error) throw error;

    const stats = {
      totalUsers: data.length,
      activeUsers: data.filter(u => u.status === 'active').length,
      inactiveUsers: data.filter(u => u.status === 'inactive').length,
      suspendedUsers: data.filter(u => u.status === 'suspended').length,
      lockedUsers: data.filter(u => u.status === 'locked').length,
      adminUsers: data.filter(u => u.role === 'admin').length,
      facilityManagers: data.filter(u => u.role === 'facility_manager').length,
      regularUsers: data.filter(u => u.role === 'user').length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
}