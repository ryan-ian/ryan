"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Calendar Alignment Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Component</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              weekStartsOn={1}
              showOutsideDays={false}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Calendar with Outside Days</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              weekStartsOn={1}
              showOutsideDays={true}
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Selected Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {date ? format(date, "PPP") : "No date selected"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 