"use client"

import { useState, useEffect } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FullscreenToggleProps {
  className?: string
}

export function FullscreenToggle({ className }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Check if fullscreen is supported
  const isFullscreenEnabled = () => {
    return (
      document.fullscreenEnabled ||
      // @ts-ignore - Vendor prefixed properties
      document.webkitFullscreenEnabled ||
      // @ts-ignore - Vendor prefixed properties
      document.mozFullScreenEnabled ||
      // @ts-ignore - Vendor prefixed properties
      document.msFullscreenEnabled
    )
  }
  
  // Check if currently in fullscreen mode
  const checkFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      // @ts-ignore - Vendor prefixed properties
      document.webkitFullscreenElement ||
      // @ts-ignore - Vendor prefixed properties
      document.mozFullScreenElement ||
      // @ts-ignore - Vendor prefixed properties
      document.msFullscreenElement
    )
  }
  
  // Enter fullscreen mode
  const enterFullscreen = () => {
    const element = document.documentElement
    
    if (element.requestFullscreen) {
      element.requestFullscreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (element.webkitRequestFullscreen) {
      // @ts-ignore - Vendor prefixed methods
      element.webkitRequestFullscreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (element.mozRequestFullScreen) {
      // @ts-ignore - Vendor prefixed methods
      element.mozRequestFullScreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (element.msRequestFullscreen) {
      // @ts-ignore - Vendor prefixed methods
      element.msRequestFullscreen()
    }
  }
  
  // Exit fullscreen mode
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (document.webkitExitFullscreen) {
      // @ts-ignore - Vendor prefixed methods
      document.webkitExitFullscreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (document.mozCancelFullScreen) {
      // @ts-ignore - Vendor prefixed methods
      document.mozCancelFullScreen()
    // @ts-ignore - Vendor prefixed methods
    } else if (document.msExitFullscreen) {
      // @ts-ignore - Vendor prefixed methods
      document.msExitFullscreen()
    }
  }
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (checkFullscreen()) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }
  
  // Update state when fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreen())
    }
    
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])
  
  if (!isFullscreenEnabled()) {
    return null
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className={className}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 