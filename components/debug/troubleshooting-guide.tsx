"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface TroubleshootingStep {
  id: string
  title: string
  description: string
  action?: () => Promise<void>
  status?: 'pending' | 'running' | 'success' | 'error'
  result?: string
}

export function TroubleshootingGuide() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<TroubleshootingStep[]>([
    {
      id: 'check-user',
      title: 'Verify User Authentication',
      description: 'Check if user is properly authenticated and has admin role',
      status: 'pending'
    },
    {
      id: 'check-facility',
      title: 'Check Managed Facilities',
      description: 'Verify user manages at least one facility',
      status: 'pending'
    },
    {
      id: 'check-rooms',
      title: 'Verify Room Access',
      description: 'Check if facility has rooms and user can access them',
      status: 'pending'
    },
    {
      id: 'check-bookings',
      title: 'Test Booking Data Fetch',
      description: 'Verify booking data can be retrieved from database',
      status: 'pending'
    },
    {
      id: 'check-status-filter',
      title: 'Test Status Filtering',
      description: 'Check if confirmed bookings are properly filtered',
      status: 'pending'
    },
    {
      id: 'check-date-filter',
      title: 'Test Date Range Filtering',
      description: 'Verify date range filtering is working correctly',
      status: 'pending'
    }
  ])

  const updateStepStatus = (stepId: string, status: TroubleshootingStep['status'], result?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, result }
        : step
    ))
  }

  const runDiagnostics = async () => {
    if (!user) return

    console.log('🔧 [Troubleshooting] Starting comprehensive diagnostics...')

    // Step 1: Check user authentication
    updateStepStatus('check-user', 'running')
    try {
      if (!user.id) {
        updateStepStatus('check-user', 'error', 'User ID is missing')
        return
      }
      if (user.role !== 'admin') {
        updateStepStatus('check-user', 'error', `User role is '${user.role}', expected 'admin'`)
        return
      }
      updateStepStatus('check-user', 'success', `User authenticated: ${user.name} (${user.email})`)
    } catch (error) {
      updateStepStatus('check-user', 'error', `Authentication error: ${error}`)
      return
    }

    // Step 2: Check managed facilities
    updateStepStatus('check-facility', 'running')
    try {
      const { getFacilitiesByManager } = await import('@/lib/supabase-data')
      const facilities = await getFacilitiesByManager(user.id)
      
      if (facilities.length === 0) {
        updateStepStatus('check-facility', 'error', 'No facilities found for this user')
        return
      }
      
      updateStepStatus('check-facility', 'success', `Found ${facilities.length} facility(ies): ${facilities.map(f => f.name).join(', ')}`)
      
      const facility = facilities[0]

      // Step 3: Check rooms
      updateStepStatus('check-rooms', 'running')
      const { getRoomsByFacilityManager } = await import('@/lib/supabase-data')
      const rooms = await getRoomsByFacilityManager(user.id)
      
      if (rooms.length === 0) {
        updateStepStatus('check-rooms', 'error', 'No rooms found for this facility')
        return
      }
      
      updateStepStatus('check-rooms', 'success', `Found ${rooms.length} room(s)`)

      // Step 4: Check bookings
      updateStepStatus('check-bookings', 'running')
      const { getAllBookingsByFacilityManager } = await import('@/lib/supabase-data')
      const bookings = await getAllBookingsByFacilityManager(user.id)
      
      updateStepStatus('check-bookings', 'success', `Found ${bookings.length} total booking(s)`)

      // Step 5: Check status filtering
      updateStepStatus('check-status-filter', 'running')
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
      const pendingBookings = bookings.filter(b => b.status === 'pending')
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled')
      
      const statusSummary = `Confirmed: ${confirmedBookings.length}, Pending: ${pendingBookings.length}, Cancelled: ${cancelledBookings.length}`
      
      if (confirmedBookings.length === 0 && pendingBookings.length > 0) {
        updateStepStatus('check-status-filter', 'error', `No confirmed bookings found. ${statusSummary}. This explains why reports show "No data available".`)
      } else {
        updateStepStatus('check-status-filter', 'success', statusSummary)
      }

      // Step 6: Check date filtering
      updateStepStatus('check-date-filter', 'running')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const recentConfirmedBookings = confirmedBookings.filter(b => {
        const bookingDate = new Date(b.start_time)
        return bookingDate >= thirtyDaysAgo && bookingDate <= now
      })
      
      updateStepStatus('check-date-filter', 'success', `${recentConfirmedBookings.length} confirmed bookings in last 30 days`)

    } catch (error) {
      console.error('🔧 [Troubleshooting] Error during diagnostics:', error)
      updateStepStatus('check-facility', 'error', `Error: ${error}`)
    }
  }

  const getStatusIcon = (status?: TroubleshootingStep['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status?: TroubleshootingStep['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              Troubleshooting Guide
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded border">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                Common Issue: "No data available" in Reports
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                If you see "All bookings are still pending approval" even after approving bookings, 
                this diagnostic tool will help identify the issue.
              </p>
              <Button onClick={runDiagnostics} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Diagnostics
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}.
                    </span>
                    {getStatusIcon(step.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{step.description}</div>
                      {step.result && (
                        <div className="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          {step.result}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(step.status)}>
                    {step.status || 'pending'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded border">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Quick Fixes
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• If no confirmed bookings: Check if bookings were actually approved (not just viewed)</li>
                <li>• If date range issues: Try selecting "Last 30 Days" or "Custom Range"</li>
                <li>• If real-time updates not working: Click the "Refresh Data" button manually</li>
                <li>• If persistent issues: Use the "Deep Debug" button in the Debug Panel above</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
