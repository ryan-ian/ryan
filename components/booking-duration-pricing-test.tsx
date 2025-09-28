'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle, Calculator, Clock, DollarSign } from 'lucide-react'
import { calculateBookingAmount, formatBookingDuration, formatDurationHours } from '@/lib/payment-utils'
import { calculateBookingCost } from '@/lib/utils'

/**
 * Test component to verify booking duration calculation and proportional pricing fixes
 */
export default function BookingDurationPricingTest() {
  const [testResults, setTestResults] = useState<{
    [key: string]: 'pending' | 'pass' | 'fail'
  }>({})

  const [customTest, setCustomTest] = useState({
    startTime: '09:00',
    endTime: '09:30',
    hourlyRate: 100
  })

  const updateTestResult = (testId: string, result: 'pass' | 'fail') => {
    setTestResults(prev => ({ ...prev, [testId]: result }))
  }

  const getStatusIcon = (status: 'pending' | 'pass' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: 'pending' | 'pass' | 'fail') => {
    const variants = {
      pending: 'secondary',
      pass: 'default',
      fail: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} className="ml-2">
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  // Test scenarios with expected results
  const testScenarios = [
    {
      id: 'test-30min',
      title: '30-Minute Booking',
      description: 'Test 30-minute booking should charge 0.5 hours (50% of hourly rate)',
      startTime: '09:00',
      endTime: '09:30',
      hourlyRate: 100,
      expectedDuration: '30 minutes',
      expectedHours: '0.5 hours',
      expectedCost: 50
    },
    {
      id: 'test-15min',
      title: '15-Minute Booking',
      description: 'Test 15-minute booking should charge 0.25 hours (25% of hourly rate)',
      startTime: '10:00',
      endTime: '10:15',
      hourlyRate: 200,
      expectedDuration: '15 minutes',
      expectedHours: '0.25 hours',
      expectedCost: 50
    },
    {
      id: 'test-45min',
      title: '45-Minute Booking',
      description: 'Test 45-minute booking should charge 0.75 hours (75% of hourly rate)',
      startTime: '14:00',
      endTime: '14:45',
      hourlyRate: 80,
      expectedDuration: '45 minutes',
      expectedHours: '0.75 hours',
      expectedCost: 60
    },
    {
      id: 'test-1hour',
      title: '1-Hour Booking',
      description: 'Test 1-hour booking should charge exactly 1 hour',
      startTime: '11:00',
      endTime: '12:00',
      hourlyRate: 150,
      expectedDuration: '1 hour',
      expectedHours: '1 hour',
      expectedCost: 150
    },
    {
      id: 'test-1.5hours',
      title: '1.5-Hour Booking',
      description: 'Test 1.5-hour booking should charge exactly 1.5 hours',
      startTime: '13:00',
      endTime: '14:30',
      hourlyRate: 120,
      expectedDuration: '1 hour 30 minutes',
      expectedHours: '1.5 hours',
      expectedCost: 180
    }
  ]

  const runTest = (scenario: typeof testScenarios[0]) => {
    const startDate = new Date(`2000-01-01T${scenario.startTime}:00`)
    const endDate = new Date(`2000-01-01T${scenario.endTime}:00`)

    // Test payment utils function
    const paymentCalc = calculateBookingAmount(startDate, endDate, scenario.hourlyRate)
    
    // Test utils function
    const costCalc = calculateBookingCost(scenario.hourlyRate, startDate, endDate, false)
    
    // Test duration formatting
    const durationDisplay = formatBookingDuration(startDate, endDate)
    const hoursDisplay = formatDurationHours(startDate, endDate)

    const results = {
      paymentAmount: Math.round(paymentCalc.totalAmount * 100) / 100,
      costAmount: Math.round(costCalc.totalCost * 100) / 100,
      durationDisplay,
      hoursDisplay,
      expectedCost: scenario.expectedCost,
      expectedDuration: scenario.expectedDuration,
      expectedHours: scenario.expectedHours
    }

    return results
  }

  const runCustomTest = () => {
    const startDate = new Date(`2000-01-01T${customTest.startTime}:00`)
    const endDate = new Date(`2000-01-01T${customTest.endTime}:00`)

    const paymentCalc = calculateBookingAmount(startDate, endDate, customTest.hourlyRate)
    const durationDisplay = formatBookingDuration(startDate, endDate)
    const hoursDisplay = formatDurationHours(startDate, endDate)

    return {
      duration: durationDisplay,
      hours: hoursDisplay,
      cost: Math.round(paymentCalc.totalAmount * 100) / 100,
      actualHours: Math.round(paymentCalc.actualDurationHours * 100) / 100
    }
  }

  const customResults = runCustomTest()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 text-blue-500 mr-2" />
            Booking Duration & Pricing Test Suite
          </CardTitle>
          <CardDescription>
            Test suite to verify that booking duration calculations and proportional pricing are working correctly.
            30-minute bookings should charge 50% of the hourly rate, not a full hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">✅ Fixes Implemented</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Updated calculateBookingAmount() to use proportional pricing instead of Math.ceil()</li>
                <li>• Fixed payment modal duration display to show actual duration</li>
                <li>• Updated booking form cost calculation to use exact hours</li>
                <li>• Added proper duration formatting functions</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🎯 Expected Behavior</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 30 minutes = 0.5 hours = 50% of hourly rate</li>
                <li>• 15 minutes = 0.25 hours = 25% of hourly rate</li>
                <li>• 45 minutes = 0.75 hours = 75% of hourly rate</li>
                <li>• Duration displays show actual time (e.g., "30 minutes", not "1 hour")</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 text-purple-500 mr-2" />
            Custom Duration Test
          </CardTitle>
          <CardDescription>
            Test any duration and hourly rate to verify proportional pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={customTest.startTime}
                onChange={(e) => setCustomTest(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={customTest.endTime}
                onChange={(e) => setCustomTest(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (GHS)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={customTest.hourlyRate}
                onChange={(e) => setCustomTest(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Results:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium">{customResults.duration}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Decimal Hours:</span>
                <div className="font-medium">{customResults.hours}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Exact Hours:</span>
                <div className="font-medium">{customResults.actualHours}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Cost:</span>
                <div className="font-medium text-green-600">GHS {customResults.cost}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <div className="grid gap-6">
        {testScenarios.map((scenario) => {
          const results = runTest(scenario)
          const isPaymentCorrect = results.paymentAmount === scenario.expectedCost
          const isCostCorrect = results.costAmount === scenario.expectedCost
          const isDurationCorrect = results.durationDisplay === scenario.expectedDuration
          const isHoursCorrect = results.hoursDisplay === scenario.expectedHours
          
          const allCorrect = isPaymentCorrect && isCostCorrect && isDurationCorrect && isHoursCorrect

          return (
            <Card key={scenario.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{scenario.title}</span>
                  {getStatusBadge(testResults[scenario.id] || (allCorrect ? 'pass' : 'fail'))}
                </CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Time Range:</span>
                      <div className="font-medium">{scenario.startTime} - {scenario.endTime}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <div className="font-medium">GHS {scenario.hourlyRate}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Cost:</span>
                      <div className="font-medium text-green-600">GHS {scenario.expectedCost}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Duration:</span>
                      <div className="font-medium">{scenario.expectedDuration}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Test Results:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className={isDurationCorrect ? 'text-green-600' : 'text-red-600'}>
                        <span className="text-muted-foreground">Duration Display:</span>
                        <div className="font-medium">{results.durationDisplay}</div>
                        {!isDurationCorrect && <div className="text-xs">Expected: {scenario.expectedDuration}</div>}
                      </div>
                      <div className={isHoursCorrect ? 'text-green-600' : 'text-red-600'}>
                        <span className="text-muted-foreground">Hours Display:</span>
                        <div className="font-medium">{results.hoursDisplay}</div>
                        {!isHoursCorrect && <div className="text-xs">Expected: {scenario.expectedHours}</div>}
                      </div>
                      <div className={isPaymentCorrect ? 'text-green-600' : 'text-red-600'}>
                        <span className="text-muted-foreground">Payment Calc:</span>
                        <div className="font-medium">GHS {results.paymentAmount}</div>
                        {!isPaymentCorrect && <div className="text-xs">Expected: GHS {scenario.expectedCost}</div>}
                      </div>
                      <div className={isCostCorrect ? 'text-green-600' : 'text-red-600'}>
                        <span className="text-muted-foreground">Cost Calc:</span>
                        <div className="font-medium">GHS {results.costAmount}</div>
                        {!isCostCorrect && <div className="text-xs">Expected: GHS {scenario.expectedCost}</div>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTestResult(scenario.id, allCorrect ? 'pass' : 'fail')}
                      className={allCorrect ? 'text-green-600 border-green-600 hover:bg-green-50' : 'text-red-600 border-red-600 hover:bg-red-50'}
                    >
                      {allCorrect ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Auto-Pass
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Auto-Fail
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>
            Overall status of the booking duration and pricing fixes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries({
              pending: 'Pending',
              pass: 'Passed',
              fail: 'Failed'
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
