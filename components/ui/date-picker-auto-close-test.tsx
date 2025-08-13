"use client"

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DatePickerAutoCloseTest() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectionCount, setSelectionCount] = useState(0)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectionCount(prev => prev + 1)
      // Auto-close the calendar immediately after date selection
      setIsCalendarOpen(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>📅 Date Picker Auto-Close Test</CardTitle>
        <CardDescription>
          Test the auto-close functionality - calendar should close immediately after selecting a date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-brand-navy-600 dark:text-brand-navy-400">
            Select Date
          </label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal border-brand-navy-200 dark:border-brand-navy-700"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Choose a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Test Results:</p>
            <p className="text-xs text-muted-foreground">
              Calendar Open: {isCalendarOpen ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-xs text-muted-foreground">
              Selections Made: {selectionCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Selected Date: {selectedDate ? format(selectedDate, 'PPP') : 'None'}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-2">
          <Button 
            onClick={() => {
              setSelectedDate(null)
              setSelectionCount(0)
              setIsCalendarOpen(false)
            }}
            variant="outline"
            className="w-full"
          >
            Reset Test
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <p className="font-medium mb-1">🧪 Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Choose a date" to open the calendar</li>
            <li>Click on any future date</li>
            <li>Verify the calendar closes immediately</li>
            <li>Check that the selected date appears in the button</li>
            <li>Repeat multiple times to test consistency</li>
          </ol>
          <p className="mt-2 text-xs">
            ✅ <strong>Expected:</strong> Calendar should close instantly after date selection
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
