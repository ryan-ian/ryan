"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Reset visibility on route change
    setIsVisible(false)
    
    // Trigger animation after a small delay
    const timeout = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timeout)
  }, [pathname])
  
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  heading,
  text,
  children,
  className,
}: {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <h1 className="text-3xl font-bold tracking-tight animate-slideDown md:text-4xl">
        {heading}
      </h1>
      {text && <p className="text-muted-foreground animate-fadeIn delay-100">{text}</p>}
      {children}
    </div>
  )
}

export function PageSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <section
      className={cn(
        "animate-slideUp",
        {
          "animation-delay-100": delay === 100,
          "animation-delay-200": delay === 200,
          "animation-delay-300": delay === 300,
        },
        className
      )}
    >
      {children}
    </section>
  )
} 