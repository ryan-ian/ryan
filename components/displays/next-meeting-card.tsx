"use client"

import React from "react"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

interface NextMeetingCardProps {
  nextBooking: BookingWithDetails | null
  className?: string
}

export function NextMeetingCard({ nextBooking, className }: NextMeetingCardProps) {
  if (!nextBooking) {
    return null
  }

  const startTime = new Date(nextBooking.start_time)
  const timeString = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn(
      "bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50",
      "shadow-lg shadow-gray-900/20",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-emerald-500" />
        <h3 className="text-white font-semibold text-lg">Next Meeting</h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-white font-bold text-xl">
          {nextBooking.title}
        </h4>

        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <Clock className="h-4 w-4" />
          <span>Starts at {timeString}</span>
        </div>
      </div>
    </div>
  )
}
