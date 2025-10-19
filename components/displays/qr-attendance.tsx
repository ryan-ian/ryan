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
    <Card className={`backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl hover:shadow-2xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-50">
            <Users className="h-5 w-5" />
            Meeting Attendance
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-brand-navy-600 hover:text-brand-navy-800 dark:text-brand-navy-400 dark:hover:text-brand-navy-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Section */}
        {context.showQr && qrImage ? (
          <div className="text-center space-y-3">
            <div className="bg-white dark:bg-brand-navy-700 p-4 rounded-lg border-2 border-brand-teal-200 dark:border-brand-teal-700 inline-block">
              <Image
                src={qrImage}
                alt="Attendance QR Code"
                width={160}
                height={160}
                className="mx-auto"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-brand-navy-500 dark:text-brand-navy-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Attendance marking not available</p>
            <p className="text-sm">QR code will appear when the meeting starts</p>
          </div>
        )}

        {/* Occupancy Display with Progress Bar */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Occupancy</p>
          </div>
          
          {/* Horizontal Progress Bar */}
          <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-3">
            <div 
              className="bg-brand-teal-500 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (context.occupancy.present / context.occupancy.capacity) * 100)}%` 
              }}
            />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-brand-navy-900 dark:text-brand-navy-50">
              {context.occupancy.present}/{context.occupancy.capacity} Seats Filled
            </p>
          </div>
        </div>

        {/* Instructions */}
        {context.showQr && qrImage && (
          <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400 space-y-1">
            <p>1. Scan the QR code to check in.</p>
            <p>2. Select your name from the list.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Note: Need to import supabase properly
import { supabase } from '@/lib/supabase'

