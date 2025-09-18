'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Room, Facility, Resource, Booking } from '@/types'

/**
 * Custom hook for fetching and caching rooms data
 * Uses a stale time of 5 minutes (data is considered fresh for 5 minutes)
 * and caches the data for 1 hour
 */
export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms')
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Custom hook for fetching and caching a single room by ID
 */
export function useRoom(roomId: string | undefined) {
  return useQuery<Room>({
    queryKey: ['rooms', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required')
      const response = await fetch(`/api/rooms?id=${roomId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch room')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!roomId, // Only run the query if roomId is provided
  })
}

/**
 * Custom hook for fetching and caching facilities data
 * Facilities change very infrequently, so we use a longer stale time
 */
export function useFacilities() {
  return useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await fetch('/api/facilities')
      if (!response.ok) {
        throw new Error('Failed to fetch facilities')
      }
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Custom hook for fetching and caching resources data
 */
export function useResources() {
  return useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await fetch('/api/resources')
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      return response.json()
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Custom hook for fetching user bookings
 * This data is user-specific and changes more frequently
 */
export function useUserBookings(userId: string | undefined) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const { authenticatedFetch } = await import('@/lib/auth-utils')
      const response = await authenticatedFetch(`/api/bookings/user?user_id=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user bookings')
      }
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute (user bookings change more frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId, // Only run the query if userId is provided
  })
}

/**
 * Custom hook for creating a booking with automatic cache invalidation
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookingData: any) => {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create booking')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries when a booking is created
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user', variables.user_id] })
      
      // Also invalidate room queries as room availability might have changed
      if (variables.room_id) {
        queryClient.invalidateQueries({ queryKey: ['rooms', variables.room_id] })
      }
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

/**
 * Custom hook for canceling a booking with automatic cache invalidation
 */
export function useCancelBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookingId, userId }: { bookingId: string; userId: string }) => {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel booking')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries when a booking is cancelled
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user', variables.userId] })
      
      // Also invalidate room queries as room availability might have changed
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
} 