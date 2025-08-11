"use client"

import React, { useMemo } from "react"
import { Clock } from "lucide-react"
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

  return (
    <div className={cn("space-y-4 overflow-auto pr-1", className)}>
      {items.length === 0 ? (
        <div className="text-center py-12 text-brand-navy-600 dark:text-brand-navy-400">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center">
            <Clock className="h-8 w-8 text-brand-navy-500 dark:text-brand-navy-400" />
          </div>
          <p className="font-medium">No bookings today</p>
        </div>
      ) : (
        items.map((it) => {
          const isPast = now > it.end
          const isCurrent = it.id === currentId
          return (
            <div key={it.id} className={cn(
              "rounded-xl p-4 border transition-all duration-200",
              "hover:translate-y-[-1px] hover:shadow-lg",
              isCurrent ?
                "bg-brand-teal-50 dark:bg-brand-teal-900/20 border-brand-teal-200 dark:border-brand-teal-700 shadow-lg shadow-brand-teal-500/10" :
              isPast ?
                "bg-brand-navy-50 dark:bg-brand-navy-800/50 border-brand-navy-200 dark:border-brand-navy-700 opacity-70" :
                "bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-teal-300 dark:hover:border-brand-teal-600"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-sm leading-tight",
                    isCurrent ? "text-brand-teal-700 dark:text-brand-teal-300" :
                    isPast ? "text-brand-navy-500 dark:text-brand-navy-400" :
                    "text-brand-navy-900 dark:text-brand-navy-100"
                  )}>
                    {it.title}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 font-medium",
                    isPast ? "text-brand-navy-400 dark:text-brand-navy-500" :
                    "text-brand-navy-600 dark:text-brand-navy-400"
                  )}>
                    {it.organizer}
                  </div>
                </div>
                <div className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  isCurrent ? "text-brand-teal-600 dark:text-brand-teal-400" :
                  isPast ? "text-brand-navy-400 dark:text-brand-navy-500" :
                  "text-brand-navy-700 dark:text-brand-navy-300"
                )}>
                  {it.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {it.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isCurrent && (
                <div className="mt-3 w-full bg-brand-teal-200 dark:bg-brand-teal-800 rounded-full h-1">
                  <div className="bg-brand-teal-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

