"use client"

import React from "react"
import { WifiOff } from "lucide-react"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { RoomStatusIndicator, type RoomStatusType } from "@/components/ui/room-status-indicator"
import { FullscreenToggle } from "@/components/ui/fullscreen-toggle"

interface RoomBannerProps {
  name: string
  location?: string
  status: RoomStatusType
  capacity?: number
  occupancyCount?: number
  syncError?: string | null
}

export function RoomBanner({ name, location, status, capacity, occupancyCount, syncError }: RoomBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-4">
        <RoomStatusIndicator status={status} size="sm" />
        <div>
          <div className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50 tracking-tight">{name}</div>
          {location && <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400 font-medium">{location}</div>}
        </div>
        <div className="ml-2"><StatusBadge status={status} size="md" /></div>
        {typeof occupancyCount === 'number' && typeof capacity === 'number' && (
          <div className="ml-2 text-sm px-3 py-1.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/30 text-brand-teal-700 dark:text-brand-teal-300 font-semibold border border-brand-teal-200 dark:border-brand-teal-700">
            {occupancyCount}/{capacity}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {syncError && (
          <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
            <WifiOff className="h-4 w-4 mr-2" /> Offline
          </div>
        )}
        <FullscreenToggle />
      </div>
    </div>
  )
}

