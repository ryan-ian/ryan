"use client"

import React, { useMemo } from "react"
import { Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

interface ScheduleRailProps {
  bookings: BookingWithDetails[]
  now: Date
  currentId?: string
  className?: string
}

export function ScheduleRail({ bookings, now, currentId, className }: ScheduleRailProps) {
  const items = useMemo(() => bookings.map(b => ({
    id: b.id,
    title: b.title,
    start: new Date(b.start_time),
    end: new Date(b.end_time),
    organizer: b.users?.name || "",
  })), [bookings])

  const getStatusBadge = (item: any, isCurrent: boolean, isPast: boolean) => {
    if (isPast) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-white rounded-md">
          Completed
        </span>
      )
    }
    if (isCurrent) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-md">
          In Progress
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-md">
        Upcoming
      </span>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
          <p className="font-medium">No bookings today</p>
        </div>
      ) : (
        items.map((it) => {
          const isPast = now > it.end
          const isCurrent = it.id === currentId
          const isUpcoming = !isPast && !isCurrent

          return (
            <div
              key={it.id}
              className={cn(
                "bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50",
                "transition-all duration-200 hover:bg-gray-800/70"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                    {it.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Organizer: {it.organizer}</span>
                  </div>
                </div>
                {getStatusBadge(it, isCurrent, isPast)}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {it.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {it.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>6 attendees</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

