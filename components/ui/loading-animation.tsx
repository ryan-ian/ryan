"use client"

import { cn } from "@/lib/utils"
import { Loader2, Loader } from "lucide-react"

interface LoadingAnimationProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton"
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
  fullPage?: boolean
}

export function LoadingAnimation({
  variant = "spinner",
  size = "md",
  text,
  className,
  fullPage = false,
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }
  
  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return (
          <Loader2 
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size],
              className
            )} 
          />
        )
      case "dots":
        return (
          <div className={cn("flex items-center space-x-1", className)}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-pulse-slow",
                  {
                    "h-1 w-1": size === "sm",
                    "h-2 w-2": size === "md",
                    "h-3 w-3": size === "lg",
                  },
                  `delay-${i * 100}`
                )}
              />
            ))}
          </div>
        )
      case "pulse":
        return (
          <Loader2 
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size],
              className
            )} 
          />
        )
      case "skeleton":
        return (
          <div 
            className={cn(
              "loading-skeleton rounded-md",
              {
                "h-4 w-20": size === "sm",
                "h-6 w-32": size === "md",
                "h-8 w-48": size === "lg",
              },
              className
            )} 
          />
        )
      default:
        return (
          <Loader 
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size],
              className
            )} 
          />
        )
    }
  }
  
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {renderLoader()}
        {text && (
          <p className="mt-4 text-sm text-muted-foreground animate-fadeIn delay-200">
            {text}
          </p>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("flex flex-col items-center justify-center", fullPage ? "h-screen" : "")}>
      {renderLoader()}
      {text && (
        <p className="mt-2 text-sm text-muted-foreground animate-fadeIn delay-100">
          {text}
        </p>
      )}
    </div>
  )
} 