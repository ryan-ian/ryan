"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { BookingEditModalModern } from "@/components/bookings/booking-edit-modal-modern"
import type { Booking, Room } from "@/types"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookingId = params.id as string

  useEffect(() => {
    if (bookingId && user) {
      fetchBookingAndRoom()
    }
  }, [bookingId, user])

  const fetchBookingAndRoom = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch booking details
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
      if (!bookingResponse.ok) {
        throw new Error("Failed to fetch booking details")
      }
      const bookingData = await bookingResponse.json()
      
      // Check if user owns this booking or is admin
      if (user?.role !== 'admin' && bookingData.user_id !== user?.id) {
        throw new Error("You don't have permission to edit this booking")
      }

      setBooking(bookingData)

      // Fetch room details
      const roomResponse = await fetch(`/api/rooms`)
      if (!roomResponse.ok) {
        throw new Error("Failed to fetch room details")
      }
      const roomsData = await roomResponse.json()
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      const roomData = roomsArray.find((r: Room) => r.id === bookingData.room_id)
      
      if (!roomData) {
        throw new Error("Room not found")
      }
      
      setRoom(roomData)
    } catch (error) {
      console.error("Error fetching booking:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load booking"
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: { title: string; description?: string }) => {
    if (!booking) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update booking")
      }

      // Navigate back to bookings list
      router.push("/conference-room-booking/bookings")
    } catch (error) {
      console.error("Error updating booking:", error)
      throw error // Re-throw to be handled by the modal
    }
  }

  const handleClose = () => {
    router.back()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy-600 mx-auto mb-4"></div>
            <p className="text-brand-navy-600 dark:text-brand-navy-400">Loading booking details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-destructive mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50 mb-2">
              Error Loading Booking
            </h2>
            <p className="text-brand-navy-600 dark:text-brand-navy-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-brand-navy-600 text-white rounded-lg hover:bg-brand-navy-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <BookingEditModalModern
        isOpen={true}
        onClose={handleClose}
        booking={booking}
        room={room}
        onSubmit={handleSubmit}
      />
    </ProtectedRoute>
  )
}
