"use client"

import { CheckCircle, AlertCircle, XCircle, Clock, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "available" 
  | "occupied" 
  | "maintenance" 
  | "confirmed" 
  | "pending" 
  | "cancelled" 
  | "completed" 
  | "in-use" 
  | "unavailable"
  | string

export interface StatusBadgeProps {
  status: StatusType
  showIcon?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
  size = "md",
}: StatusBadgeProps) {
  const getStatusColor = (status: StatusType) => {
    switch (status.toLowerCase()) {
      case "available":
      case "confirmed":
      case "completed":
        return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20"
      case "pending":
      case "maintenance":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20"
      case "cancelled":
      case "unavailable":
        return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20"
      case "occupied":
      case "in-use":
        return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: StatusType) => {
    switch (status.toLowerCase()) {
      case "available":
      case "confirmed":
      case "completed":
        return <CheckCircle className={sizeClasses.icon} />
      case "pending":
      case "maintenance":
        return <AlertCircle className={sizeClasses.icon} />
      case "cancelled":
      case "unavailable":
        return <XCircle className={sizeClasses.icon} />
      case "occupied":
      case "in-use":
        return <Clock className={sizeClasses.icon} />
      default:
        return <HelpCircle className={sizeClasses.icon} />
    }
  }

  const sizeClasses = {
    sm: {
      badge: "px-1.5 py-0.5 text-xs",
      icon: "h-3 w-3",
      gap: "gap-1"
    },
    md: {
      badge: "px-2 py-0.5 text-xs",
      icon: "h-3.5 w-3.5",
      gap: "gap-1.5"
    },
    lg: {
      badge: "px-2.5 py-1 text-sm",
      icon: "h-4 w-4",
      gap: "gap-2"
    }
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "capitalize font-medium", 
        getStatusColor(status),
        sizeClasses[size].badge,
        className
      )}
    >
      <span className={cn("flex items-center", showIcon && sizeClasses[size].gap)}>
        {showIcon && getStatusIcon(status)}
        {status}
      </span>
    </Badge>
  )
} 