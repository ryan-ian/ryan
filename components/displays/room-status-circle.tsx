"use client"

import React from "react"
import { Check, Clock, Users, AlertTriangle, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RoomStatusType } from "@/components/ui/room-status-indicator"

interface RoomStatusCircleProps {
  status: RoomStatusType
  size?: number
  className?: string
}

export function RoomStatusCircle({ status, size = 320, className }: RoomStatusCircleProps) {
  const getStatusConfig = (status: RoomStatusType) => {
    switch (status) {
      case "available":
        return {
          bgColor: "bg-emerald-500",
          textColor: "text-white",
          icon: <Check className="h-20 w-20" />,
          label: "Available",
          shadowColor: "shadow-emerald-500/40"
        }
      case "occupied":
      case "meeting-in-progress":
        return {
          bgColor: "bg-red-500",
          textColor: "text-white",
          icon: <Users className="h-20 w-20" />,
          label: "In Use",
          shadowColor: "shadow-red-500/40"
        }
      case "reserved":
        return {
          bgColor: "bg-amber-500",
          textColor: "text-white",
          icon: <Clock className="h-20 w-20" />,
          label: "Reserved",
          shadowColor: "shadow-amber-500/40"
        }
      case "maintenance":
        return {
          bgColor: "bg-gray-500",
          textColor: "text-white",
          icon: <Wrench className="h-20 w-20" />,
          label: "Maintenance",
          shadowColor: "shadow-gray-500/40"
        }
      default:
        return {
          bgColor: "bg-emerald-500",
          textColor: "text-white",
          icon: <Check className="h-20 w-20" />,
          label: "Available",
          shadowColor: "shadow-emerald-500/40"
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full",
        config.bgColor,
        config.textColor,
        config.shadowColor,
        "shadow-2xl border-4 border-white/20",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Enhanced glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-2xl opacity-60",
          config.bgColor
        )}
        style={{ transform: 'scale(1.2)' }}
      />

      {/* Secondary glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-40",
          config.bgColor
        )}
        style={{ transform: 'scale(1.4)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {config.icon}
        <div className="text-4xl font-bold tracking-wide">
          {config.label}
        </div>
      </div>
    </div>
  )
}
