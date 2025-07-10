export interface User {
  id: string
  name: string
  email: string
  password: string // Hashed
  role: "admin" | "manager" | "user"
  department: string
  position: string
  phone?: string
  profileImage?: string
  dateCreated: string
  lastLogin: string
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
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  attendees?: string[]
  status: "pending" | "confirmed" | "cancelled"
  resources?: string[]
  createdAt: string
  updatedAt: string
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
  role: "admin" | "manager" | "user"
  department: string
  position: string
}
