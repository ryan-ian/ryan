"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterChip {
  key: string
  label: string
}

interface Room {
  id: string
  name: string
  count: number
}

interface FiltersToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  dateFilter: string
  onDateChange: (date: string) => void
  roomFilter: string
  onRoomChange: (room: string) => void
  availableRooms: Room[]
  activeFilters: FilterChip[]
  onClearFilter: (key: string) => void
  onClearAll: () => void
  showFilters: boolean
  onToggleFilters: (open: boolean) => void
  className?: string
}

export function FiltersToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  roomFilter,
  onRoomChange,
  availableRooms,
  activeFilters,
  onClearFilter,
  onClearAll,
  showFilters,
  onToggleFilters,
  className
}: FiltersToolbarProps) {
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, location, or facility..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-11 w-full"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters Popover */}
        <Popover open={showFilters} onOpenChange={onToggleFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-11 px-4 transition-all duration-200",
                hasActiveFilters && "border-brand-teal-500 dark:border-brand-teal-500"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-brand-teal-100 dark:bg-brand-teal-900/30 text-brand-teal-700 dark:text-brand-teal-300 text-xs px-1.5 py-0.5"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-3">
              {/* Status Filter */}
              <div className="w-full">
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 focus:ring-brand-teal-500 h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Room Filter */}
              <div className="w-full">
                <Select value={roomFilter} onValueChange={onRoomChange}>
                  <SelectTrigger className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 focus:ring-brand-teal-500 h-10">
                    <SelectValue placeholder="All rooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                    <SelectItem value="all">All Rooms</SelectItem>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} ({room.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="w-full">
                <Select value={dateFilter} onValueChange={onDateChange}>
                  <SelectTrigger className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 focus:ring-brand-teal-500 h-10">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="next-7-days">Next 7 Days</SelectItem>
                    <SelectItem value="next-30-days">Next 30 Days</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past Bookings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Footer Buttons */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800"
                >
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear All
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onToggleFilters(false)}
                  className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters section intentionally removed (we show only one chip row below) */}

      {/* Popover replaces collapsible; no additional section needed here */}

      {/* Active Filter Badges - matching Browse Rooms horizontal scrolling style */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="outline"
              className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
            >
              <span>{filter.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
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
