"use client"

import React from "react"
import { CheckInManager } from "@/components/ui/check-in-manager"
import { IssueReportForm } from "@/components/ui/issue-report-form"
import type { BookingWithDetails, Room } from "@/types"

interface ActionBarProps {
  room: Room
  currentBooking: BookingWithDetails | null
  onCheckInSuccess?: (t: string) => void
  onAutoRelease?: () => void
}

export function ActionBar({ room, currentBooking, onCheckInSuccess, onAutoRelease }: ActionBarProps) {
  return (
    <div className="space-y-3">
      {currentBooking && (
        <div className="rounded-2xl p-4 backdrop-blur-md bg-white/10 dark:bg-slate-900/30 ring-1 ring-white/15 dark:ring-slate-700/40">
          <CheckInManager booking={currentBooking} onCheckInSuccess={onCheckInSuccess} onAutoRelease={onAutoRelease} />
        </div>
      )}
      <div className="rounded-2xl p-3 backdrop-blur-md bg-white/10 dark:bg-slate-900/30 ring-1 ring-white/15 dark:ring-slate-700/40">
        <IssueReportForm room={room} booking={currentBooking || undefined} />
      </div>
    </div>
  )
}

