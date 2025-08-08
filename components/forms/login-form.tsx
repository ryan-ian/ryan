"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Helper to redirect based on role
  const redirectByRole = (role: string) => {
    if (role === "admin") {
      router.push("/admin/conference/dashboard")
    } else if (role === "facility_manager") {
      router.push("/facility-manager")
    } else {
      router.push("/conference-room-booking")
    }
  }

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem("auth-token")
        if (token) {
          const { data, error } = await supabase.auth.getUser(token)
          if (!error && data.user) {
            // Fetch user profile for role
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.user.id)
              .single()
            if (!userError && userData?.role) {
              redirectByRole(userData.role)
              return
            }
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkExistingAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      // Sign in with Supabase directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        setError("Invalid credentials. Please try again.")
        setLoading(false)
        return
      }
      if (!data.session) {
        setError("Failed to create session")
        setLoading(false)
        return
      }
      // Get user profile data to check role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()
      if (userError || !userData?.role) {
        setError("Error fetching user data")
        setLoading(false)
        return
      }
      // Store the token in localStorage
      localStorage.setItem("auth-token", data.session.access_token)
      // Redirect based on role
      redirectByRole(userData.role)
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      {error && (
        <div>
          <Alert variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]" 
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
} 