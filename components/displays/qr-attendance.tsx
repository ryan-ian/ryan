'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QrCode, Users, Clock, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import * as types from '@/types'

interface QRAttendanceProps {
  bookingId: string
  meetingTitle: string
  className?: string
  compact?: boolean
}

export function QRAttendance({ bookingId, meetingTitle, className, compact = false }: QRAttendanceProps) {
  const [context, setContext] = useState<types.AttendanceContext | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load attendance context and QR code
  const loadAttendanceData = async () => {
    try {
      setError(null)
      
      // Load meeting context
      const contextResponse = await fetch(`/api/meetings/${bookingId}/attendance/context`)
      if (!contextResponse.ok) {
        throw new Error('Failed to load meeting context')
      }
      const contextData = await contextResponse.json()
      setContext(contextData)

      // Only load QR if it should be shown
      if (contextData.showQr) {
        const qrResponse = await fetch(`/api/meetings/${bookingId}/qr`)
        if (!qrResponse.ok) {
          throw new Error('Failed to generate QR code')
        }
        const qrData = await qrResponse.json()
        setQrImage(qrData.qr_image)
      } else {
        setQrImage(null)
      }
    } catch (error: any) {
      console.error('Error loading attendance data:', error)
      setError(error.message || 'Failed to load attendance information')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadAttendanceData()
  }, [bookingId])

  // Auto-refresh QR code every 5 minutes
  useEffect(() => {
    if (!context?.showQr) return

    const interval = setInterval(() => {
      loadAttendanceData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [context?.showQr, bookingId])

  // Real-time occupancy updates
  useEffect(() => {
    if (!context?.showQr) return

    // Subscribe to attendance changes
    const channel = supabase
      .channel(`attendance-${bookingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_invitations',
        filter: `booking_id=eq.${bookingId}`
      }, () => {
        // Refresh occupancy when attendance changes
        loadAttendanceData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [context?.showQr, bookingId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadAttendanceData()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-2">Failed to load attendance data</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!context) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${compact ? "text-base" : "text-lg"}`}>
            <Users className={compact ? "h-4 w-4" : "h-5 w-5"} />
            Meeting Attendance
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 p-3" : "space-y-4"}>
        {/* Occupancy Display */}
        <div className={`flex items-center justify-between ${compact ? "p-2" : "p-3"} bg-gray-50 rounded-lg`}>
          <div>
            <p className={`${compact ? "text-xs" : "text-sm"} font-medium text-gray-700`}>Current Occupancy</p>
            <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>
              {context.occupancy.present}/{context.occupancy.capacity}
            </p>
          </div>
          <div className="text-right">
            <Badge 
              variant={
                context.occupancy.present > context.occupancy.capacity 
                  ? 'destructive' 
                  : context.occupancy.present / context.occupancy.capacity > 0.8 
                    ? 'secondary' 
                    : 'default'
              }
              className={compact ? "text-xs" : ""}
            >
              {context.occupancy.present > context.occupancy.capacity 
                ? 'Over Capacity' 
                : `${Math.round((context.occupancy.present / context.occupancy.capacity) * 100)}% Full`
              }
            </Badge>
          </div>
        </div>

        {/* QR Code Section */}
        {context.showQr && qrImage ? (
          <div className="text-center space-y-3">
            <div className={`flex items-center justify-center gap-2 text-blue-600 ${compact ? "text-sm" : ""}`}>
              <QrCode className={compact ? "h-4 w-4" : "h-5 w-5"} />
              <span className="font-medium">Scan to Mark Attendance</span>
            </div>
            
            <div className={`bg-white ${compact ? "p-2" : "p-4"} rounded-lg border-2 border-blue-200 inline-block`}>
              <Image
                src={qrImage}
                alt="Attendance QR Code"
                width={compact ? 128 : 200}
                height={compact ? 128 : 200}
                className="mx-auto"
              />
            </div>
            
            {!compact && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Scan the QR code with your phone</p>
                <p>2. Select your name from the list</p>
                <p>3. Enter the code sent to your email</p>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center ${compact ? "py-3" : "py-6"} text-gray-500`}>
            <Clock className={`${compact ? "h-8 w-8" : "h-12 w-12"} mx-auto mb-3 opacity-50`} />
            <p className={`${compact ? "text-sm" : "font-medium"}`}>Attendance marking not available</p>
            {!compact && <p className="text-sm">QR code will appear when the meeting starts</p>}
          </div>
        )}

        {/* Accepted Attendees Count */}
        {context.occupancy.accepted > 0 && !compact && (
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-gray-600">
              {context.occupancy.accepted} attendee{context.occupancy.accepted !== 1 ? 's' : ''} expected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Note: Need to import supabase properly
import { supabase } from '@/lib/supabase'

