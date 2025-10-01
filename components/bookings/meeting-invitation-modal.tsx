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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  organizer?: {
    id: string
    name: string
    email: string
  } | null
  isOpen: boolean
  onClose: () => void
  onInvitationsSent: (invitations: MeetingInvitation[]) => void
}

export function MeetingInvitationModal({
  booking,
  room,
  organizer,
  isOpen,
  onClose,
  onInvitationsSent,
}: MeetingInvitationModalProps) {
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([{ name: "", email: "" }])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
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
      // Legacy state reset
      setEmailInput("")
      setInviteeEmails([])
      setEmailInputError(false)
      loadCurrentInvitations()
    } else {
      setAttendees([{ name: "", email: "" }])
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

    setIsLoadingInvitations(true)
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
    } finally {
      setIsLoadingInvitations(false)
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
      attendee.name && attendee.name.trim() && 
      attendee.email.trim() && 
      validateEmail(attendee.email.trim())
    )
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
    const totalAfterInvite = capacityInfo.currentCount + (organizer ? 1 : 0) + validAttendees.length // +1 for organizer if exists

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

  const sendInvitations = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    const validAttendees = getValidAttendees()
    if (!booking || validAttendees.length === 0) {
      toast({
        title: "No Valid Attendees",
        description: "Please add at least one attendee with a valid name and email address.",
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

      // Close modal first to provide immediate feedback
      onClose()
      
      // Small delay to ensure modal closes smoothly before any potential page updates
      setTimeout(() => {
        onInvitationsSent(newInvitations)
      }, 100)
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
  const totalAfterInvite = isLoadingInvitations ? 0 : (currentCount + (organizer ? 1 : 0) + validAttendees.length) // Show 0 while loading

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className={cn(
        "sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto",
        "rounded-lg border-0 shadow-xl",
        "bg-white dark:bg-gray-800",
        "p-0 mx-2 sm:mx-0",
        "w-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Invite Meeting Attendees
            </DialogTitle>
          </div>
 
        </div>

        {/* Meeting Details Panel */}
        <div className="mx-4 sm:mx-6 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
            {booking.title}
          </h4>
          
          {/* Attendee Count */}
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-500" />
            {isLoadingInvitations ? (
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {totalAfterInvite} attendees invited
              </span>
            )}
            </div>
          
          {/* Attendee List */}
          <div className="space-y-3">
            {/* Organizer */}
            {organizer && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                  {organizer.name ? organizer.name.charAt(0).toUpperCase() : organizer.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">{organizer.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{organizer.email}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium ml-2 flex-shrink-0">Organizer</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading Skeleton for Invitations */}
            {isLoadingInvitations ? (
              <>
                {/* Skeleton for first invitation */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                {/* Skeleton for second invitation */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Existing Invitations */}
                {currentInvitations.slice(0, 2).map((invitation, index) => (
                  <div key={invitation.id} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                      {invitation.invitee_name ? invitation.invitee_name.charAt(0).toUpperCase() : invitation.invitee_email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
                        {invitation.invitee_name || invitation.invitee_email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{invitation.invitee_email}</p>
                    </div>
                  </div>
                ))}
                
                {/* Show more if there are more invitations */}
                {currentInvitations.length > 2 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{currentInvitations.length - 2}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentInvitations.length - 2} more attendees
                      </p>
                    </div>
          </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Attendee Input Section */}
        <div className="mx-4 sm:mx-6 mb-4">
          {/* Input Fields */}
          <div className="space-y-3">
            {attendees.map((attendee, index) => (
              <div key={index} className="flex gap-2 sm:gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Name *"
                    type="text"
                    value={attendee.name}
                    onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                    className={cn(
                      "border-gray-300 focus:border-gray-400 focus:ring-0 text-sm sm:text-base",
                      attendee.name && attendee.name.trim().length === 0 && "border-red-500 focus:border-red-500"
                    )}
                  />
                  <Input
                    type="email"
                    placeholder="Email address *"
                    value={attendee.email}
                    onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                    className={cn(
                      "border-gray-300 focus:border-gray-400 focus:ring-0 text-sm sm:text-base",
                      attendee.email && !validateEmail(attendee.email) && "border-red-500 focus:border-red-500"
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={addAttendeeRow}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 border-gray-300 hover:bg-gray-50 flex-shrink-0"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Warning */}
        {totalAfterInvite > roomCapacity && (
          <div className="mx-4 sm:mx-6 mb-4">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                The total number of people ({totalAfterInvite}) exceeds the room capacity ({roomCapacity}). 
                Please remove some invitations or choose a larger room.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button 
            onClick={(e) => sendInvitations(e)} 
            disabled={validAttendees.length === 0 || isLoading || totalAfterInvite > roomCapacity}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
          >
            {isLoading ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
