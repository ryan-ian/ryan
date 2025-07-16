"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoomFeaturesDisplay } from "@/components/ui/room-features-display"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { cn } from "@/lib/utils"
import type { Room, Resource } from "@/types"

interface RoomInfoCarouselProps {
  room: Room
  resources?: Resource[]
  className?: string
  autoRotateInterval?: number // in milliseconds
}

export function RoomInfoCarousel({
  room,
  resources,
  className,
  autoRotateInterval = 8000
}: RoomInfoCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Extract features from room description
  const features = room.description ? 
    room.description.split(',').map(item => item.trim()) : 
    []
  
  // Define carousel slides
  const slides = [
    {
      id: "overview",
      title: "Room Overview",
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{room.name}</h3>
            <StatusBadge status={room.status} size="lg" />
          </div>
          <p className="text-muted-foreground">{room.location}</p>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              Capacity: {room.capacity} people
            </div>
            {room.status === "available" && (
              <div className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 rounded-full px-3 py-1 text-sm font-medium">
                Available Now
              </div>
            )}
          </div>
          {room.description && (
            <p className="text-sm text-muted-foreground">{room.description}</p>
          )}
        </div>
      )
    },
    {
      id: "features",
      title: "Features & Amenities",
      content: (
        <div>
          <RoomFeaturesDisplay 
            features={features}
            resources={resources}
          />
        </div>
      )
    },
    {
      id: "details",
      title: "Room Details",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium">{room.location}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Capacity</p>
            <p className="font-medium">{room.capacity} people</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={room.status} />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Room ID</p>
            <p className="font-medium">{room.id}</p>
          </div>
        </div>
      )
    }
  ]
  
  // Auto-rotate slides
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, autoRotateInterval)
    
    return () => clearInterval(interval)
  }, [isPaused, autoRotateInterval, slides.length])
  
  // Handle manual navigation
  const goToSlide = (index: number) => {
    setActiveSlide(index)
    setIsPaused(true)
    
    // Resume auto-rotation after a period of inactivity
    const timer = setTimeout(() => {
      setIsPaused(false)
    }, 10000) // Resume after 10 seconds
    
    return () => clearTimeout(timer)
  }
  
  const goToPrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsPaused(true)
    
    // Resume auto-rotation after a period of inactivity
    const timer = setTimeout(() => {
      setIsPaused(false)
    }, 10000) // Resume after 10 seconds
    
    return () => clearTimeout(timer)
  }
  
  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length)
    setIsPaused(true)
    
    // Resume auto-rotation after a period of inactivity
    const timer = setTimeout(() => {
      setIsPaused(false)
    }, 10000) // Resume after 10 seconds
    
    return () => clearTimeout(timer)
  }
  
  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      goToNextSlide()
    }
    
    if (isRightSwipe) {
      goToPrevSlide()
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }
  
  return (
    <div 
      className={cn("relative overflow-hidden rounded-lg", className)}
      ref={carouselRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out",
              activeSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <Card className="h-full border-none shadow-none">
              <CardContent className="p-6 h-full">
                <h3 className="text-lg font-medium mb-4">{slide.title}</h3>
                {slide.content}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              activeSlide === index 
                ? "bg-primary w-8" 
                : "bg-primary/30 hover:bg-primary/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Left/Right navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full z-20 opacity-70 hover:opacity-100"
        onClick={goToPrevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full z-20 opacity-70 hover:opacity-100"
        onClick={goToNextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  )
} 