"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { 
  Users, 
  Mail, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  Calendar,
  User
} from "lucide-react"
import type { Booking, Room, MeetingInvitation, MeetingAttendee } from "@/types"

interface MeetingInvitationModalProps {
  booking: Booking | null
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onInvitationsSent: (invitations: MeetingInvitation[]) => void
}

export function MeetingInvitationModal({
  booking,
  room,
  isOpen,
  onClose,
  onInvitationsSent,
}: MeetingInvitationModalProps) {
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([{ name: "", email: "" }])
  const [bulkInput, setBulkInput] = useState("")
  const [inputMode, setInputMode] = useState<"individual" | "bulk">("individual")
  const [isLoading, setIsLoading] = useState(false)
  const [currentInvitations, setCurrentInvitations] = useState<MeetingInvitation[]>([])
  const [capacityInfo, setCapacityInfo] = useState<{
    currentCount: number
    roomCapacity: number
  } | null>(null)
  const { toast } = useToast()

  // Legacy state for backward compatibility (can be removed later)
  const [emailInput, setEmailInput] = useState("")
  const [inviteeEmails, setInviteeEmails] = useState<string[]>([])
  const [emailInputError, setEmailInputError] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && booking) {
      setAttendees([{ name: "", email: "" }])
      setBulkInput("")
      setInputMode("individual")
      // Legacy state reset
      setEmailInput("")
      setInviteeEmails([])
      setEmailInputError(false)
      loadCurrentInvitations()
    } else {
      setAttendees([{ name: "", email: "" }])
      setBulkInput("")
      setCurrentInvitations([])
      setCapacityInfo(null)
      // Legacy state reset
      setEmailInput("")
      setInviteeEmails([])
      setEmailInputError(false)
    }
  }, [isOpen, booking])

  // Real-time email validation
  useEffect(() => {
    if (emailInput.trim()) {
      setEmailInputError(!validateEmail(emailInput.trim()))
    } else {
      setEmailInputError(false)
    }
  }, [emailInput])

  const loadCurrentInvitations = async () => {
    if (!booking) return

    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        console.error("No auth token available")
        return
      }

      const response = await fetch(`/api/meeting-invitations?bookingId=${booking.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        const invitations = await response.json()
        setCurrentInvitations(invitations)
        
        // Get capacity info
        const capacityResponse = await fetch(`/api/meeting-invitations/capacity-check?bookingId=${booking.id}&newInviteeCount=0`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (capacityResponse.ok) {
          const capacity = await capacityResponse.json()
          setCapacityInfo({
            currentCount: capacity.currentCount,
            roomCapacity: capacity.roomCapacity
          })
        }
      }
    } catch (error) {
      console.error("Error loading current invitations:", error)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email.trim())
  }

  // New attendee management functions
  const addAttendeeRow = () => {
    setAttendees([...attendees, { name: "", email: "" }])
  }

  const removeAttendeeRow = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index))
    }
  }

  const updateAttendee = (index: number, field: keyof MeetingAttendee, value: string) => {
    const updated = [...attendees]
    updated[index] = { ...updated[index], [field]: value }
    setAttendees(updated)
  }

  const getValidAttendees = (): MeetingAttendee[] => {
    return attendees.filter(attendee => 
      attendee.email.trim() && validateEmail(attendee.email.trim())
    )
  }

  const parseBulkInput = () => {
    if (!bulkInput.trim()) return

    const lines = bulkInput.trim().split('\n')
    const parsedAttendees: MeetingAttendee[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Try to parse "Name <email>" format
      const nameEmailMatch = trimmedLine.match(/^(.+?)\s*<(.+?)>$/)
      if (nameEmailMatch) {
        const [, name, email] = nameEmailMatch
        parsedAttendees.push({
          name: name.trim(),
          email: email.trim()
        })
      } else if (validateEmail(trimmedLine)) {
        // Just an email address
        parsedAttendees.push({
          name: "",
          email: trimmedLine
        })
      } else {
        // Try to parse "Name email" format (space separated)
        const parts = trimmedLine.split(/\s+/)
        if (parts.length >= 2) {
          const email = parts[parts.length - 1]
          if (validateEmail(email)) {
            const name = parts.slice(0, -1).join(' ')
            parsedAttendees.push({
              name: name.trim(),
              email: email.trim()
            })
          }
        }
      }
    }

    if (parsedAttendees.length > 0) {
      setAttendees(parsedAttendees)
      setBulkInput("")
      setInputMode("individual")
      toast({
        title: "Attendees Parsed",
        description: `Successfully parsed ${parsedAttendees.length} attendee${parsedAttendees.length !== 1 ? 's' : ''}.`,
      })
    } else {
      toast({
        title: "No Valid Attendees",
        description: "Please check your input format. Use 'Name <email>' or 'Name email' per line.",
        variant: "destructive",
      })
    }
  }

  const addEmail = () => {
    const input = emailInput.trim()

    if (!input) {
      toast({
        title: "Invalid Email",
        description: "Please enter an email address.",
        variant: "destructive",
      })
      return
    }

    // Handle comma-separated emails
    const emails = input.split(',').map(email => email.trim().toLowerCase()).filter(email => email)
    const validEmails: string[] = []
    const errors: string[] = []

    for (const email of emails) {
      if (!validateEmail(email)) {
        errors.push(`Invalid format: ${email}`)
        continue
      }

      if (inviteeEmails.includes(email)) {
        errors.push(`Already in list: ${email}`)
        continue
      }

      // Check if email is already invited
      if (currentInvitations.some(inv => inv.invitee_email === email)) {
        errors.push(`Already invited: ${email}`)
        continue
      }

      validEmails.push(email)
    }

    if (errors.length > 0) {
      toast({
        title: "Some emails could not be added",
        description: errors.join(', '),
        variant: "destructive",
      })
    }

    if (validEmails.length > 0) {
      setInviteeEmails([...inviteeEmails, ...validEmails])
      if (errors.length === 0) {
        toast({
          title: "Emails Added",
          description: `Added ${validEmails.length} email${validEmails.length > 1 ? 's' : ''} to the invitation list.`,
        })
      }
    }

    setEmailInput("")
  }

  const removeEmail = (emailToRemove: string) => {
    setInviteeEmails(inviteeEmails.filter(email => email !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  const checkCapacity = async (): Promise<boolean> => {
    if (!booking || !capacityInfo) return false

    const validAttendees = getValidAttendees()
    const totalAfterInvite = capacityInfo.currentCount + 1 + validAttendees.length // +1 for organizer

    if (totalAfterInvite > capacityInfo.roomCapacity) {
      toast({
        title: "Room Capacity Exceeded",
        description: `Cannot invite ${validAttendees.length} people. Room capacity is ${capacityInfo.roomCapacity}, and you already have ${capacityInfo.currentCount} invitations. Total would be ${totalAfterInvite} people (including organizer).`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const sendInvitations = async () => {
    const validAttendees = getValidAttendees()
    if (!booking || validAttendees.length === 0) {
      toast({
        title: "No Valid Attendees",
        description: "Please add at least one attendee with a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (!(await checkCapacity())) return

    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("Authentication required. Please log in again.")
      }

      const response = await fetch("/api/meeting-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          attendees: validAttendees,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invitations")
      }

      const newInvitations = await response.json()
      
      toast({
        title: "Invitations Sent",
        description: `Successfully sent ${validAttendees.length} meeting invitation${validAttendees.length > 1 ? 's' : ''}.`,
      })

      onInvitationsSent(newInvitations)
      onClose()
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!booking || !room) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const currentCount = capacityInfo?.currentCount || 0
  const roomCapacity = capacityInfo?.roomCapacity || room.capacity
  const validAttendees = getValidAttendees()
  const totalAfterInvite = currentCount + 1 + validAttendees.length // +1 for organizer

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto",
        "rounded-xl border backdrop-blur-md",
        "border-brand-navy-200 dark:border-brand-navy-700",
        "bg-white/95 dark:bg-brand-navy-800/95"
      )}>
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-teal-600" />
            Invite Meeting Attendees
          </DialogTitle>
          <DialogDescription className="text-brand-navy-600 dark:text-brand-navy-300">
            Send meeting invitations to team members and colleagues
          </DialogDescription>
        </DialogHeader>

        {/* Meeting Details Summary */}
        <div className="bg-brand-navy-50 dark:bg-brand-navy-900/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {booking.title}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-brand-navy-600 dark:text-brand-navy-300">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDate(booking.start_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {room.name}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {totalAfterInvite}/{roomCapacity} people
            </div>
          </div>
        </div>

        <Separator />

        {/* Capacity Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Room Capacity</Label>
            <Badge variant={totalAfterInvite > roomCapacity ? "destructive" : "secondary"}>
              {totalAfterInvite}/{roomCapacity} people
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all",
                totalAfterInvite > roomCapacity 
                  ? "bg-red-500" 
                  : totalAfterInvite > roomCapacity * 0.8 
                    ? "bg-yellow-500" 
                    : "bg-green-500"
              )}
              style={{ width: `${Math.min((totalAfterInvite / roomCapacity) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
            Includes organizer + {currentCount} existing invitations + {validAttendees.length} new invitations
          </p>
        </div>

        <Separator />

        {/* Attendee Input */}
        <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as "individual" | "bulk")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-4">
            <div className="space-y-3">
              <Label>Meeting Attendees</Label>
              {attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Name (optional)"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      type="email"
                      placeholder="Email address *"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      className={cn(
                        attendee.email && !validateEmail(attendee.email) && "border-red-500 focus:border-red-500"
                      )}
                    />
                  </div>
                  <div className="flex gap-1">
                    {index === attendees.length - 1 && (
                      <Button 
                        type="button" 
                        onClick={addAttendeeRow}
                        variant="outline"
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {attendees.length > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => removeAttendeeRow(index)}
                        variant="outline"
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Valid Attendees Preview */}
            {validAttendees.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Ready to Invite ({validAttendees.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {validAttendees.map((attendee, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {attendee.name ? `${attendee.name} <${attendee.email}>` : attendee.email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-input">Bulk Add Attendees</Label>
              <Textarea
                id="bulk-input"
                placeholder="Paste attendees here (one per line):
John Doe <john@example.com>
jane@example.com
Bob Smith bob@company.com"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <Button onClick={parseBulkInput} disabled={!bulkInput.trim()}>
                Parse Attendees
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Invitations */}
        {currentInvitations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Already Invited ({currentInvitations.length})</Label>
            <div className="flex flex-wrap gap-2">
              {currentInvitations.map((invitation) => (
                <Badge key={invitation.id} variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {invitation.invitee_name 
                    ? `${invitation.invitee_name} <${invitation.invitee_email}>` 
                    : invitation.invitee_email
                  }
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Capacity Warning */}
        {totalAfterInvite > roomCapacity && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              The total number of people ({totalAfterInvite}) exceeds the room capacity ({roomCapacity}). 
              Please remove some invitations or choose a larger room.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={sendInvitations} 
            disabled={validAttendees.length === 0 || isLoading || totalAfterInvite > roomCapacity}
            className="bg-brand-teal-600 hover:bg-brand-teal-700"
          >
            {isLoading ? "Sending..." : `Send ${validAttendees.length} Invitation${validAttendees.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
