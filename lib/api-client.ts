import { supabase } from './supabase';

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Authentication Types
export interface AuthResponse {
  user: AuthUser | null;
  token: string | null;
  error: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'facility_manager';
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'facility_manager';
  department: string;
  position: string;
  phone?: string;
  profile_image?: string;
  date_created: string;
  last_login: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'facility_manager';
  department: string;
  position: string;
  phone?: string;
}

export interface UserUpdateRequest {
  name?: string;
  role?: 'admin' | 'user' | 'facility_manager';
  department?: string;
  position?: string;
  phone?: string;
  profile_image?: string;
}

// Facility Types
export interface Facility {
  id: string;
  name: string;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  manager_id?: string;
  manager?: User;
}

export interface FacilityCreateRequest {
  name: string;
  location?: string;
  description?: string;
  manager_id?: string;
}

export interface FacilityUpdateRequest {
  name?: string;
  location?: string;
  description?: string;
  manager_id?: string | null;
}

// Room Types
export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'reserved';
  image?: string;
  description?: string;
  room_resources?: string[];
  facility_id: string;
  facility_name?: string;
  // Pricing fields
  hourly_rate?: number;
  currency?: string;
  min_booking_hours?: number;
  max_booking_hours?: number;
  pricing_notes?: string;
}

// Resource Types
export interface Resource {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
  description?: string;
  facility_id?: string;
}

// Booking Types
export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  resources?: string[];
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  room?: Room;
  user?: User;
}

// Report Types
export interface Report {
  id: string;
  name: string;
  type: string;
  parameters?: any;
  created_by?: string;
  created_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_confirmation' | 'booking_rejection' | 'booking_reminder' | 
         'room_maintenance' | 'system_notification' | 'booking_request' | 
         'pending_approval';
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Filter Parameters
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// API Client Class
export class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  }

  private handleError(error: any): string {
    console.error('API Error:', error);
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, token: null, error: error.message };
      }

      if (!data.session) {
        return { user: null, token: null, error: 'No session returned' };
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        return { user: null, token: null, error: userError.message };
      }

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      };

      // Store token in localStorage
      localStorage.setItem('auth-token', data.session.access_token);

      return {
        user: authUser,
        token: data.session.access_token,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        error: this.handleError(error)
      };
    }
  }

  async signup(userData: UserCreateRequest): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            department: userData.department,
            position: userData.position,
            phone: userData.phone
          }
        }
      });

      if (error) {
        return { user: null, token: null, error: error.message };
      }

      if (!data.session) {
        return { 
          user: null, 
          token: null, 
          error: 'Account created but requires email verification' 
        };
      }

      // Store token in localStorage
      localStorage.setItem('auth-token', data.session.access_token);

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
      };

      return {
        user: authUser,
        token: data.session.access_token,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        error: this.handleError(error)
      };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      localStorage.removeItem('auth-token');
      
      if (error) {
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error) {
      return { error: this.handleError(error) };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return { user: null, token: null, error: error?.message || 'User not found' };
      }
      
      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (userError) {
        return { user: null, token: null, error: userError.message };
      }
      
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      };
      
      return {
        user: authUser,
        token: this.getAuthToken(),
        error: null
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        error: this.handleError(error)
      };
    }
  }

  // User Methods
  async getUsers(params?: PaginationParams & FilterParams): Promise<ApiResponse<{ users: User[], total: number }>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const search = params?.search || '';
      const sortBy = params?.sortBy || 'name';
      const sortOrder = params?.sortOrder || 'asc';
      
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });
      
      // Apply search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      // Apply role filter if provided
      if (params?.role) {
        query = query.eq('role', params.role);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: {
          users: data as User[],
          total: count || 0
        },
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: error.code === 'PGRST116' ? 404 : 400
        };
      }
      
      return {
        data: data as User,
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async createUser(userData: UserCreateRequest): Promise<ApiResponse<User>> {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          phone: userData.phone
        }
      });
      
      if (authError || !authData.user) {
        return {
          data: null,
          error: authError?.message || 'Failed to create user',
          status: 400
        };
      }
      
      // The database trigger should create the user profile
      // Let's fetch it to confirm and return
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (error) {
        return {
          data: null,
          error: `User created but failed to fetch profile: ${error.message}`,
          status: 500
        };
      }
      
      return {
        data: data as User,
        error: null,
        status: 201
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async updateUser(id: string, userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    try {
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          phone: userData.phone,
          profile_image: userData.profile_image
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: data as User,
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    try {
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        return {
          data: null,
          error: authError.message,
          status: 400
        };
      }
      
      // The database trigger should handle deleting the user profile
      
      return {
        data: null,
        error: null,
        status: 204
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  // Facility Methods
  async getFacilities(params?: PaginationParams & FilterParams): Promise<ApiResponse<{ facilities: Facility[], total: number }>> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const search = params?.search || '';
      const sortBy = params?.sortBy || 'name';
      const sortOrder = params?.sortOrder || 'asc';
      
      let query = supabase
        .from('facilities')
        .select(`
          *,
          manager:manager_id(id, name, email, role)
        `, { count: 'exact' });
      
      // Apply search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: {
          facilities: data as Facility[],
          total: count || 0
        },
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async getFacilityById(id: string): Promise<ApiResponse<Facility>> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          manager:manager_id(id, name, email, role)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: error.code === 'PGRST116' ? 404 : 400
        };
      }
      
      return {
        data: data as Facility,
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async createFacility(facilityData: FacilityCreateRequest): Promise<ApiResponse<Facility>> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .insert({
          name: facilityData.name,
          location: facilityData.location,
          description: facilityData.description,
          manager_id: facilityData.manager_id
        })
        .select(`
          *,
          manager:manager_id(id, name, email, role)
        `)
        .single();
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: data as Facility,
        error: null,
        status: 201
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async updateFacility(id: string, facilityData: FacilityUpdateRequest): Promise<ApiResponse<Facility>> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .update({
          name: facilityData.name,
          location: facilityData.location,
          description: facilityData.description,
          manager_id: facilityData.manager_id
        })
        .eq('id', id)
        .select(`
          *,
          manager:manager_id(id, name, email, role)
        `)
        .single();
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: data as Facility,
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async deleteFacility(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        };
      }
      
      return {
        data: null,
        error: null,
        status: 204
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  // Check Facility Dependencies
  async checkFacilityDependencies(id: string): Promise<ApiResponse<{ rooms: number, resources: number }>> {
    try {
      // Check for rooms associated with this facility
      const { data: rooms, error: roomsError, count: roomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact' })
        .eq('facility_id', id);
      
      if (roomsError) {
        return {
          data: null,
          error: roomsError.message,
          status: 400
        };
      }
      
      // Check for resources associated with this facility
      const { data: resources, error: resourcesError, count: resourcesCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact' })
        .eq('facility_id', id);
      
      if (resourcesError) {
        return {
          data: null,
          error: resourcesError.message,
          status: 400
        };
      }
      
      return {
        data: {
          rooms: roomsCount || 0,
          resources: resourcesCount || 0
        },
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  // Report Methods
  async getReportData(reportType: string, params: any): Promise<ApiResponse<any>> {
    try {
      // Different report types will have different query logic
      switch (reportType) {
        case 'room-utilization': {
          const { startDate, endDate, facilityId } = params;

          // First, get all bookings with room information
          let query = supabase
            .from('bookings')
            .select(`
              room_id,
              start_time,
              end_time,
              rooms!inner(name, capacity, facility_id)
            `);

          if (startDate) {
            query = query.gte('start_time', startDate);
          }

          if (endDate) {
            query = query.lte('end_time', endDate);
          }

          if (facilityId) {
            query = query.eq('rooms.facility_id', facilityId);
          }

          const { data: bookings, error } = await query.order('start_time');

          if (error) {
            return {
              data: null,
              error: error.message,
              status: 400
            };
          }

          // Group and aggregate data on the client side
          const roomUtilization = this.aggregateRoomUtilization(bookings || []);

          return {
            data: roomUtilization,
            error: null,
            status: 200
          };
        }
        
        case 'booking-trends': {
          const { interval, startDate, endDate } = params;
          
          // For this example, we'll use a simplified approach
          // In a real implementation, you'd use database functions for date grouping
          const { data, error } = await supabase
            .from('bookings')
            .select('created_at, status')
            .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .lte('created_at', endDate || new Date().toISOString())
            .order('created_at');
          
          if (error) {
            return {
              data: null,
              error: error.message,
              status: 400
            };
          }
          
          // Process data to group by interval (day, week, month)
          // This is a simplified example - in production you'd use SQL for this
          const groupedData = this.groupBookingsByInterval(data, interval || 'day');
          
          return {
            data: groupedData,
            error: null,
            status: 200
          };
        }
        
        case 'department-usage': {
          const { startDate, endDate } = params;

          // Get bookings with user department information
          const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
              users!inner(department)
            `)
            .gte('start_time', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .lte('end_time', endDate || new Date().toISOString())
            .order('start_time');

          if (error) {
            return {
              data: null,
              error: error.message,
              status: 400
            };
          }

          // Group by department on the client side
          const departmentUsage = this.aggregateDepartmentUsage(bookings || []);

          return {
            data: departmentUsage,
            error: null,
            status: 200
          };
        }
        
        default:
          return {
            data: null,
            error: `Unsupported report type: ${reportType}`,
            status: 400
          };
      }
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  // Helper method for grouping bookings by interval
  private groupBookingsByInterval(bookings: any[], interval: 'day' | 'week' | 'month'): any[] {
    const grouped: { [key: string]: { date: string, count: number, confirmed: number, pending: number, cancelled: number } } = {};
    
    bookings.forEach(booking => {
      let dateKey: string;
      const date = new Date(booking.created_at);
      
      switch (interval) {
        case 'day':
          dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the first day of the week (Sunday)
          const firstDay = new Date(date);
          const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          firstDay.setDate(date.getDate() - day);
          dateKey = firstDay.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0];
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          count: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0
        };
      }
      
      grouped[dateKey].count++;
      
      if (booking.status === 'confirmed') {
        grouped[dateKey].confirmed++;
      } else if (booking.status === 'pending') {
        grouped[dateKey].pending++;
      } else if (booking.status === 'cancelled') {
        grouped[dateKey].cancelled++;
      }
    });
    
    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Helper method for aggregating room utilization data
  private aggregateRoomUtilization(bookings: any[]): any[] {
    const roomData: { [key: string]: { room_id: string, rooms: any, count: number, total_hours: number } } = {};

    bookings.forEach(booking => {
      const roomId = booking.room_id;

      if (!roomData[roomId]) {
        roomData[roomId] = {
          room_id: roomId,
          rooms: booking.rooms,
          count: 0,
          total_hours: 0
        };
      }

      roomData[roomId].count++;

      // Calculate duration in hours
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      roomData[roomId].total_hours += durationHours;
    });

    // Convert to array and sort by total hours (descending)
    return Object.values(roomData).sort((a, b) => b.total_hours - a.total_hours);
  }

  // Helper method for aggregating department usage data
  private aggregateDepartmentUsage(bookings: any[]): any[] {
    const departmentData: { [key: string]: { users: { department: string }, booking_count: number } } = {};

    bookings.forEach(booking => {
      const department = booking.users?.department || 'Unknown';

      if (!departmentData[department]) {
        departmentData[department] = {
          users: { department },
          booking_count: 0
        };
      }

      departmentData[department].booking_count++;
    });

    // Convert to array and sort by booking count (descending)
    return Object.values(departmentData).sort((a, b) => b.booking_count - a.booking_count);
  }

  // Export report data as CSV
  async exportReportAsCsv(reportType: string, params: any): Promise<ApiResponse<string>> {
    try {
      const reportResponse = await this.getReportData(reportType, params);
      
      if (reportResponse.error) {
        return {
          data: null,
          error: reportResponse.error,
          status: reportResponse.status
        };
      }
      
      if (!reportResponse.data || reportResponse.data.length === 0) {
        return {
          data: null,
          error: 'No data available for export',
          status: 404
        };
      }
      
      // Convert data to CSV
      const data = reportResponse.data;
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(','))
      ].join('\n');
      
      return {
        data: csvContent,
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  // Available Facility Managers
  async getAvailableFacilityManagers(currentFacilityId?: string): Promise<ApiResponse<User[]>> {
    try {
      // Get all users with facility_manager role
      const { data: managers, error: managersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'facility_manager');
      
      if (managersError) {
        return {
          data: null,
          error: managersError.message,
          status: 400
        };
      }
      
      // Get facility managers who are already assigned to facilities
      const { data: assignedManagers, error: assignedError } = await supabase
        .from('facilities')
        .select('manager_id')
        .not('manager_id', 'is', null);
      
      if (assignedError) {
        return {
          data: null,
          error: assignedError.message,
          status: 400
        };
      }
      
      // If editing a facility, we need to include its current manager in the available list
      let availableManagers: User[] = [];
      
      if (currentFacilityId) {
        // Get the current facility to find its manager
        const { data: facility } = await supabase
          .from('facilities')
          .select('manager_id')
          .eq('id', currentFacilityId)
          .single();
        
        const currentManagerId = facility?.manager_id;
        
        // Filter out managers who are already assigned to other facilities
        const assignedManagerIds = assignedManagers
          .map(f => f.manager_id)
          .filter(id => id !== currentManagerId); // Exclude current manager
        
        availableManagers = managers.filter(m => 
          !assignedManagerIds.includes(m.id) || m.id === currentManagerId
        );
      } else {
        // Filter out managers who are already assigned to any facility
        const assignedManagerIds = assignedManagers.map(f => f.manager_id);
        availableManagers = managers.filter(m => !assignedManagerIds.includes(m.id));
      }
      
      return {
        data: availableManagers as User[],
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }

  async updateRoom(id: string, roomData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: result.error || 'Failed to update room',
          status: response.status
        };
      }

      return {
        data: result.room,
        error: null,
        status: response.status
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
        status: 500
      };
    }
  }
}

export const apiClient = new ApiClient(); 