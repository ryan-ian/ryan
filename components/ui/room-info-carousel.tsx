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
      id: "visual",
      title: "Room Visualization",
      content: (
        <div className="h-full flex items-center justify-center">
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <img
              src="/room-bg-1.svg"
              alt="Conference Room Layout"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Modern conference room with state-of-the-art facilities
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "overview",
      title: "Room Overview",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {room.name}
            </h3>
            <StatusBadge status={room.status} size="lg" />
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
            <p className="text-slate-700 dark:text-slate-300 font-medium">{room.location}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
              Capacity: {room.capacity} people
            </div>
            {room.status === "available" && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg animate-pulse">
                Available Now
              </div>
            )}
          </div>
          {room.description && (
            <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-white/30 dark:border-slate-600/30">
              <p className="text-slate-700 dark:text-slate-300">{room.description}</p>
            </div>
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
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Location</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{room.location}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-4 border border-emerald-200/50 dark:border-emerald-700/50">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Capacity</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{room.capacity} people</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border border-purple-200/50 dark:border-purple-700/50">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Status</p>
            <StatusBadge status={room.status} />
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-4 border border-amber-200/50 dark:border-amber-700/50">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">Room ID</p>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{room.id.slice(0, 8)}...</p>
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
            <Card className="h-full border-none shadow-none bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-800/60 dark:to-slate-800/30 backdrop-blur-sm">
              <CardContent className="p-6 h-full">
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  {slide.title}
                </h3>
                <div className="animate-scale-in">
                  {slide.content}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30 dark:border-slate-600/30",
              activeSlide === index
                ? "bg-gradient-to-r from-blue-500 to-purple-500 w-8 shadow-lg"
                : "bg-white/60 dark:bg-slate-700/60 w-3 hover:bg-white/80 dark:hover:bg-slate-600/80 hover:scale-110"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Left/Right navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full z-20 opacity-70 hover:opacity-100 border border-white/30 dark:border-slate-600/30 shadow-lg hover:scale-110 transition-all duration-300"
        onClick={goToPrevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full z-20 opacity-70 hover:opacity-100 border border-white/30 dark:border-slate-600/30 shadow-lg hover:scale-110 transition-all duration-300"
        onClick={goToNextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-slate-700 dark:text-slate-300" />
      </Button>
    </div>
  )
} 