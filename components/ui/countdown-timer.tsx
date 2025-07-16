"use client"

import { useState, useEffect } from "react"
import { Clock, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  durationInMinutes: number
  onComplete?: () => void
  className?: string
  showIcon?: boolean
  showText?: boolean
  variant?: "default" | "warning" | "danger"
}

export function CountdownTimer({
  durationInMinutes,
  onComplete,
  className,
  showIcon = true,
  showText = true,
  variant = "default"
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationInMinutes * 60)
  const [isComplete, setIsComplete] = useState(false)
  
  // Calculate percentage of time remaining
  const percentRemaining = Math.max(0, (secondsLeft / (durationInMinutes * 60)) * 100)
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
  
  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
      return
    }
    
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [secondsLeft, onComplete])
  
  // Determine color based on time remaining and variant
  const getColorClasses = () => {
    if (isComplete) {
      return "text-red-500"
    }
    
    if (variant === "danger") {
      return "text-red-500"
    }
    
    if (variant === "warning") {
      return "text-yellow-500"
    }
    
    // Default variant
    if (percentRemaining < 25) {
      return "text-red-500"
    } else if (percentRemaining < 50) {
      return "text-yellow-500"
    } else {
      return "text-blue-500"
    }
  }
  
  // Determine progress bar color
  const getProgressColor = () => {
    if (isComplete) {
      return "bg-red-500"
    }
    
    if (variant === "danger") {
      return "bg-red-500"
    }
    
    if (variant === "warning") {
      return "bg-yellow-500"
    }
    
    // Default variant
    if (percentRemaining < 25) {
      return "bg-red-500"
    } else if (percentRemaining < 50) {
      return "bg-yellow-500"
    } else {
      return "bg-blue-500"
    }
  }
  
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center mb-1">
        {showIcon && (
          <div className="mr-2">
            {isComplete ? (
              <AlertCircle className={cn("h-4 w-4", getColorClasses())} />
            ) : (
              <Clock className={cn("h-4 w-4", getColorClasses())} />
            )}
          </div>
        )}
        
        {showText && (
          <div className={cn("text-sm font-medium", getColorClasses())}>
            {isComplete ? (
              "Time expired"
            ) : (
              <>Time remaining: {formatTimeRemaining()}</>
            )}
          </div>
        )}
      </div>
      
      <Progress 
        value={percentRemaining} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  )
} 