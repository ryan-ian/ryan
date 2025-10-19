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
  showTimer?: boolean
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
  size = 480,
  thickness = 20,
  className,
  showTimer = false,
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

  const { trackColor, glowColor, fillColor } = useMemo(() => {
    // Check if meeting is within 10 minutes of ending
    const isNearEnd = startTime && endTime && (() => {
      const end = new Date(endTime).getTime()
      const currentTime = now.getTime()
      const timeUntilEnd = end - currentTime
      return timeUntilEnd <= 10 * 60 * 1000 && timeUntilEnd > 0 // Within 10 minutes but not ended
    })()

    // If meeting is near end, use red colors regardless of status
    if (isNearEnd) {
      return { 
        trackColor: "stroke-red-500", 
        glowColor: "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]",
        fillColor: "fill-red-500"
      }
    }

    switch (status) {
      case "available":
        return { 
          trackColor: "stroke-emerald-500", 
          glowColor: "drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] drop-shadow-[0_0_40px_rgba(16,185,129,0.4)]",
          fillColor: "fill-emerald-500"
        }
      case "occupied":
        return { 
          trackColor: "stroke-brand-teal-500", 
          glowColor: "drop-shadow-[0_0_16px_rgba(0,196,154,0.7)]",
          fillColor: "fill-brand-teal-500"
        }
      case "meeting-in-progress":
        return { 
          trackColor: "stroke-brand-teal-500", 
          glowColor: "drop-shadow-[0_0_20px_rgba(0,196,154,0.8)] drop-shadow-[0_0_40px_rgba(0,196,154,0.4)]",
          fillColor: "fill-brand-teal-500"
        }
      case "reserved":
        return { 
          trackColor: "stroke-amber-500", 
          glowColor: "drop-shadow-[0_0_16px_rgba(245,158,11,0.7)]",
          fillColor: "fill-amber-500"
        }
      case "maintenance":
        return { 
          trackColor: "stroke-red-500", 
          glowColor: "drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]",
          fillColor: "fill-red-500"
        }
      default:
        return { 
          trackColor: "stroke-emerald-500", 
          glowColor: "",
          fillColor: "fill-emerald-500"
        }
    }
  }, [status, startTime, endTime, now])

  const dash = useMemo(() => `${circumference} ${circumference}`, [circumference])
  const offset = useMemo(() => circumference - progress * circumference, [circumference, progress])

  return (
    <div
      className={cn(
        "relative select-none flex items-center justify-center p-4 transition-all duration-300",
        className
      )}
      style={{ width: size + 32, height: size + 32 }}
      aria-label={`Status ring: ${status}, progress ${(progress * 100).toFixed(0)}%`}
    >
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {status === "available" ? (
          <>
            {/* Filled circle for available status */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={cn(fillColor, glowColor, "transition-all duration-700 ease-out")}
              fill="currentColor"
            />
            {/* Inner subtle highlight */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius - thickness / 2}
              className="fill-white/10"
            />
          </>
        ) : (
          <>
            {/* Background track for other statuses */}
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
          </>
        )}
      </svg>
      {/* Enhanced Labels with Timer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {status === 'available' ? (
          <>
            <div className="text-6xl font-bold text-white mb-2">✓</div>
            <div className="text-3xl font-bold text-white">Available</div>
          </>
        ) : status === 'meeting-in-progress' && startTime && endTime ? (
          <>
            <div className={`font-bold text-white mb-2 ${showTimer ? 'text-8xl' : 'text-lg'}`}>
              {(() => {
                const end = new Date(endTime).getTime()
                const n = now.getTime()
                const remaining = Math.max(0, end - n)
                const hours = Math.floor(remaining / (1000 * 60 * 60))
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
                
                if (remaining <= 0) return "Ended"
                if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                return `${minutes}:${seconds.toString().padStart(2, '0')}`
              })()}
            </div>
            <div className={`font-medium text-white/80 ${showTimer ? 'text-2xl' : 'text-sm'}`}>
              until {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </>
        ) : status === 'occupied' && startTime && endTime ? (
          <>
            <div className="text-4xl font-bold text-brand-teal-700 dark:text-brand-teal-300 mb-3">
              {(() => {
                const end = new Date(endTime).getTime()
                const n = now.getTime()
                const remaining = Math.max(0, end - n)
                const hours = Math.floor(remaining / (1000 * 60 * 60))
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
                
                if (remaining <= 0) return "Ended"
                if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                return `${minutes}:${seconds.toString().padStart(2, '0')}`
              })()}
            </div>
            <div className="text-lg font-medium text-brand-teal-600 dark:text-brand-teal-400">
              until {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </>
        ) : status === 'reserved' && nextStartTime ? (
          <>
            <div className="text-8xl font-bold text-amber-500 mb-4">⏳</div>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">Reserved</div>
            <div className="text-xl font-medium text-amber-600 dark:text-amber-400">
              Starts {new Date(nextStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </>
        ) : status === 'maintenance' ? (
          <>
            <div className="text-8xl font-bold text-red-500 mb-4">🔧</div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">Maintenance</div>
          </>
        ) : (
          <>
            <div className="text-xl font-semibold text-brand-navy-600 dark:text-brand-navy-400">Status</div>
            <div className="text-3xl font-bold text-brand-navy-700 dark:text-brand-navy-300 capitalize">{status}</div>
          </>
        )}
      </div>
    </div>
  )
}

