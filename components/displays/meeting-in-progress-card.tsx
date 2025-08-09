"use client"

import React from "react"
import { Clock, User, Calendar, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

interface MeetingInProgressCardProps {
  booking: BookingWithDetails
  className?: string
}

export function MeetingInProgressCard({ booking, className }: MeetingInProgressCardProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDuration = () => {
    const start = new Date(booking.start_time)
    const end = new Date(booking.end_time)
    const durationMs = end.getTime() - start.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card className={cn(
      "border-l-8 border-l-brand-navy-600 bg-gradient-to-br from-brand-navy-50 to-brand-teal-50 dark:from-brand-navy-900/50 dark:to-brand-navy-800/50",
      "shadow-xl shadow-brand-navy-500/20 dark:shadow-brand-navy-900/30",
      "backdrop-blur-md bg-white/95 dark:bg-brand-navy-800/95",
      "border border-white/30 dark:border-brand-navy-700/50 rounded-2xl",
      "animate-in slide-in-from-top-4 duration-500",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-3">
            <div className="p-3 bg-brand-navy-100 dark:bg-brand-navy-700 rounded-full">
              <CheckCircle className="h-6 w-6 text-brand-navy-600 dark:text-brand-navy-400" />
            </div>
            Meeting in Progress
          </CardTitle>
          <Badge className="bg-brand-navy-600 text-white px-4 py-2 text-sm font-semibold animate-pulse rounded-full">
            LIVE
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Meeting Title */}
        <div className="space-y-3">
          <h3 className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50 leading-tight">
            {booking.title}
          </h3>
          {booking.description && (
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 leading-relaxed">
              {booking.description}
            </p>
          )}
        </div>

        {/* Meeting Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Time Range */}
          <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-brand-navy-700/60 rounded-xl backdrop-blur-sm border border-white/40 dark:border-brand-navy-600/40">
            <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/30 rounded-full">
              <Clock className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-400">Duration</p>
              <p className="text-lg font-bold text-brand-navy-900 dark:text-brand-navy-100">
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </p>
              <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                ({formatDuration()})
              </p>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-brand-navy-700/60 rounded-xl backdrop-blur-sm border border-white/40 dark:border-brand-navy-600/40">
            <div className="p-3 bg-brand-navy-100 dark:bg-brand-navy-800/60 rounded-full">
              <User className="h-5 w-5 text-brand-navy-600 dark:text-brand-navy-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-400">Organizer</p>
              <p className="text-lg font-bold text-brand-navy-900 dark:text-brand-navy-100">
                {booking.users?.name || "Unknown"}
              </p>
              {booking.users?.email && (
                <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400 truncate font-medium">
                  {booking.users.email}
                </p>
              )}
            </div>
          </div>

          {/* Attendees Count */}
          <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-brand-navy-700/60 rounded-xl backdrop-blur-sm border border-white/40 dark:border-brand-navy-600/40">
            <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/30 rounded-full">
              <Calendar className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-400">Attendees</p>
              <p className="text-lg font-bold text-brand-navy-900 dark:text-brand-navy-100">
                {booking.attendees?.length || 0} people
              </p>
              {booking.attendees && booking.attendees.length > 0 && (
                <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                  Expected
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-5 bg-gradient-to-r from-brand-navy-100 to-brand-teal-100 dark:from-brand-navy-800/40 dark:to-brand-navy-700/40 rounded-xl border border-brand-navy-200 dark:border-brand-navy-600">
          <p className="text-center text-sm font-semibold text-brand-navy-800 dark:text-brand-navy-200">
            🤫 Meeting in session - Please keep noise to a minimum
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
