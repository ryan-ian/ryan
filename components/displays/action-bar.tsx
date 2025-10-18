"use client"

import React from "react"
import { CheckInManager } from "@/components/ui/check-in-manager"
import type { BookingWithDetails, Room } from "@/types"

interface ActionBarProps {
  room: Room
  currentBooking: BookingWithDetails | null
  onCheckInSuccess?: (t: string) => void
  onAutoRelease?: () => void
  compact?: boolean
}

export function ActionBar({ room, currentBooking, onCheckInSuccess, onAutoRelease, compact = false }: ActionBarProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {currentBooking && (
        <div className={`rounded-2xl ${compact ? "p-3" : "p-4"} backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30`}>
          <CheckInManager booking={currentBooking} onCheckInSuccess={onCheckInSuccess} onAutoRelease={onAutoRelease} />
        </div>
      )}
    </div>
  )
}

