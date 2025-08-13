"use client"

import React, { useState } from "react"
import { ChevronUp, ChevronDown, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScheduleRail } from "./schedule-rail"
import type { BookingWithDetails } from "@/types"

interface CollapsibleScheduleProps {
  bookings: BookingWithDetails[]
  now: Date
  currentId?: string
  className?: string
  isCollapsed?: boolean
  onToggle?: () => void
}

export function CollapsibleSchedule({
  bookings,
  now,
  currentId,
  className,
  isCollapsed = false,
  onToggle,
}: CollapsibleScheduleProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  const collapsed = onToggle ? isCollapsed : internalCollapsed
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  if (collapsed) {
    return (
      <div className={cn("fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20", className)}>
        <Button
          onClick={handleToggle}
          className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl px-6 py-4 hover:bg-white/95 dark:hover:bg-brand-navy-800/95 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900/30 rounded-full">
              <Calendar className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
            </div>
            <div className="text-left">
              <div className="text-brand-navy-900 dark:text-brand-navy-50 font-semibold">
                Today's Schedule
              </div>
              <div className="text-brand-navy-600 dark:text-brand-navy-400 text-sm">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </div>
            </div>
            <ChevronUp className="h-5 w-5 text-brand-navy-600 dark:text-brand-navy-400" />
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Card className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-teal-500 rounded-full"></div>
              Today's Schedule
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-8 w-8 p-0 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
            >
              <ChevronDown className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScheduleRail 
            bookings={bookings} 
            now={now} 
            currentId={currentId}
            showDescription={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
