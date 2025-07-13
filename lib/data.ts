import type { User, Room, Booking, Resource } from "@/types"
import usersData from "@/data/users.json"
import roomsData from "@/data/rooms.json"
import bookingsData from "@/data/bookings.json"
import resourcesData from "@/data/resources.json"

// In a real app, these would be database operations
export const users: User[] = usersData as User[]
export const rooms: Room[] = roomsData as Room[]
export const bookings: Booking[] = bookingsData as Booking[]
export const resources: Resource[] = resourcesData as Resource[]

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email)
}

export function getRoomById(id: string): Room | undefined {
  return rooms.find((room) => room.id === id)
}

export function getBookingById(id: string): Booking | undefined {
  return bookings.find((booking) => booking.id === id)
}

export function getBookingsByUserId(userId: string): Booking[] {
  return bookings.filter((booking) => booking.user_id === userId)
}

export function getBookingsByRoomId(roomId: string): Booking[] {
  return bookings.filter((booking) => booking.room_id === roomId)
}

export function getAvailableRooms(start_time: string, end_time: string): Room[] {
  const conflictingBookings = bookings.filter((booking) => {
    const bookingStart = new Date(booking.start_time)
    const bookingEnd = new Date(booking.end_time)
    const requestStart = new Date(start_time)
    const requestEnd = new Date(end_time)

    return (
      booking.status === "confirmed" &&
      ((requestStart >= bookingStart && requestStart < bookingEnd) ||
        (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
        (requestStart <= bookingStart && requestEnd >= bookingEnd))
    )
  })

  const bookedRoomIds = new Set(conflictingBookings.map((b) => b.room_id))
  return rooms.filter((room) => room.status === "available" && !bookedRoomIds.has(room.id))
}
