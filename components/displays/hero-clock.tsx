"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface HeroClockProps {
  now: Date
  className?: string
}

export function HeroClock({ now, className }: HeroClockProps) {
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const ampm = now.toLocaleTimeString([], { hour: '2-digit' }).toLowerCase().includes('am') ? 'AM' : (now.getHours() < 12 ? 'AM' : 'PM')
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className={cn(
      "text-center select-none",
      "px-8 py-6 rounded-2xl backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90",
      "border border-white/30 dark:border-brand-navy-700/50",
      "shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30",
      className
    )}>
      <div className="text-[68px] md:text-[84px] font-extrabold leading-none tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
        {time}
      </div>
      <div className="mt-2 text-sm uppercase tracking-widest text-brand-teal-600 dark:text-brand-teal-400 font-bold">{ampm}</div>
      <div className="mt-3 text-base md:text-lg font-semibold text-brand-navy-700 dark:text-brand-navy-300">{date}</div>
    </div>
  )
}

