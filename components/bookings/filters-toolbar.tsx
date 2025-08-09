"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterChip {
  key: string
  label: string
}

interface FiltersToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  dateFilter: string
  onDateChange: (date: string) => void
  activeFilters: FilterChip[]
  onClearFilter: (key: string) => void
  onClearAll: () => void
  className?: string
}

export function FiltersToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  activeFilters,
  onClearFilter,
  onClearAll,
  className
}: FiltersToolbarProps) {
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" aria-hidden="true" />
          <Input
            placeholder="Search bookings by title or room..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Select value={dateFilter} onValueChange={onDateChange}>
            <SelectTrigger className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="default"
            onClick={onClearAll}
            className="w-full sm:w-auto border-brand-navy-200 dark:border-brand-navy-700"
          >
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-brand-navy-600 dark:text-brand-navy-400">
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>Active filters:</span>
          </div>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key}
              variant="secondary"
              className="bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-600 transition-colors"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2 hover:bg-transparent"
                onClick={() => onClearFilter(filter.key)}
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
