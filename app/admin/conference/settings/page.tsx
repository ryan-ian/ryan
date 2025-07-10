"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RefreshCw, Mail, Bell, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    siteName: "Conference Hub",
    siteDescription: "Professional conference room booking system",
    adminEmail: "admin@conferencehub.com",
    supportEmail: "support@conferencehub.com",
    maxBookingDuration: "8",
    advanceBookingDays: "30",
    autoApproveBookings: true,
    allowCancellation: true,
    cancellationDeadline: "2",
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    bookingConfirmations: true,
    bookingReminders: true,
    cancellationNotices: true,
    adminAlerts: true,
    reminderHours: "24",
  })

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    requireApproval: false,
    sessionTimeout: "60",
    passwordMinLength: "8",
    requireSpecialChars: true,
    maxLoginAttempts: "5",
    lockoutDuration: "15",
  })

  const handleSaveSettings = async (section: string) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: `${section} settings have been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={systemSettings.siteName}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={systemSettings.adminEmail}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, adminEmail: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={systemSettings.siteDescription}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, siteDescription: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={systemSettings.supportEmail}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingDuration">Max Booking Duration (hours)</Label>
                <Select
                  value={systemSettings.maxBookingDuration}
                  onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, maxBookingDuration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve Bookings</Label>
                <p className="text-sm text-muted-foreground">Automatically approve new booking requests</p>
              </div>
              <Switch
                checked={systemSettings.autoApproveBookings}
                onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoApproveBookings: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Cancellation</Label>
                <p className="text-sm text-muted-foreground">Allow users to cancel their bookings</p>
              </div>
              <Switch
                checked={systemSettings.allowCancellation}
                onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, allowCancellation: checked }))}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings("General")} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Save General Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure email notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Enable email notifications system-wide</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Booking Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Send confirmation emails for new bookings</p>
                </div>
                <Switch
                  checked={notificationSettings.bookingConfirmations}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, bookingConfirmations: checked }))
                  }
                  disabled={!notificationSettings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Booking Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminder emails before meetings</p>
                </div>
                <Switch
                  checked={notificationSettings.bookingReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, bookingReminders: checked }))
                  }
                  disabled={!notificationSettings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cancellation Notices</Label>
                  <p className="text-sm text-muted-foreground">Send emails when bookings are cancelled</p>
                </div>
                <Switch
                  checked={notificationSettings.cancellationNotices}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, cancellationNotices: checked }))
                  }
                  disabled={!notificationSettings.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Admin Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send alerts to administrators</p>
                </div>
                <Switch
                  checked={notificationSettings.adminAlerts}
                  onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, adminAlerts: checked }))}
                  disabled={!notificationSettings.emailNotifications}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderHours">Reminder Time (hours before meeting)</Label>
              <Select
                value={notificationSettings.reminderHours}
                onValueChange={(value) => setNotificationSettings((prev) => ({ ...prev, reminderHours: value }))}
                disabled={!notificationSettings.emailNotifications || !notificationSettings.bookingReminders}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings("Notification")} disabled={loading}>
                <Mail className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and access control settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Admin Approval</Label>
                <p className="text-sm text-muted-foreground">All bookings require admin approval</p>
              </div>
              <Switch
                checked={securitySettings.requireApproval}
                onCheckedChange={(checked) => setSecuritySettings((prev) => ({ ...prev, requireApproval: checked }))}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, sessionTimeout: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <Select
                  value={securitySettings.passwordMinLength}
                  onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, passwordMinLength: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 characters</SelectItem>
                    <SelectItem value="8">8 characters</SelectItem>
                    <SelectItem value="12">12 characters</SelectItem>
                    <SelectItem value="16">16 characters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
              </div>
              <Switch
                checked={securitySettings.requireSpecialChars}
                onCheckedChange={(checked) =>
                  setSecuritySettings((prev) => ({ ...prev, requireSpecialChars: checked }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Select
                  value={securitySettings.maxLoginAttempts}
                  onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, maxLoginAttempts: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Select
                  value={securitySettings.lockoutDuration}
                  onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, lockoutDuration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleSaveSettings("Security")} disabled={loading}>
                <Shield className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Current system information and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Version</span>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database Status</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email Service</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="text-sm text-muted-foreground">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Storage Used</span>
                  <span className="text-sm text-muted-foreground">2.3 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Update</span>
                  <span className="text-sm text-muted-foreground">1 week ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
