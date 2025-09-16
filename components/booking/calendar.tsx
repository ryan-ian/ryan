"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { shouldDisableDate, isSameDay, getDateRestrictionMessage } from "@/lib/booking-restrictions"

interface CalendarProps {
  className?: string
  selected?: Date | null
  onSelect?: (date: Date) => void
  bookedDates?: Date[]
}

export function Calendar({ 
  className, 
  selected, 
  onSelect, 
  bookedDates = [] 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(selected || new Date())
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return date < today
  }
  
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear
  }

  const isSameDayRestricted = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    return isSameDay(date)
  }

  const isDateRestricted = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    return shouldDisableDate(date)
  }
  
  const isSelected = (day: number) => {
    return selected && 
           selected.getDate() === day && 
           selected.getMonth() === currentMonth && 
           selected.getFullYear() === currentYear
  }
  
  const isBooked = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return bookedDates.some(bookedDate => {
      const booked = new Date(bookedDate)
      booked.setHours(0, 0, 0, 0)
      return booked.getTime() === date.getTime()
    })
  }
  
  const handleDateClick = (day: number) => {
    if (isPastDate(day) || isBooked(day) || isSameDayRestricted(day)) return
    
    const date = new Date(currentYear, currentMonth, day)
    onSelect?.(date)
  }
  
  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isPastDate(day)
      const isCurrentDay = isToday(day)
      const isSelectedDay = isSelected(day)
      const isBookedDay = isBooked(day)
      const isSameDay = isSameDayRestricted(day)
      const isDisabled = isPast || isBookedDay || isSameDay
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={cn(
            "h-10 w-10 rounded-lg text-sm font-medium transition-colors relative",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isSelectedDay && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isCurrentDay && !isSelectedDay && "bg-accent text-accent-foreground font-semibold",
            isDisabled && "text-muted-foreground cursor-not-allowed opacity-50",
            isBookedDay && "bg-destructive/10 text-destructive",
            isSameDay && "bg-amber-50 text-amber-700 border-2 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
            !isDisabled && "hover:bg-accent hover:text-accent-foreground"
          )}
          title={
            isPast ? "Cannot select past dates" :
            isBookedDay ? "This date is not available" :
            isSameDay ? "Same-day booking requires facility manager approval" :
            `Select ${monthNames[currentMonth]} ${day}, ${currentYear}`
          }
        >
          {day}
          {isSameDay && (
            <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-amber-600 dark:text-amber-400" />
          )}
        </button>
      )
    }
    
    return days
  }
  
  return (
    <div className={cn("p-4 bg-background border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-100 border-2 border-amber-200" />
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <span>Same-day (Manager approval)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  )
}
