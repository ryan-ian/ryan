"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type RoomStatusType =
  | "available"
  | "occupied"
  | "maintenance"
  | "reserved"
  | "meeting-in-progress"

interface RoomStatusIndicatorProps {
  status: RoomStatusType
  size?: "sm" | "md" | "lg" | "xl"
  pulseAnimation?: boolean
  className?: string
}

export function RoomStatusIndicator({
  status,
  size = "md",
  pulseAnimation = true,
  className,
}: RoomStatusIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  
  useEffect(() => {
    // Reset animation state when status changes
    setIsAnimating(true)
  }, [status])
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }
  
  const getStatusColor = (status: RoomStatusType) => {
    switch (status) {
      case "available":
        return "text-green-500"
      case "occupied":
        return "text-blue-500"
      case "reserved":
        return "text-yellow-500"
      case "meeting-in-progress":
        return "text-purple-500"
      case "maintenance":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }
  
  const getStatusIcon = (status: RoomStatusType) => {
    switch (status) {
      case "available":
        return <CheckCircle className={cn(sizeClasses[size], "stroke-2")} />
      case "occupied":
        return <Clock className={cn(sizeClasses[size], "stroke-2")} />
      case "reserved":
        return <AlertTriangle className={cn(sizeClasses[size], "stroke-2")} />
      case "meeting-in-progress":
        return <CheckCircle className={cn(sizeClasses[size], "stroke-2")} />
      case "maintenance":
        return <XCircle className={cn(sizeClasses[size], "stroke-2")} />
      default:
        return <Clock className={cn(sizeClasses[size], "stroke-2")} />
    }
  }
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
    >
      {/* Pulsing circle background */}
      {pulseAnimation && isAnimating && (
        <span 
          className={cn(
            "absolute rounded-full animate-ping opacity-75",
            getStatusColor(status),
            {
              "h-3 w-3": size === "sm",
              "h-5 w-5": size === "md",
              "h-7 w-7": size === "lg",
              "h-10 w-10": size === "xl"
            }
          )}
        />
      )}
      
      {/* Solid circle background */}
      <span 
        className={cn(
          "absolute rounded-full",
          getStatusColor(status),
          {
            "h-3 w-3": size === "sm",
            "h-5 w-5": size === "md",
            "h-7 w-7": size === "lg",
            "h-10 w-10": size === "xl"
          }
        )}
      />
      
      {/* Icon */}
      <span className={cn("relative z-10 text-white")}>
        {getStatusIcon(status)}
      </span>
    </div>
  )
} 