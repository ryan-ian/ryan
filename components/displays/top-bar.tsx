"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { RoomStatusIndicator, type RoomStatusType } from "@/components/ui/room-status-indicator"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { LiveClock } from "./live-clock"

interface TopBarProps {
  roomName: string
  floor?: string
  capacity?: number
  status: RoomStatusType
  className?: string
}

export function TopBar({ roomName, floor, capacity, status, className }: TopBarProps) {
  return (
    <div className={`fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/90 dark:bg-brand-navy-900/90 border-b border-white/30 dark:border-brand-navy-700/50 ${className}`}>
      <div className="flex justify-between items-center p-6">
        {/* Left side: Room info */}
        <div className="flex items-center gap-4">
          <RoomStatusIndicator status={status} size="sm" />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50 tracking-tight">
              {roomName}
            </h1>
            <div className="flex items-center gap-2">
              {floor && (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700">
                  Floor {floor}
                </Badge>
              )}
              {capacity && (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700">
                  Capacity {capacity}
                </Badge>
              )}
            </div>
          </div>
          <StatusBadge status={status} size="md" />
        </div>

        {/* Right side: Live clock */}
        <div className="flex items-center gap-4">
          <LiveClock />
        </div>
      </div>
    </div>
  )
}

