export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "facility_manager" | "user"
  status?: "active" | "inactive" | "suspended" | "locked"
  organization: string
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
  facility_manager?: { // Relationship data from admin queries
    id: string
    name: string
    email: string
  }
  created_at: string
  updated_at: string
  status?: "active" | "inactive"
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
  // Pricing fields
  hourly_rate?: number
  currency?: string
  // Audit fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

// Pricing Types
export interface PricingInfo {
  hourly_rate: number
  currency: string
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

// Payment Status Types
export type PaymentStatus = 
  | 'not_required' 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export type BookingStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export type PaymentTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'abandoned' 
  | 'cancelled';

export interface Booking {
  id: string
  room_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  attendees?: string[]
  status: BookingStatus
  resources?: string[]
  rejection_reason?: string
  created_at: string
  updated_at: string
  // Check-in flow fields
  checked_in_at?: string
  check_in_required?: boolean
  auto_release_at?: string
  grace_period_minutes?: number
  // Payment fields
  total_amount?: number
  total_cost?: number
  payment_status: PaymentStatus
  payment_reference?: string
  paystack_reference?: string
  payment_date?: string
  payment_method?: string
  payment_expires_at?: string
  // Meeting invitation fields
  invitation_count?: number
}

// Payment Transaction Interface
export interface PaymentTransaction {
  id: string
  booking_id: string
  user_id: string
  amount: number
  currency: string
  payment_reference: string
  paystack_reference?: string
  paystack_transaction_id?: string
  status: PaymentTransactionStatus
  payment_method?: string
  gateway_response?: any
  created_at: string
  updated_at: string
  expires_at?: string
}

// Room Pricing History Interface
export interface RoomPricingHistory {
  id: string
  room_id: string
  old_price?: number
  new_price: number
  currency: string
  changed_by: string
  change_reason?: string
  effective_from: string
  created_at: string
}

// Payment Analytics Interface
export interface PaymentAnalytics {
  id: string
  facility_id?: string
  room_id?: string
  date: string
  total_revenue: number
  total_bookings: number
  successful_payments: number
  failed_payments: number
  average_booking_value: number
  currency: string
  created_at: string
  updated_at: string
}

// Payment Calculation Interface
export interface PaymentCalculation {
  startTime: Date
  endTime: Date
  pricePerHour: number
  currency: string
  totalAmount: number
  durationHours: number
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
  organization: string
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

export interface MeetingInvitation {
  id: string
  booking_id: string
  organizer_id: string
  invitee_email: string
  invitee_name?: string
  invitation_token?: string
  invited_at: string
  status: "pending" | "accepted" | "declined"
  email_sent_at?: string
  email_status?: "pending" | "sent" | "failed" | "bounced" | "delivered"
  responded_at?: string
  response_token?: string
  created_at: string
  updated_at: string
}

export interface MeetingAttendee {
  name?: string
  email: string
}
