"use client"

import React from "react"
import { MapPin, Settings, WifiOff } from "lucide-react"
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
  currentTime: Date
}

export function RoomBanner({ name, location, status, capacity, occupancyCount, syncError, currentTime }: RoomBannerProps) {
  const time = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const ampm = currentTime.getHours() < 12 ? 'AM' : 'PM'
  const date = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex items-center justify-between gap-4 px-8 py-6 bg-transparent">
      {/* Left side - Room info */}
      <div className="flex items-center gap-4">
        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{name}</h1>
          {location && (
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 font-medium">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Time and settings */}
      <div className="flex items-center gap-6">
        {syncError && (
          <div className="flex items-center text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg border border-red-800">
            <WifiOff className="h-4 w-4 mr-2" /> Offline
          </div>
        )}

        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400">{time}</div>
          <div className="text-gray-400 text-sm font-medium">{date}</div>
        </div>

        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

