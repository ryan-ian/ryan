'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Users, Clock, MapPin, CheckCircle, AlertCircle, Loader2, Send, Shield } from 'lucide-react'
import { format } from 'date-fns'
import * as types from '@/types'

function AttendanceContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('b')
  const token = searchParams.get('t')

  const [context, setContext] = useState<types.AttendanceContext | null>(null)
  const [attendees, setAttendees] = useState<types.AttendeeListItem[]>([])
  const [selectedAttendee, setSelectedAttendee] = useState<types.AttendeeListItem | null>(null)
  const [attendanceCode, setAttendanceCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sendingCodeForIds, setSendingCodeForIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState<'loading' | 'select' | 'code' | 'success'>('loading')

  // Load meeting context and attendee list
  useEffect(() => {
    async function loadData() {
      if (!bookingId || !token) {
        setError('Invalid QR code. Missing booking information.')
        setStep('select')
        setLoading(false)
        return
      }

      try {
        // Load meeting context
        const contextResponse = await fetch(`/api/meetings/${bookingId}/attendance/context`)
        if (!contextResponse.ok) {
          throw new Error('Failed to load meeting information')
        }
        const contextData = await contextResponse.json()
        setContext(contextData)

        // Check if QR should be visible
        if (!contextData.showQr) {
          setError('Attendance marking is not available at this time.')
          setStep('select')
          setLoading(false)
          return
        }

        // Load attendee list
        const attendeesResponse = await fetch(`/api/meetings/${bookingId}/attendance/attendees?t=${token}`)
        if (!attendeesResponse.ok) {
          throw new Error('Failed to load attendee list')
        }
        const attendeesData = await attendeesResponse.json()
        setAttendees(attendeesData.attendees || [])

        setStep('select')
      } catch (error) {
        console.error('Error loading attendance data:', error)
        setError('Failed to load meeting information. Please try scanning the QR code again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bookingId, token])

  // Send attendance code
  const handleSendCode = async (attendee: types.AttendeeListItem) => {
    setSendingCodeForIds(prev => new Set(prev).add(attendee.invitation_id))
    setError(null)

    try {
      const response = await fetch(`/api/meetings/${bookingId}/attendance/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_id: attendee.invitation_id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send attendance code')
      }

      setSelectedAttendee(attendee)
      setStep('code')
      setSuccess('Attendance code sent to your email!')
    } catch (error: any) {
      console.error('Error sending code:', error)
      setError(error.message || 'Failed to send attendance code')
    } finally {
      setSendingCodeForIds(prev => {
        const next = new Set(prev)
        next.delete(attendee.invitation_id)
        return next
      })
    }
  }

  // Verify attendance code
  const handleVerifyCode = async () => {
    if (!selectedAttendee || !attendanceCode) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/meetings/${bookingId}/attendance/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_id: selectedAttendee.invitation_id,
          code: attendanceCode
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Invalid attendance code')
      }

      // Update context with new occupancy
      if (result.occupancy && context) {
        setContext({
          ...context,
          occupancy: result.occupancy
        })
      }

      setStep('success')
      setSuccess('Attendance marked successfully!')
    } catch (error: any) {
      console.error('Error verifying code:', error)
      setError(error.message || 'Failed to verify attendance code')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset to attendee selection
  const handleBack = () => {
    setSelectedAttendee(null)
    setAttendanceCode('')
    setError(null)
    setSuccess(null)
    setStep('select')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading meeting information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Meeting Info Header */}
        {context && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Meeting Attendance</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {context.meeting.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{context.meeting.room_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(context.meeting.start_time), 'MMM d, h:mm a')} - {format(new Date(context.meeting.end_time), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>
                    {context.occupancy.present}/{context.occupancy.capacity} present
                  </span>
                  <Badge variant={context.occupancy.present > context.occupancy.capacity ? 'destructive' : 'secondary'}>
                    {context.occupancy.present > context.occupancy.capacity ? 'Over capacity' : 'Available'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-4" variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Attendee */}
        {step === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Name</CardTitle>
              <CardDescription>
                Choose your name from the list of accepted invitees to mark your attendance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attendees found for this meeting.</p>
                  <p className="text-sm mt-1">Please ensure you have accepted the meeting invitation.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendees.map((attendee) => (
                    <div
                      key={attendee.invitation_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {attendee.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{attendee.display_name}</p>
                          <div className="flex items-center gap-2">
                            {attendee.attendance_status === 'present' ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Present
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Not marked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendCode(attendee)}
                        disabled={sendingCodeForIds.has(attendee.invitation_id) || attendee.attendance_status === 'present'}
                        size="sm"
                      >
                        {sendingCodeForIds.has(attendee.invitation_id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : attendee.attendance_status === 'present' ? (
                          'Already marked'
                        ) : (
                          'Mark attendance'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Enter Code */}
        {step === 'code' && selectedAttendee && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Attendance Code</CardTitle>
              <CardDescription>
                We sent a 4-digit code to your email. Enter it below to mark your attendance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-medium">{selectedAttendee.display_name}</p>
                <p className="text-sm text-gray-500">Check your email for the attendance code</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <label htmlFor="code" className="block text-sm font-medium">
                  Attendance Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={attendanceCode}
                  onChange={(e) => setAttendanceCode(e.target.value)}
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={submitting || attendanceCode.length !== 4}
                  className="flex-1"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSendCode(selectedAttendee)}
                  disabled={sendingCodeForIds.has(selectedAttendee.invitation_id)}
                >
                  {sendingCodeForIds.has(selectedAttendee.invitation_id) ? 'Sending...' : 'Resend code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Attendance Marked!</h3>
              <p className="text-gray-600 mb-6">
                Your attendance has been successfully recorded for this meeting.
              </p>
              
              {context && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Current Occupancy</p>
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">
                      {context.occupancy.present}/{context.occupancy.capacity} present
                    </span>
                  </div>
                </div>
              )}

              {/* <Button onClick={handleBack} variant="outline">
                Mark Another Attendee
              </Button> */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  )
}

