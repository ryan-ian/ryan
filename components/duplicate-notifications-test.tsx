'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Test component to verify that duplicate notifications have been eliminated
 * This component provides manual testing tools for the notification system
 */
export default function DuplicateNotificationsTest() {
  const [testResults, setTestResults] = useState<{
    [key: string]: 'pending' | 'pass' | 'fail' | 'info'
  }>({})

  const updateTestResult = (testId: string, result: 'pass' | 'fail' | 'info') => {
    setTestResults(prev => ({ ...prev, [testId]: result }))
  }

  const getStatusIcon = (status: 'pending' | 'pass' | 'fail' | 'info') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: 'pending' | 'pass' | 'fail' | 'info') => {
    const variants = {
      pending: 'secondary',
      pass: 'default',
      fail: 'destructive',
      info: 'outline'
    } as const

    return (
      <Badge variant={variants[status]} className="ml-2">
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const testScenarios = [
    {
      id: 'new-booking',
      title: 'New Booking Request',
      description: 'Create a new booking and verify facility managers receive exactly 1 notification',
      instructions: [
        '1. Create a new booking request as a regular user',
        '2. Check facility manager notifications',
        '3. Verify exactly 1 "New Booking Request" notification appears',
        '4. Check admin notifications for the same booking',
        '5. Verify exactly 1 notification per admin'
      ]
    },
    {
      id: 'booking-approval',
      title: 'Booking Approval',
      description: 'Approve a booking and verify user receives exactly 1 confirmation notification',
      instructions: [
        '1. As facility manager, approve a pending booking',
        '2. Check the booking owner\'s notifications',
        '3. Verify exactly 1 "Booking Confirmed" notification appears',
        '4. Verify no duplicate confirmation notifications'
      ]
    },
    {
      id: 'booking-rejection',
      title: 'Booking Rejection',
      description: 'Reject a booking and verify user receives exactly 1 rejection notification',
      instructions: [
        '1. As facility manager, reject a pending booking',
        '2. Check the booking owner\'s notifications',
        '3. Verify exactly 1 "Booking Rejected" notification appears',
        '4. Verify no duplicate rejection notifications'
      ]
    },
    {
      id: 'cross-tab-sync',
      title: 'Cross-Tab Synchronization',
      description: 'Verify notifications appear consistently across multiple browser tabs',
      instructions: [
        '1. Open the application in 2-3 browser tabs',
        '2. Perform a booking action (create, approve, or reject)',
        '3. Verify the same notification appears in all tabs',
        '4. Verify notification count is consistent across tabs'
      ]
    }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Duplicate Notifications Elimination - Test Suite
          </CardTitle>
          <CardDescription>
            Manual testing suite to verify that duplicate notifications have been successfully eliminated.
            The notification system should now generate exactly one notification per event per recipient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Fixes Implemented</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Removed duplicate notification functions from lib/notifications.ts</li>
                <li>• Updated API routes to rely on Supabase database triggers</li>
                <li>• Eliminated redundant notification calls in booking workflows</li>
                <li>• Preserved unique notification types (reminders, maintenance, system)</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Expected Results</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• New booking requests: 1 notification per facility manager/admin</li>
                <li>• Booking confirmations: 1 notification per booking owner</li>
                <li>• Booking rejections: 1 notification per booking owner</li>
                <li>• Real-time updates: Consistent across all browser tabs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {testScenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{scenario.title}</span>
                {getStatusBadge(testResults[scenario.id] || 'pending')}
              </CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Test Instructions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {scenario.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTestResult(scenario.id, 'pass')}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTestResult(scenario.id, 'fail')}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Fail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTestResult(scenario.id, 'info')}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>
            Overall status of the duplicate notifications elimination testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries({
              pending: 'Pending',
              pass: 'Passed',
              fail: 'Failed',
              info: 'Notes'
            }).map(([status, label]) => {
              const count = Object.values(testResults).filter(result => result === status).length
              return (
                <div key={status} className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
