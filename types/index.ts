export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "facility_manager" | "user"
  status?: "active" | "inactive" | "suspended" | "locked"
  department: string
  position: string
  phone?: string
  profile_image?: string
  date_created: string
  last_login: string
  suspended_until?: string
  suspension_reason?: string
  failed_login_attempts?: number
  locked_until?: string
  created_by?: string
  updated_by?: string
  updated_at?: string
}

export interface Facility {
  id: string
  name: string
  location: string
  description?: string
  manager_id?: string
  created_at: string
  updated_at: string
  roomCount?: number
  utilization?: number
}

export interface Room {
  id: string
  name: string
  location: string
  capacity: number
  room_resources?: string[]
  resources?: string[] // For compatibility with form data
  status: "available" | "maintenance" | "reserved"
  image?: string
  description?: string
  resourceDetails?: Resource[]
  facility_id: string
  facility_name?: string // Add this direct property for easy access
  facility: {
    id: string
    name: string
    location: string
  }
  availability?: RoomAvailability
}

// Room Availability Management Types
export interface DayOperatingHours {
  enabled: boolean
  start: string // HH:MM format
  end: string   // HH:MM format
}

export interface OperatingHours {
  monday: DayOperatingHours
  tuesday: DayOperatingHours
  wednesday: DayOperatingHours
  thursday: DayOperatingHours
  friday: DayOperatingHours
  saturday: DayOperatingHours
  sunday: DayOperatingHours
}

export interface RoomAvailability {
  id: string
  room_id: string
  operating_hours: OperatingHours
  min_booking_duration: number // minutes
  max_booking_duration: number // minutes
  buffer_time: number // minutes
  advance_booking_days: number
  same_day_booking_enabled: boolean
  max_bookings_per_user_per_day: number
  max_bookings_per_user_per_week: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

// Facility Availability (global defaults for a facility)
export interface FacilityAvailability {
  id: string
  facility_id: string
  operating_hours: OperatingHours
  min_booking_duration: number // minutes
  max_booking_duration: number // minutes
  buffer_time: number // minutes
  advance_booking_days: number
  same_day_booking_enabled: boolean
  max_bookings_per_user_per_day: number
  max_bookings_per_user_per_week: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

// Optional: Effective availability (room override or facility default)
export interface EffectiveAvailability {
  scope: 'room' | 'facility'
  roomAvailability?: RoomAvailability
  facilityAvailability?: FacilityAvailability
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  days?: string[] // For weekly: ['monday', 'friday']
  date?: number   // For monthly: day of month
  end_date?: string // When recurrence ends
  interval?: number // Every N days/weeks/months
}

export interface RoomBlackout {
  id: string
  room_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  blackout_type: 'maintenance' | 'cleaning' | 'event' | 'holiday' | 'repair' | 'other'
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface Report {
  id: string
  name: string
  type: "room_utilization" | "booking_trends" | "user_activity"
  parameters: any
  created_by: string
  created_at: string
}

export interface FacilityManager {
  id: string
  facility_id: string
  user_id: string
  assigned_at: string
  facility?: Facility
  user?: User
}

export interface Booking {
  id: string
  room_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  attendees?: string[]
  status: "pending" | "confirmed" | "cancelled"
  resources?: string[]
  rejection_reason?: string
  created_at: string
  updated_at: string
  // Check-in flow fields
  checked_in_at?: string
  check_in_required?: boolean
  auto_release_at?: string
  grace_period_minutes?: number
}

export interface BookingWithDetails extends Booking {
  rooms: {
    id: string
    name: string
    location: string
    capacity: number
  }
  users: {
    id: string
    name: string
    email: string
  }
}

export interface Resource {
  id: string
  name: string
  type: string
  status: "available" | "in-use" | "maintenance"
  description?: string
  image?: string
  facility_id?: string
}

export interface RoomIssue {
  id: string
  room_id: string
  booking_id?: string
  reported_by_user_id?: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  reported_at: string
  resolved_at?: string
  resolved_by_user_id?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
  // Related data
  room?: Room
  booking?: Booking
  reported_by?: User
  resolved_by?: User
}

export interface CheckInEvent {
  id: string
  booking_id: string
  event_type: "check_in" | "auto_release" | "manual_release"
  performed_at: string
  performed_by_user_id?: string
  notes?: string
  created_at: string
  // Related data
  booking?: Booking
  performed_by?: User
}

export interface CheckInStatus {
  isCheckedIn: boolean
  checkInTime?: string
  gracePeriodEnd?: string
  autoReleaseScheduled: boolean
  checkInRequired: boolean
  gracePeriodMinutes: number
  canCheckIn: boolean
  checkInAvailableAt?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "facility_manager" | "user"
  department: string
  position: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "booking_confirmation" | "booking_rejection" | "booking_reminder" | "room_maintenance" | "system_notification" | "booking_request" | "pending_approval"
  related_id?: string // ID of related entity (booking, room, etc.)
  is_read: boolean
  created_at: string
}
