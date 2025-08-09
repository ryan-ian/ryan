"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { RoomStatusType } from "@/components/ui/room-status-indicator"

interface StatusRingProps {
  status: RoomStatusType
  now: Date
  /** ISO strings for the current booking window */
  startTime?: string
  endTime?: string
  /** Next booking start (for reserved window preview) */
  nextStartTime?: string
  size?: number
  thickness?: number
  className?: string
}

/**
 * SVG circular progress/status ring with glow.
 * - If startTime/endTime are provided, renders progress of the ongoing booking.
 * - If nextStartTime is provided and status === 'reserved', renders the 15-min amber preview arc from now to the nextStartTime.
 */
export function StatusRing({
  status,
  now,
  startTime,
  endTime,
  nextStartTime,
  size = 280,
  thickness = 14,
  className,
}: StatusRingProps) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  const progress = useMemo(() => {
    if (startTime && endTime) {
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      const n = now.getTime()
      if (end <= start) return 0
      const pct = (n - start) / (end - start)
      return Math.min(1, Math.max(0, pct))
    }
    // Reserved preview: 15-minute window before nextStart
    if (status === "reserved" && nextStartTime) {
      const startPreview = new Date(nextStartTime).getTime() - 15 * 60 * 1000
      const endPreview = new Date(nextStartTime).getTime()
      const n = now.getTime()
      if (n <= startPreview) return 0
      if (n >= endPreview) return 1
      return (n - startPreview) / (endPreview - startPreview)
    }
    return 0
  }, [startTime, endTime, nextStartTime, now, status])

  const { trackColor, glowColor } = useMemo(() => {
    switch (status) {
      case "available":
        return { trackColor: "stroke-emerald-500", glowColor: "drop-shadow-[0_0_16px_rgba(16,185,129,0.7)]" }
      case "occupied":
        return { trackColor: "stroke-brand-teal-500", glowColor: "drop-shadow-[0_0_16px_rgba(0,196,154,0.7)]" }
      case "meeting-in-progress":
        return { trackColor: "stroke-brand-navy-600", glowColor: "drop-shadow-[0_0_16px_rgba(71,85,105,0.7)]" }
      case "reserved":
        return { trackColor: "stroke-amber-500", glowColor: "drop-shadow-[0_0_16px_rgba(245,158,11,0.7)]" }
      case "maintenance":
        return { trackColor: "stroke-red-500", glowColor: "drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]" }
      default:
        return { trackColor: "stroke-emerald-500", glowColor: "" }
    }
  }, [status])

  const dash = useMemo(() => `${circumference} ${circumference}`, [circumference])
  const offset = useMemo(() => circumference - progress * circumference, [circumference, progress])

  return (
    <div
      className={cn(
        "relative select-none",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`Status ring: ${status}, progress ${(progress * 100).toFixed(0)}%`}
    >
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-brand-navy-200/50 dark:stroke-brand-navy-700/50"
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn(trackColor, "[filter:_url(#none)]", glowColor, "transition-[stroke-dashoffset] duration-700 ease-out")}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Inner subtle glass ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - thickness / 2}
          stroke="url(#ring-grad)"
          strokeWidth={1}
          fill="none"
        />
      </svg>
      {/* Enhanced Labels */}
      <div className="absolute inset-0 grid grid-rows-3 text-center pointer-events-none">
        <div className="row-start-1 text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-400">Now</div>
        <div className="row-start-3 text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
          {startTime && endTime && (status === 'occupied' || status === 'meeting-in-progress') ? 'Until ' + new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : status === 'reserved' && nextStartTime ? 'Starts ' + new Date(nextStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </div>
      </div>
    </div>
  )
}

