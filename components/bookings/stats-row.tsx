"use client"

import React from "react"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { StatCard } from "./stat-card"

interface StatsRowProps {
  total: number
  today: number
  upcoming: number
  pending: number
  loading?: boolean
}

export function StatsRow({ total, today, upcoming, pending, loading = false }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        title="Total Bookings"
        value={total}
        icon={Calendar}
        variant="default"
        loading={loading}
        subtext="All time"
      />
      
      <StatCard
        title="Today"
        value={today}
        icon={Clock}
        variant="info"
        loading={loading}
        subtext="Confirmed today"
      />
      
      <StatCard
        title="Upcoming"
        value={upcoming}
        icon={CheckCircle}
        variant="success"
        loading={loading}
        subtext="Future confirmed"
      />
      
      <StatCard
        title="Pending"
        value={pending}
        icon={AlertCircle}
        variant="warning"
        loading={loading}
        subtext="Awaiting approval"
      />
    </div>
  )
}
