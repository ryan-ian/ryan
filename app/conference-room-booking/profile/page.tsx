"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { User, Mail, Phone, Building, Calendar, Settings, Save, Edit, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  })
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
      })

      // Fetch user booking stats
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/bookings/user?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Could not fetch stats")
      const bookings = await response.json()
      
      const now = new Date()

      const upcoming = bookings.filter(
        (booking: any) => new Date(booking.start_time) > now && booking.status === "confirmed",
      )

      const completed = bookings.filter(
        (booking: any) => new Date(booking.end_time) < now && booking.status === "confirmed",
      )

      setStats({
        totalBookings: bookings.length,
        upcomingBookings: upcoming.length,
        completedBookings: completed.length,
      })
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
      toast({
        title: "Error",
        description: "Could not load booking statistics.",
        variant: "destructive"
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No authentication token available");
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          department: formData.department
        })
      })
      if (!response.ok) throw new Error("Failed to update profile")
      const updatedUser = await response.json()
      // Optionally update the user in context if needed
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
      })
    }
    setIsEditing(false)
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
          </div>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-1 space-y-8">
            <Card className="bg-card border-border/50">
              <CardContent className="p-6 text-center">
                <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-primary/20">
                  <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} alt={user.name} />
                  <AvatarFallback className="text-3xl">{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                <p className="text-muted-foreground">{user.position}</p>
                <Badge variant="secondary" className="mt-2 capitalize">{user.role}</Badge>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  Booking Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Bookings</span>
                  <span className="font-bold text-foreground">{stats.totalBookings}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Upcoming</span>
                  <span className="font-bold text-foreground">{stats.upcomingBookings}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-foreground">{stats.completedBookings}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Editable Form & Settings */}
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing} placeholder="Your phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={formData.department} onChange={(e) => handleInputChange("department", e.target.value)} disabled={!isEditing} placeholder="Your department" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your account preferences and actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
