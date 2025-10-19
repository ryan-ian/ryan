"use client"

import React, { useMemo } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

interface ScheduleRailProps {
  bookings: BookingWithDetails[]
  now: Date
  currentId?: string
  reservedId?: string
  className?: string
  showDescription?: boolean
}

export function ScheduleRail({ bookings, now, currentId, reservedId, className, showDescription = false }: ScheduleRailProps) {
  const items = useMemo(() => bookings.map(b => ({
    id: b.id,
    title: b.title,
    description: b.description,
    start: new Date(b.start_time),
    end: new Date(b.end_time),
    organizer: b.users?.name || "",
  })), [bookings])

  // Calculate progress for current meetings
  const getCurrentProgress = useMemo(() => {
    if (!currentId) return 0
    const currentBooking = bookings.find(b => b.id === currentId)
    if (!currentBooking) return 0
    
    const start = new Date(currentBooking.start_time).getTime()
    const end = new Date(currentBooking.end_time).getTime()
    const n = now.getTime()
    
    if (end <= start) return 0
    const pct = (n - start) / (end - start)
    return Math.min(1, Math.max(0, pct))
  }, [currentId, bookings, now])

  // Calculate progress for reserved meetings (15-minute window before start)
  const getReservedProgress = useMemo(() => {
    if (!reservedId) return 0
    const reservedBooking = bookings.find(b => b.id === reservedId)
    if (!reservedBooking) return 0
    
    const startPreview = new Date(reservedBooking.start_time).getTime() - 15 * 60 * 1000
    const endPreview = new Date(reservedBooking.start_time).getTime()
    const n = now.getTime()
    
    if (n <= startPreview) return 0
    if (n >= endPreview) return 1
    return (n - startPreview) / (endPreview - startPreview)
  }, [reservedId, bookings, now])

  return (
    <div className={cn("space-y-3 overflow-auto pr-1", className)}>
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
          const isReserved = it.id === reservedId
          
          // Check if current meeting is within 10 minutes of ending
          const isNearEnd = isCurrent && (() => {
            const end = it.end.getTime()
            const nowTime = now.getTime()
            const timeUntilEnd = end - nowTime
            return timeUntilEnd <= 10 * 60 * 1000 && timeUntilEnd > 0 // Within 10 minutes but not ended
          })()
          
          return (
            <div key={it.id} className={cn(
              "rounded-xl p-3 border transition-all duration-200",
              "hover:translate-y-[-1px] hover:shadow-lg",
              isNearEnd ?
                "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-lg shadow-red-500/10" :
              isCurrent ?
                "bg-brand-teal-50 dark:bg-brand-teal-900/20 border-brand-teal-200 dark:border-brand-teal-700 shadow-lg shadow-brand-teal-500/10" :
              isReserved ?
                "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-lg shadow-amber-500/10" :
              isPast ?
                "bg-brand-navy-50 dark:bg-brand-navy-800/50 border-brand-navy-200 dark:border-brand-navy-700 opacity-70" :
                "bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-teal-300 dark:hover:border-brand-teal-600"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-sm leading-tight",
                    isNearEnd ? "text-red-700 dark:text-red-300" :
                    isCurrent ? "text-brand-teal-700 dark:text-brand-teal-300" :
                    isReserved ? "text-amber-700 dark:text-amber-300" :
                    isPast ? "text-brand-navy-500 dark:text-brand-navy-400" :
                    "text-brand-navy-900 dark:text-brand-navy-100"
                  )}>
                    {it.title}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 font-medium",
                    isNearEnd ? "text-red-600 dark:text-red-400" :
                    isReserved ? "text-amber-600 dark:text-amber-400" :
                    isPast ? "text-brand-navy-400 dark:text-brand-navy-500" :
                    "text-brand-navy-600 dark:text-brand-navy-400"
                  )}>
                    {it.organizer}
                  </div>
                  {showDescription && it.description && (
                    <div className={cn(
                      "text-xs mt-2 leading-relaxed",
                      isNearEnd ? "text-red-600 dark:text-red-400" :
                      isReserved ? "text-amber-600 dark:text-amber-400" :
                      isPast ? "text-brand-navy-400 dark:text-brand-navy-500" :
                      "text-brand-navy-600 dark:text-brand-navy-400"
                    )}>
                      {it.description}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  isNearEnd ? "text-red-600 dark:text-red-400" :
                  isCurrent ? "text-brand-teal-600 dark:text-brand-teal-400" :
                  isReserved ? "text-amber-600 dark:text-amber-400" :
                  isPast ? "text-brand-navy-400 dark:text-brand-navy-500" :
                  "text-brand-navy-700 dark:text-brand-navy-300"
                )}>
                  {it.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {it.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isCurrent && (
                <div className="mt-2 w-full bg-brand-teal-200 dark:bg-brand-teal-800 rounded-full h-1">
                  <div 
                    className={cn(
                      "h-1 rounded-full animate-pulse transition-all duration-1000 ease-out",
                      isNearEnd ? "bg-red-500" : "bg-brand-teal-500"
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, getCurrentProgress * 100))}%` }}
                  ></div>
                </div>
              )}
              {isReserved && (
                <div className="mt-2 w-full bg-amber-200 dark:bg-amber-800 rounded-full h-1">
                  <div 
                    className="bg-amber-500 h-1 rounded-full animate-pulse transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.max(0, Math.min(100, getReservedProgress * 100))}%` }}
                  ></div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

