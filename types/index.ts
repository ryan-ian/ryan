export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "facility_manager" | "user"
  department: string
  position: string
  phone?: string
  profile_image?: string
  date_created: string
  last_login: string
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
