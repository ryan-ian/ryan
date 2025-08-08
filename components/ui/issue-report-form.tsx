"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Room, Booking } from "@/types"

interface IssueReportFormProps {
  room: Room
  booking?: Booking
  userId?: string
  onIssueReported?: () => void
  className?: string
}

const ISSUE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const COMMON_ISSUES = [
  "Projector not working",
  "Audio/Video equipment issues",
  "Air conditioning too hot/cold",
  "Lighting problems",
  "WiFi connectivity issues",
  "Furniture damaged or missing",
  "Room cleanliness issues",
  "Security/access problems"
]

export function IssueReportForm({ 
  room, 
  booking, 
  userId, 
  onIssueReported, 
  className 
}: IssueReportFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<string>("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setSubmitError("Please provide both a title and description")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/rooms/${room.id}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          booking_id: booking?.id,
          reported_by_user_id: userId
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        setTitle("")
        setDescription("")
        setPriority("medium")
        onIssueReported?.()
        
        // Close dialog after showing success
        setTimeout(() => {
          setSubmitSuccess(false)
          setIsOpen(false)
        }, 2000)
      } else {
        setSubmitError(data.error || 'Failed to submit issue report')
      }
    } catch (error) {
      console.error('Error submitting issue:', error)
      setSubmitError('Failed to submit issue report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommonIssueSelect = (issue: string) => {
    setTitle(issue)
    if (!description.trim()) {
      setDescription(`Issue with ${issue.toLowerCase()} in ${room.name}. Please provide more details about the problem.`)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <AlertCircle className="h-4 w-4 mr-2" />
          Report an Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Report a technical issue or problem with {room.name}.
            {booking && (
              <span className="block mt-1 text-sm">
                Related to booking: {booking.title}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-700 dark:text-green-300">
                Issue Reported Successfully
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your issue has been submitted and will be reviewed by the facilities team.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Common Issues */}
            <div>
              <Label className="text-sm font-medium">Common Issues</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COMMON_ISSUES.map((issue) => (
                  <Button
                    key={issue}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 text-xs text-left justify-start"
                    onClick={() => handleCommonIssueSelect(issue)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            {/* Issue Title */}
            <div>
              <Label htmlFor="issue-title">Issue Title *</Label>
              <Input
                id="issue-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="mt-1"
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="issue-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("text-xs", p.color)}>
                          {p.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Description */}
            <div>
              <Label htmlFor="issue-description">Description *</Label>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the issue, including steps to reproduce if applicable"
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {submitError}
              </div>
            )}
          </div>
        )}

        {!submitSuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!title.trim() || !description.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
