"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Clock, User, Calendar, ChevronRight, ChevronLeft } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/types"

interface MeetingCarouselProps {
  bookings: BookingWithDetails[]
  currentTime: Date
  className?: string
}

export function MeetingCarousel({ bookings, currentTime, className }: MeetingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [lastManualNavigation, setLastManualNavigation] = useState<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Filter out past bookings and get upcoming meetings
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.start_time) > currentTime
  )

  // Navigation functions
  const goToNext = () => {
    if (upcomingBookings.length <= 1) return
    setCurrentIndex((prevIndex) => (prevIndex + 1) % upcomingBookings.length)
    setLastManualNavigation(Date.now())
    setIsPlaying(false) // Pause auto-rotation temporarily
  }

  const goToPrevious = () => {
    if (upcomingBookings.length <= 1) return
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? upcomingBookings.length - 1 : prevIndex - 1
    )
    setLastManualNavigation(Date.now())
    setIsPlaying(false) // Pause auto-rotation temporarily
  }

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (!isPlaying || upcomingBookings.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % upcomingBookings.length
      )
    }, 5000) // 5 seconds per slide

    return () => clearInterval(interval)
  }, [isPlaying, upcomingBookings.length])

  // Resume auto-rotation after manual navigation (after 10 seconds of inactivity)
  useEffect(() => {
    if (!lastManualNavigation || isPlaying) return

    const resumeTimer = setTimeout(() => {
      setIsPlaying(true)
      setLastManualNavigation(null)
    }, 10000) // Resume after 10 seconds

    return () => clearTimeout(resumeTimer)
  }, [lastManualNavigation, isPlaying])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (upcomingBookings.length <= 1) return
      
      switch (event.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
          event.preventDefault()
          goToNext()
          break
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevious()
          break
        case 'Escape':
          event.preventDefault()
          setIsPlaying(!isPlaying)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [upcomingBookings.length, isPlaying])

  // Reset index if bookings change
  useEffect(() => {
    if (currentIndex >= upcomingBookings.length) {
      setCurrentIndex(0)
    }
  }, [upcomingBookings.length, currentIndex])

  // Format time for display
  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), "h:mm a")
  }

  // Calculate meeting duration
  const getMeetingDuration = (startTime: string, endTime: string) => {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
  }

  // If no upcoming bookings, show "Available" state
  if (upcomingBookings.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full", className)}>
                  <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.5 }}
            className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl p-8 md:p-12 text-center max-w-2xl w-full mx-auto"
          >
          <motion.div
            animate={shouldReduceMotion ? {} : { 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={shouldReduceMotion ? {} : { 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-brand-teal-500/20 dark:bg-brand-teal-400/20 rounded-full flex items-center justify-center"
          >
            <Calendar className="h-8 w-8 md:h-12 md:w-12 text-brand-teal-600 dark:text-brand-teal-400" />
          </motion.div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-3 md:mb-4">
            Room Available
          </h2>
          
          <p className="text-lg md:text-xl text-brand-navy-600 dark:text-brand-navy-400 leading-relaxed">
            No upcoming meetings scheduled for today
          </p>
          
          <motion.div
            animate={shouldReduceMotion ? {} : { width: ["0%", "100%", "0%"] }}
            transition={shouldReduceMotion ? {} : { 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-1 bg-brand-teal-500/50 rounded-full mt-6 md:mt-8 mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    )
  }

  const currentBooking = upcomingBookings[currentIndex]

  return (
         <div 
       className={cn("flex flex-col items-center justify-center h-full relative", className)}
       onMouseEnter={() => setIsPlaying(false)}
       onMouseLeave={() => setIsPlaying(true)}
       role="region"
       aria-label="Upcoming meetings carousel"
       aria-live="polite"
     >
       {/* Navigation Buttons - Screen Edge Positioned */}
       {upcomingBookings.length > 1 && (
         <>
           {/* Previous Button - Left Edge */}
           <motion.button
             onClick={goToPrevious}
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ 
               delay: shouldReduceMotion ? 0 : 0.3, 
               duration: shouldReduceMotion ? 0.1 : 0.5,
               ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
             }}
             whileHover={{ scale: 1.1, x: 10 }}
             whileTap={{ scale: 0.95 }}
             className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 backdrop-blur-md bg-white/95 dark:bg-brand-navy-800/95 border border-white/40 dark:border-brand-navy-600/60 rounded-full p-3 md:p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-teal-500 focus:ring-offset-2"
             aria-label="Previous meeting"
           >
             <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-brand-navy-700 dark:text-brand-navy-200" />
           </motion.button>

           {/* Next Button - Right Edge */}
           <motion.button
             onClick={goToNext}
             initial={{ opacity: 0, x: 50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ 
               delay: shouldReduceMotion ? 0 : 0.3, 
               duration: shouldReduceMotion ? 0.1 : 0.5,
               ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
             }}
             whileHover={{ scale: 1.1, x: -10 }}
             whileTap={{ scale: 0.95 }}
             className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 backdrop-blur-md bg-white/95 dark:bg-brand-navy-800/95 border border-white/40 dark:border-brand-navy-600/60 rounded-full p-3 md:p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-teal-500 focus:ring-offset-2"
             aria-label="Next meeting"
           >
             <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-brand-navy-700 dark:text-brand-navy-200" />
           </motion.button>
         </>
       )}
             {/* Main Carousel Container */}
       <div className="w-full max-w-4xl mx-auto relative">
                 <AnimatePresence mode="wait">
           <motion.div
             key={currentIndex}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ 
               duration: shouldReduceMotion ? 0.3 : 1.5,
               ease: "easeInOut"
             }}
             className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl hover:shadow-2xl transition-all duration-300 p-6 md:p-8"
           >
                         {/* Meeting Header */}
             <div className="text-center mb-8">
               <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ 
                   delay: shouldReduceMotion ? 0 : 0.4, 
                   duration: shouldReduceMotion ? 0.1 : 0.8,
                   ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
                 }}
                 className="text-2xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-3 md:mb-4 leading-tight"
               >
                 {currentBooking.title}
               </motion.h2>
               
               {currentBooking.description && (
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ 
                     delay: shouldReduceMotion ? 0 : 0.6, 
                     duration: shouldReduceMotion ? 0.1 : 0.8,
                     ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
                   }}
                   className="text-lg md:text-xl text-brand-navy-700 dark:text-brand-navy-300 leading-relaxed max-w-2xl mx-auto"
                 >
                   {currentBooking.description}
                 </motion.p>
               )}
             </div>

                         {/* Meeting Details */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ 
                 delay: shouldReduceMotion ? 0 : 0.8, 
                 duration: shouldReduceMotion ? 0.1 : 1.0,
                 ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
               }}
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
             >
               {/* Time */}
               <div className="flex items-center justify-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-brand-navy-50/50 dark:bg-brand-navy-900/30 border border-brand-navy-200/30 dark:border-brand-navy-600/30">
                 <Clock className="h-5 w-5 md:h-6 md:w-6 text-brand-navy-500 dark:text-brand-navy-400 flex-shrink-0" />
                 <div className="text-center min-w-0">
                   <div className="text-sm md:text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-100 truncate">
                     {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
                   </div>
                   <div className="text-xs md:text-sm text-brand-navy-600 dark:text-brand-navy-400">
                     Duration: {getMeetingDuration(currentBooking.start_time, currentBooking.end_time)}
                   </div>
                 </div>
               </div>

               {/* Organizer */}
               <div className="flex items-center justify-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-brand-teal-50/50 dark:bg-brand-teal-900/20 border border-brand-teal-200/30 dark:border-brand-teal-700/30">
                 <User className="h-5 w-5 md:h-6 md:w-6 text-brand-teal-600 dark:text-brand-teal-400 flex-shrink-0" />
                 <div className="text-center min-w-0">
                   <div className="text-sm md:text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-100 truncate">
                     {currentBooking.users?.name || "Unknown Organizer"}
                   </div>
                   <div className="text-xs md:text-sm text-brand-navy-600 dark:text-brand-navy-400">
                     Organizer
                   </div>
                 </div>
               </div>

               {/* Status */}
               <div className="flex items-center justify-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-brand-navy-50/50 dark:bg-brand-navy-900/30 border border-brand-navy-200/30 dark:border-brand-navy-600/30 sm:col-span-2 lg:col-span-1">
                 <div className="w-2 h-2 md:w-3 md:h-3 bg-brand-teal-500 rounded-full animate-pulse flex-shrink-0" />
                 <div className="text-center min-w-0">
                   <div className="text-sm md:text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-100">
                     Upcoming
                   </div>
                   <div className="text-xs md:text-sm text-brand-navy-600 dark:text-brand-navy-400">
                     Status
                   </div>
                 </div>
               </div>
             </motion.div>

                         {/* Progress Indicator */}
             {upcomingBookings.length > 1 && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ 
                   delay: shouldReduceMotion ? 0 : 1.0, 
                   duration: shouldReduceMotion ? 0.1 : 0.8,
                   ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
                 }}
                 className="flex items-center justify-center gap-2"
                 role="tablist"
                 aria-label="Meeting navigation"
               >
                 {upcomingBookings.map((_, index) => (
                   <button
                     key={index}
                     onClick={() => {
                       setCurrentIndex(index)
                       setLastManualNavigation(Date.now())
                       setIsPlaying(false)
                     }}
                     className={cn(
                       "h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-teal-500 focus:ring-offset-2 hover:scale-110",
                       index === currentIndex 
                         ? "w-8 bg-brand-teal-500 hover:bg-brand-teal-600" 
                         : "w-2 bg-brand-navy-300 dark:bg-brand-navy-600 hover:bg-brand-navy-400 dark:hover:bg-brand-navy-500"
                     )}
                     role="tab"
                     aria-selected={index === currentIndex}
                     aria-label={`Go to meeting ${index + 1}: ${upcomingBookings[index]?.title}`}
                   />
                 ))}
               </motion.div>
             )}
          </motion.div>
        </AnimatePresence>

        {/* Play/Pause Status Indicator */}
        {upcomingBookings.length > 1 && (
          <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10">
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-300",
              isPlaying 
                ? "bg-brand-teal-100/80 dark:bg-brand-teal-900/40 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200/50 dark:border-brand-teal-700/50"
                : "bg-brand-navy-100/80 dark:bg-brand-navy-800/40 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200/50 dark:border-brand-navy-600/50"
            )}>
              {isPlaying ? "Auto" : "Manual"}
            </div>
          </div>
        )}
      </div>

             {/* Meeting Counter and Instructions */}
       {upcomingBookings.length > 1 && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ 
             delay: shouldReduceMotion ? 0 : 1.2, 
             duration: shouldReduceMotion ? 0.1 : 0.8,
             ease: shouldReduceMotion ? "easeOut" : [0.25, 0.46, 0.45, 0.94]
           }}
           className="mt-6 text-center space-y-2"
         >
           <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400 font-medium">
             {currentIndex + 1} of {upcomingBookings.length} upcoming meetings
           </div>
           <div className="text-xs text-brand-navy-500 dark:text-brand-navy-500">
             Click arrows, dots, or use ← → keys to navigate • ESC to pause/resume
           </div>
         </motion.div>
       )}
    </div>
  )
}
