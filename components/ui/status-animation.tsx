"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"

interface StatusAnimationProps {
  status: "success" | "error" | "warning" | "info"
  message: string
  description?: string
  className?: string
  autoHide?: boolean
  hideAfter?: number // in milliseconds
  onHide?: () => void
}

export function StatusAnimation({
  status,
  message,
  description,
  className,
  autoHide = false,
  hideAfter = 3000,
  onHide,
}: StatusAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        
        // Add a delay for the exit animation
        const exitTimer = setTimeout(() => {
          setIsVisible(false)
          if (onHide) onHide()
        }, 300)
        
        return () => clearTimeout(exitTimer)
      }, hideAfter)
      
      return () => clearTimeout(timer)
    }
  }, [autoHide, hideAfter, isVisible, onHide])
  
  if (!isVisible) return null
  
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-900",
      textColor: "text-emerald-700 dark:text-emerald-400",
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-900",
      textColor: "text-red-700 dark:text-red-400",
      iconColor: "text-red-500 dark:text-red-400",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-900",
      textColor: "text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-500 dark:text-amber-400",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-900",
      textColor: "text-blue-700 dark:text-blue-400",
      iconColor: "text-blue-500 dark:text-blue-400",
    },
  }
  
  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = statusConfig[status]
  
  return (
    <div
      className={cn(
        "flex items-start p-4 rounded-md border transition-all duration-300",
        bgColor,
        borderColor,
        isExiting ? "opacity-0 transform -translate-y-2" : "opacity-100 transform translate-y-0",
        "animate-slideInFromBottom",
        className
      )}
    >
      <div className={cn("mr-3 flex-shrink-0", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className={cn("text-sm font-medium", textColor)}>{message}</h3>
        {description && (
          <p className={cn("mt-1 text-xs opacity-90", textColor)}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
} 