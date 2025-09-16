"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  User,
  ExternalLink,
  Loader2
} from "lucide-react"
import { getNextAvailableDate, getFormattedDate } from "@/lib/booking-restrictions"
import { getFacilityManagerByRoomId } from "@/lib/facility-manager-lookup"
import type { Room } from "@/types"

interface EmergencyBookingMessageProps {
  room: Room
  selectedDate: Date
  onSelectTomorrow: () => void
  onContactManager?: () => void
}

interface FacilityManager {
  id: string
  email: string
  name: string
  facilityName: string
}

export function EmergencyBookingMessage({ 
  room, 
  selectedDate, 
  onSelectTomorrow,
  onContactManager 
}: EmergencyBookingMessageProps) {
  const [facilityManager, setFacilityManager] = useState<FacilityManager | null>(null)
  const [isLoadingManager, setIsLoadingManager] = useState(true)
  const [managerError, setManagerError] = useState<string | null>(null)

  const nextAvailableDate = getNextAvailableDate()
  const formattedSelectedDate = getFormattedDate(selectedDate)
  const formattedNextDate = getFormattedDate(nextAvailableDate)

  // Fetch facility manager information
  useEffect(() => {
    const fetchFacilityManager = async () => {
      setIsLoadingManager(true)
      setManagerError(null)

      try {
        const manager = await getFacilityManagerByRoomId(room.id)
        if (manager) {
          setFacilityManager(manager)
        } else {
          setManagerError("Facility manager contact not available")
        }
      } catch (error) {
        console.error('Error fetching facility manager:', error)
        setManagerError("Unable to load facility manager contact")
      } finally {
        setIsLoadingManager(false)
      }
    }

    fetchFacilityManager()
  }, [room.id])

  // Default fallback contact
  const defaultContact = {
    name: "Facility Manager",
    email: "manager@conferencehub.com",
    phone: "+233 XX XXX XXXX",
    department: "Facilities Management"
  }

  const contactInfo = facilityManager || defaultContact

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Emergency Booking Request - ${room.name}`)
    const body = encodeURIComponent(
      `Dear ${contactInfo.name},\n\n` +
      `I would like to request an emergency same-day booking for:\n\n` +
      `Room: ${room.name}\n` +
      `Location: ${room.location}\n` +
      `Date: ${formattedSelectedDate}\n` +
      `Capacity Needed: ${room.capacity} people\n` +
      `Facility: ${facilityManager?.facilityName || 'Conference Hub'}\n\n` +
      `Please let me know if this is possible and any requirements.\n\n` +
      `Thank you,\n` +
      `[Your Name]`
    )
    
    window.open(`mailto:${contactInfo.email}?subject=${subject}&body=${body}`)
    onContactManager?.()
  }

  const handlePhoneContact = () => {
    const phone = facilityManager ? 'tel:+233XXXXXXXXX' : `tel:${defaultContact.phone}`
    window.open(phone)
    onContactManager?.()
  }

  return (
    <div className="space-y-6">
      {/* Alert Card */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                Same-Day Booking Not Available
              </CardTitle>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Selected: {formattedSelectedDate}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Why advance booking is required:
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Facility managers need time to review and approve requests</li>
                  <li>• Room preparation and resource allocation requires planning</li>
                  <li>• Ensures optimal scheduling and prevents conflicts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onSelectTomorrow}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book for {formattedNextDate}
            </Button>
            
            <Badge variant="outline" className="px-3 py-2 text-center border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
              Earliest Available Date
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Manager Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                Need Emergency Booking?
              </CardTitle>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Contact the facility manager directly
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            {isLoadingManager ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Loading facility manager contact...
                </span>
              </div>
            ) : managerError ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {managerError}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Using default contact information below.
                </div>
              </div>
            ) : null}
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  {contactInfo.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {facilityManager?.facilityName || "Facilities Management"}
                </Badge>
                {facilityManager && (
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                    Verified Contact
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Mail className="h-4 w-4" />
                  <span>{contactInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Phone className="h-4 w-4" />
                  <span>{facilityManager ? 'Contact via email' : defaultContact.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleEmailContact}
              variant="outline"
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
            
            <Button
              onClick={handlePhoneContact}
              variant="outline"
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call Now
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>

          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 rounded-md p-3">
            <strong>Tip:</strong> Include your preferred time slots and meeting details when contacting the manager for faster approval.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
