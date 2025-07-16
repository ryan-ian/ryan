"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserX, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type OccupancyStatus = 
  | "vacant" 
  | "occupied" 
  | "over-capacity" 
  | "unknown"
  | "loading"

interface OccupancySensorProps {
  status: OccupancyStatus
  count?: number
  capacity?: number
  className?: string
  showCount?: boolean
  pulseAnimation?: boolean
  size?: "sm" | "md" | "lg"
}

export function OccupancySensor({
  status,
  count,
  capacity,
  className,
  showCount = true,
  pulseAnimation = true,
  size = "md"
}: OccupancySensorProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  
  // Reset animation state when status changes
  useEffect(() => {
    setIsAnimating(true)
  }, [status])
  
  const getStatusColor = (status: OccupancyStatus) => {
    switch (status) {
      case "vacant":
        return "text-green-500"
      case "occupied":
        return "text-blue-500"
      case "over-capacity":
        return "text-red-500"
      case "unknown":
      case "loading":
      default:
        return "text-gray-400"
    }
  }
  
  const getStatusIcon = (status: OccupancyStatus) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8"
    }
    
    switch (status) {
      case "vacant":
        return <UserX className={cn(sizeClasses[size], "stroke-2")} />
      case "occupied":
        return <UserCheck className={cn(sizeClasses[size], "stroke-2")} />
      case "over-capacity":
        return <Users className={cn(sizeClasses[size], "stroke-2")} />
      case "loading":
        return <Loader2 className={cn(sizeClasses[size], "stroke-2 animate-spin")} />
      case "unknown":
      default:
        return <Users className={cn(sizeClasses[size], "stroke-2")} />
    }
  }
  
  const getStatusText = (status: OccupancyStatus) => {
    switch (status) {
      case "vacant":
        return "Room Vacant"
      case "occupied":
        return showCount && count !== undefined && capacity !== undefined
          ? `Occupied (${count}/${capacity})`
          : "Room Occupied"
      case "over-capacity":
        return showCount && count !== undefined && capacity !== undefined
          ? `Over Capacity (${count}/${capacity})`
          : "Room Over Capacity"
      case "loading":
        return "Checking Occupancy..."
      case "unknown":
      default:
        return "Status Unknown"
    }
  }
  
  const getPercentOccupied = () => {
    if (count === undefined || capacity === undefined || capacity === 0) {
      return 0
    }
    return Math.min(100, Math.round((count / capacity) * 100))
  }
  
  const percentOccupied = getPercentOccupied()
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        {/* Pulsing circle background for animation */}
        {pulseAnimation && isAnimating && status !== "loading" && (
          <span 
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              getStatusColor(status)
            )}
          />
        )}
        
        {/* Icon with background */}
        <div 
          className={cn(
            "flex items-center justify-center rounded-full p-1",
            getStatusColor(status),
            {
              "bg-green-100 dark:bg-green-900/30": status === "vacant",
              "bg-blue-100 dark:bg-blue-900/30": status === "occupied",
              "bg-red-100 dark:bg-red-900/30": status === "over-capacity",
              "bg-gray-100 dark:bg-gray-900/30": status === "unknown" || status === "loading",
            }
          )}
        >
          {getStatusIcon(status)}
        </div>
      </div>
      
      <div className="flex flex-col">
        <span className={cn(
          "font-medium text-sm",
          {
            "text-green-700 dark:text-green-400": status === "vacant",
            "text-blue-700 dark:text-blue-400": status === "occupied",
            "text-red-700 dark:text-red-400": status === "over-capacity",
            "text-gray-700 dark:text-gray-400": status === "unknown" || status === "loading",
          }
        )}>
          {getStatusText(status)}
        </span>
        
        {/* Occupancy bar */}
        {showCount && count !== undefined && capacity !== undefined && status !== "loading" && (
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                {
                  "bg-green-500": percentOccupied < 50,
                  "bg-yellow-500": percentOccupied >= 50 && percentOccupied < 90,
                  "bg-red-500": percentOccupied >= 90,
                }
              )}
              style={{ width: `${percentOccupied}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 