"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Bug, Database, RefreshCw, Eye } from "lucide-react"
import { getAllBookingsByFacilityManager, getFacilitiesByManager } from "@/lib/supabase-data"
import { useAuth } from "@/contexts/auth-context"
import type { BookingWithDetails, Facility } from "@/types"
import { debugReportsDataFlow, quickBookingTest, testReportsHook } from "@/lib/reports-debug"

interface DebugData {
  facilities: Facility[]
  allBookings: BookingWithDetails[]
  confirmedBookings: BookingWithDetails[]
  pendingBookings: BookingWithDetails[]
  cancelledBookings: BookingWithDetails[]
  recentlyUpdated: BookingWithDetails[]
  timestamp: string
}

export function BookingDebugPanel() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDebugData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log("🔍 [Debug] Starting debug data fetch for user:", user.id)

      // Get facilities
      const facilities = await getFacilitiesByManager(user.id)
      console.log("🏢 [Debug] Facilities:", facilities)

      // Get all bookings
      const allBookings = await getAllBookingsByFacilityManager(user.id)
      console.log("📅 [Debug] All bookings:", allBookings)

      // Filter by status
      const confirmedBookings = allBookings.filter(b => b.status === 'confirmed')
      const pendingBookings = allBookings.filter(b => b.status === 'pending')
      const cancelledBookings = allBookings.filter(b => b.status === 'cancelled')

      // Find recently updated bookings (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentlyUpdated = allBookings.filter(b => 
        new Date(b.updated_at) > yesterday
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      const debugData: DebugData = {
        facilities,
        allBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        recentlyUpdated,
        timestamp: new Date().toISOString()
      }

      console.log("🔍 [Debug] Debug data compiled:", debugData)
      setDebugData(debugData)
    } catch (error) {
      console.error("❌ [Debug] Error fetching debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <Bug className="h-5 w-5" />
              Booking Debug Panel
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={fetchDebugData} 
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? "Loading..." : "Fetch Debug Data"}
              </Button>
              
              {debugData && (
                <Button
                  onClick={() => console.log("🔍 [Debug] Full debug data:", debugData)}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Log to Console
                </Button>
              )}

              <Button
                onClick={() => user && debugReportsDataFlow(user.id)}
                size="sm"
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Deep Debug
              </Button>

              <Button
                onClick={() => quickBookingTest()}
                size="sm"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick Test
              </Button>

              <Button
                onClick={() => user && testReportsHook(user.id)}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Hook
              </Button>
            </div>

            {debugData && (
              <div className="space-y-4">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Last updated: {formatDate(debugData.timestamp)}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{debugData.allBookings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-2xl font-bold text-green-600">{debugData.confirmedBookings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Confirmed</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-2xl font-bold text-yellow-600">{debugData.pendingBookings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-2xl font-bold text-red-600">{debugData.cancelledBookings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Managed Facilities ({debugData.facilities.length})
                  </h4>
                  {debugData.facilities.map(facility => (
                    <div key={facility.id} className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                      <strong>{facility.name}</strong> - ID: {facility.id}
                    </div>
                  ))}
                </div>

                {/* Recently Updated Bookings */}
                <div>
                  <h4 className="font-semibold mb-2">Recently Updated Bookings (Last 24h)</h4>
                  {debugData.recentlyUpdated.length === 0 ? (
                    <div className="text-gray-500 italic">No recent updates</div>
                  ) : (
                    <div className="space-y-2">
                      {debugData.recentlyUpdated.slice(0, 5).map(booking => (
                        <div key={booking.id} className="bg-white dark:bg-gray-800 p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <strong className="text-sm">{booking.title}</strong>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>Room: {booking.rooms?.name}</div>
                            <div>User: {booking.users?.name} ({booking.users?.email})</div>
                            <div>Start: {formatDate(booking.start_time)}</div>
                            <div>Updated: {formatDate(booking.updated_at)}</div>
                            <div>ID: {booking.id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Bookings by Status */}
                <div>
                  <h4 className="font-semibold mb-2">All Bookings by Status</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {debugData.allBookings.map(booking => (
                      <div key={booking.id} className="bg-white dark:bg-gray-800 p-2 rounded border text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{booking.title}</span>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {booking.rooms?.name} • {formatDate(booking.start_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
