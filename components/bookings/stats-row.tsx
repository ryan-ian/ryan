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
  onFilterClick?: (filterKey: string) => void
  activeFilters?: string[]
}

export function StatsRow({
  total,
  today,
  upcoming,
  pending,
  loading = false,
  onFilterClick,
  activeFilters = []
}: StatsRowProps) {
  const handleFilterClick = (filterKey: string) => {
    if (onFilterClick) {
      onFilterClick(filterKey)
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        title="Total Bookings"
        value={total}
        icon={Calendar}
        variant="default"
        loading={loading}
        subtext="All time"
        clickable={!!onFilterClick}
        active={activeFilters.includes('all')}
        onClick={() => handleFilterClick('all')}
        filterKey="all"
      />

      <StatCard
        title="Today"
        value={today}
        icon={Clock}
        variant="info"
        loading={loading}
        subtext="Confirmed today"
        clickable={!!onFilterClick}
        active={activeFilters.includes('today')}
        onClick={() => handleFilterClick('today')}
        filterKey="today"
      />

      <StatCard
        title="Upcoming"
        value={upcoming}
        icon={CheckCircle}
        variant="success"
        loading={loading}
        subtext="Future confirmed"
        clickable={!!onFilterClick}
        active={activeFilters.includes('upcoming')}
        onClick={() => handleFilterClick('upcoming')}
        filterKey="upcoming"
      />

      <StatCard
        title="Pending"
        value={pending}
        icon={AlertCircle}
        variant="warning"
        loading={loading}
        subtext="Awaiting approval"
        clickable={!!onFilterClick}
        active={activeFilters.includes('pending')}
        onClick={() => handleFilterClick('pending')}
        filterKey="pending"
      />
    </div>
  )
}
