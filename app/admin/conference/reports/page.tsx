"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, Users, Building, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import type { Booking, Room, User } from "@/types"

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, roomsRes, usersRes] = await Promise.all([
          fetch("/api/bookings", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            },
          }),
          fetch("/api/rooms"),
          fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            },
          }),
        ])

        const bookingsData = await bookingsRes.json()
        const roomsData = await roomsRes.json()
        const usersData = await usersRes.json()

        setBookings(bookingsData)
        setRooms(roomsData)
        setUsers(usersData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter bookings based on time range
  const getFilteredBookings = () => {
    const days = Number.parseInt(timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return bookings.filter((booking) => new Date(booking.createdAt) >= cutoffDate)
  }

  // Room utilization data
  const getRoomUtilizationData = () => {
    const filteredBookings = getFilteredBookings()
    const roomUsage = rooms.map((room) => {
      const roomBookings = filteredBookings.filter((b) => b.roomId === room.id && b.status === "confirmed")
      return {
        name: room.name,
        bookings: roomBookings.length,
        capacity: room.capacity,
        utilization: Math.round((roomBookings.length / Math.max(1, Number.parseInt(timeRange))) * 100),
      }
    })
    return roomUsage.sort((a, b) => b.bookings - a.bookings)
  }

  // Booking trends data
  const getBookingTrendsData = () => {
    const filteredBookings = getFilteredBookings()
    const days = Number.parseInt(timeRange)
    const trendData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayBookings = filteredBookings.filter((booking) => {
        const bookingDate = new Date(booking.startTime).toISOString().split("T")[0]
        return bookingDate === dateStr
      })

      trendData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        bookings: dayBookings.length,
        confirmed: dayBookings.filter((b) => b.status === "confirmed").length,
        pending: dayBookings.filter((b) => b.status === "pending").length,
        cancelled: dayBookings.filter((b) => b.status === "cancelled").length,
      })
    }

    return trendData
  }

  // Department usage data
  const getDepartmentUsageData = () => {
    const filteredBookings = getFilteredBookings()
    const departmentUsage = new Map()

    filteredBookings.forEach((booking) => {
      const user = users.find((u) => u.id === booking.userId)
      if (user) {
        const current = departmentUsage.get(user.department) || 0
        departmentUsage.set(user.department, current + 1)
      }
    })

    return Array.from(departmentUsage.entries())
      .map(([department, count]) => ({
        name: department,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">Insights and analytics for conference room usage</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const filteredBookings = getFilteredBookings()
  const roomUtilizationData = getRoomUtilizationData()
  const bookingTrendsData = getBookingTrendsData()
  const departmentUsageData = getDepartmentUsageData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Insights and analytics for conference room usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(filteredBookings.length / Number.parseInt(timeRange))}</div>
            <p className="text-xs text-muted-foreground">Per day average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Room</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomUtilizationData[0]?.name.split(" ")[0] || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{roomUtilizationData[0]?.bookings || 0} bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filteredBookings.map((b) => b.userId)).size}</div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Daily booking activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: {
                  label: "Total Bookings",
                  color: "hsl(var(--chart-1))",
                },
                confirmed: {
                  label: "Confirmed",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bookings" stroke="var(--color-bookings)" strokeWidth={2} />
                  <Line type="monotone" dataKey="confirmed" stroke="var(--color-confirmed)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
            <CardDescription>Most frequently booked rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: {
                  label: "Bookings",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomUtilizationData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Usage</CardTitle>
            <CardDescription>Booking distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Important statistics and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Booking Success Rate</span>
              <span className="text-sm font-bold">
                {filteredBookings.length > 0
                  ? Math.round(
                      (filteredBookings.filter((b) => b.status === "confirmed").length / filteredBookings.length) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Booking Duration</span>
              <span className="text-sm font-bold">
                {filteredBookings.length > 0
                  ? Math.round(
                      (filteredBookings.reduce((sum, booking) => {
                        const duration =
                          (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) /
                          (1000 * 60 * 60)
                        return sum + duration
                      }, 0) /
                        filteredBookings.length) *
                        10,
                    ) / 10
                  : 0}
                h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Peak Booking Day</span>
              <span className="text-sm font-bold">
                {bookingTrendsData.length > 0
                  ? bookingTrendsData.reduce((max, day) => (day.bookings > max.bookings ? day : max)).date
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Room Utilization Rate</span>
              <span className="text-sm font-bold">
                {rooms.length > 0
                  ? Math.round(
                      (filteredBookings.filter((b) => b.status === "confirmed").length /
                        (rooms.length * Number.parseInt(timeRange))) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
