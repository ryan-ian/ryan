"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-right">
      <div className="text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 tracking-tight">
        {format(currentTime, 'HH:mm')}
      </div>
      <div className="text-lg font-medium text-brand-navy-600 dark:text-brand-navy-400">
        {format(currentTime, 'EEEE, MMMM d')}
      </div>
    </div>
  )
}

