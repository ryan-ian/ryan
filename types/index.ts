export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  department: string
  position: string
  phone?: string
  profile_image?: string
  date_created: string
  last_login: string
}

export interface Room {
  id: string
  name: string
  location: string
  capacity: number
  features: string[]
  status: "available" | "maintenance" | "reserved"
  image?: string
  description?: string
  resources?: string[]
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
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  department: string
  position: string
}
